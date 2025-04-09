// src/conversations/conversation-sharing.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  QueryCommand, 
  GetCommand,
  BatchWriteCommand,
  DeleteCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { ShareConversationDto } from '../conversations/share-conversation.dto';
import { MessageService } from '../messages/message.service';
import { ConversationService } from '../conversations/conversation.service';
import { User } from 'src/auth/strategies/entra.strategy';


@Injectable()
export class ConversationSharingService {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly sharedConversationsTableName: string;
  private readonly sharedMessagesTableName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly messageService: MessageService,
    private readonly conversationService: ConversationService
  ) {
    const client = new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(client);
    this.sharedConversationsTableName = this.configService.get<string>('SHARED_CONVERSATIONS_TABLE_NAME')!;
    this.sharedMessagesTableName = this.configService.get<string>('SHARED_MESSAGES_TABLE_NAME')!;
  }

  async importSharedConversationToUser(sharedConversationId: string, user: User): Promise<{conversationId: string}> {
    // 1. Get the shared conversation
    const sharedConv = await this.getSharedConversation(sharedConversationId);
    
    // 2. Get the messages
    const messages = await this.getSharedConversationMessages(sharedConversationId);
    
    // 3. Create a new conversation for the current user
    const newConversationId = uuidv4();
    const conversationName = `${sharedConv.title} (imported)`;
    
    // 4. Create the conversation
    await this.conversationService.createConversation(newConversationId, user);
    await this.conversationService.updateConversationName(user.emplId, newConversationId, conversationName);
    
    // 5. Add the messages to the conversation
    const formattedMessages = messages.map(msg => ({
      id: uuidv4(),
      role: msg.role,
      content: msg.content,
      reasoning: msg.reasoning
    }));
    
    await this.messageService.addToConversation(formattedMessages, newConversationId, user.emplId);
    
    return { conversationId: newConversationId };
  }

  async shareConversation(dto: ShareConversationDto, user: User): Promise<{ sharedConversationId: string }> {
    try {
      // Verify conversation exists and belongs to user
      const conversation = await this.conversationService.getConversationById(user.emplId, dto.conversationId);
      
      if (!conversation) {
        throw new Error('Conversation not found or access denied');
      }
      
      // Get conversation messages
      const messages = await this.messageService.getMessages(dto.conversationId, user.emplId);
      
      // Create a shared conversation ID
      const sharedConversationId = uuidv4();
      const now = new Date().toISOString();
      
      // Create shared conversation record
      await this.docClient.send(new PutCommand({
        TableName: this.sharedConversationsTableName,
        Item: {
          PK: sharedConversationId,
          title: conversation.name,
          ownerId: user.emplId,
          ownerEmail: user.email,
          ownerName: user.name,
          originalConversationId: dto.conversationId,
          shareWithEmails: dto.shareWithEmails || [],
          isPublic: dto.isPublic,
          expiresAt: dto.expiresAt,
          createdAt: now,
          updatedAt: now,
        },
      }));
      
      // Copy messages to shared messages table
      if (messages.length > 0) {
        const writeItems = messages.map((message, index) => ({
          PutRequest: {
            Item: {
              PK: sharedConversationId,
              SK: `${message.createdAt || new Date().toISOString()}#${index}`,
              id: uuidv4(),
              content: message.content,
              role: message.role,
              reasoning: message.reasoning,
            },
          },
        }));
        
        // Use BatchWrite to insert all messages at once
        const batchParams = {
          RequestItems: {
            [this.sharedMessagesTableName]: writeItems,
          },
        };
        
        await this.docClient.send(new BatchWriteCommand(batchParams));
      }
      
      return { sharedConversationId };
    } catch (error) {
      console.error('Error sharing conversation:', error);
      throw error;
    }
  }

  async getSharedConversation(sharedConversationId: string): Promise<any> {
    try {
      // Get shared conversation metadata
      const result = await this.docClient.send(new GetCommand({
        TableName: this.sharedConversationsTableName,
        Key: { PK: sharedConversationId },
      }));
      
      if (!result.Item) {
        throw new Error('Shared conversation not found');
      }
      
      // Check if expired
      if (result.Item.expiresAt && new Date(result.Item.expiresAt) < new Date()) {
        throw new Error('Shared conversation has expired');
      }
      
      return {
        conversationId: result.Item.PK,
        createdAt: result.Item.createdAt,
        isPublic: result.Item.isPublic,
        originalConversationId: result.Item.originalConversationId,
        ownerEmail: result.Item.ownerEmail,
        ownerId: result.Item.ownerId,
        ownerName: result.Item.ownerName,
        shareWithEmails: result.Item.shareWithEmails,
        title: result.Item.title,
        updatedAt: result.Item.updatedAt,
      };
    } catch (error) {
      console.error('Error getting shared conversation:', error);
      throw error;
    }
  }

  async getSharedConversationMessages(sharedConversationId: string): Promise<any[]> {
    try {
      // Verify shared conversation exists and is accessible
      await this.getSharedConversation(sharedConversationId);
      
      // Get shared messages
      const result = await this.docClient.send(new QueryCommand({
        TableName: this.sharedMessagesTableName,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: { ':pk': sharedConversationId },
        ScanIndexForward: true, // Sort by timestamp (oldest first)
      }));
      
      return (result.Items || []).map(({ PK, SK, ...otherAttributes }) => otherAttributes);
    } catch (error) {
      console.error('Error getting shared messages:', error);
      throw error;
    }
  }

  async getSharedConversationsForUser(user: User): Promise<any[]> {
    try {
      // Get all conversations shared by this user
      const ownedResult = await this.docClient.send(new QueryCommand({
        TableName: this.sharedConversationsTableName,
        IndexName: 'OwnerIdIndex',
        KeyConditionExpression: 'ownerId = :ownerId',
        ExpressionAttributeValues: { ':ownerId': user.emplId },
      }));
      
      // Combine results (removing duplicates)
      const ownedItems = ownedResult.Items || [];

      
      return ownedItems;
    } catch (error) {
      console.error('Error getting shared conversations:', error);
      throw error;
    }
  }

  async generateShareableLink(sharedConversationId: string): Promise<string> {
    // Verify shared conversation exists
    await this.getSharedConversation(sharedConversationId);
    
    // Generate a shareable link using the frontend URL
    const frontendUrl = this.configService.get('FRONTEND_URL');
    return `${frontendUrl}/shared/${sharedConversationId}`;
  }

  async updateSharedConversation(
    sharedConversationId: string, 
    updateDto: any, 
    user: User
  ): Promise<any> {
    try {
      // First, get the shared conversation to verify ownership
      const sharedConversation = await this.getSharedConversation(sharedConversationId);
      
      // Verify the user is the owner
      if (sharedConversation.ownerId !== user.emplId) {
        throw new Error('You do not have permission to update this shared conversation');
      }
      
      // Prepare update expression parts
      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {
        ':updatedAt': new Date().toISOString(),
      };
      
      // Add shareWithEmails if provided
      if (updateDto.shareWithEmails !== undefined) {
        updateExpressions.push('shareWithEmails = :shareWithEmails');
        expressionAttributeValues[':shareWithEmails'] = updateDto.shareWithEmails;
      }
      
      // Add isPublic if provided
      if (updateDto.isPublic !== undefined) {
        updateExpressions.push('isPublic = :isPublic');
        expressionAttributeValues[':isPublic'] = updateDto.isPublic;
      }
      
      // Handle expiresAt - can be set or removed
      if (updateDto.expiresAt !== undefined) {
        if (updateDto.expiresAt === null) {
          // Remove the expiresAt attribute
          updateExpressions.push('REMOVE expiresAt');
        } else {
          // Update the expiresAt attribute
          updateExpressions.push('expiresAt = :expiresAt');
          expressionAttributeValues[':expiresAt'] = updateDto.expiresAt;
        }
      }
      
      // Always update the updatedAt timestamp
      updateExpressions.push('updatedAt = :updatedAt');
      
      // Construct the full update expression
      const updateExpression = `SET ${updateExpressions.join(', ')}`;
      
      // Update the shared conversation
      const result = await this.docClient.send(new UpdateCommand({
        TableName: this.sharedConversationsTableName,
        Key: { PK: sharedConversationId },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      }));
      
      return result.Attributes;
    } catch (error) {
      console.error('Error updating shared conversation:', error);
      throw error;
    }
  }
  
  async deleteSharedConversation(sharedConversationId: string, user: User): Promise<void> {
    try {
      // First, get the shared conversation to verify ownership
      const sharedConversation = await this.getSharedConversation(sharedConversationId);
      
      // Verify the user is the owner
      if (sharedConversation.ownerId !== user.emplId) {
        throw new Error('You do not have permission to delete this shared conversation');
      }
      
      // Delete shared messages first
      const messagesResult = await this.docClient.send(new QueryCommand({
        TableName: this.sharedMessagesTableName,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: { ':pk': sharedConversationId },
      }));
      
      if (messagesResult.Items && messagesResult.Items.length > 0) {
        // Process in batches because DynamoDB has a limit of 25 operations per batch
        const batchSize = 25;
        for (let i = 0; i < messagesResult.Items.length; i += batchSize) {
          const batch = messagesResult.Items.slice(i, i + batchSize);
          
          const deleteRequests = batch.map(item => ({
            DeleteRequest: {
              Key: { 
                PK: item.PK,
                SK: item.SK
              }
            }
          }));
          
          await this.docClient.send(new BatchWriteCommand({
            RequestItems: {
              [this.sharedMessagesTableName]: deleteRequests
            }
          }));
        }
      }
      
      // Delete the shared conversation record
      await this.docClient.send(new DeleteCommand({
        TableName: this.sharedConversationsTableName,
        Key: { PK: sharedConversationId }
      }));
    } catch (error) {
      console.error('Error deleting shared conversation:', error);
      throw error;
    }
  }
}