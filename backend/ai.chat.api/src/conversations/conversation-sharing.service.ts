// src/conversations/conversation-sharing.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  QueryCommand, 
  GetCommand,
  BatchWriteCommand
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { ShareConversationDto } from './share-conversation.dto';
import { MessageService } from '../messages/message.service';
import { ConversationService } from './conversation.service';
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
      
      return result.Item;
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
      
      return result.Items || [];
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
      
      // Get all conversations shared with this user's email
      const sharedWithResult = await this.docClient.send(new QueryCommand({
        TableName: this.sharedConversationsTableName,
        FilterExpression: 'contains(shareWithEmails, :email)',
        ExpressionAttributeValues: { ':email': user.email },
      }));
      
      // Combine results (removing duplicates)
      const ownedItems = ownedResult.Items || [];
      const sharedWithItems = sharedWithResult.Items || [];
      
      // Use Map to ensure uniqueness by PK
      const combinedMap = new Map();
      
      [...ownedItems, ...sharedWithItems].forEach(item => {
        combinedMap.set(item.PK, {
          ...item,
          isOwner: item.ownerId === user.emplId,
        });
      });
      
      return Array.from(combinedMap.values());
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
}