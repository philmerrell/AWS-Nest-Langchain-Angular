import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { BoiseStateAIStackProps } from '../bin/BoiseStateAIStackProps';

export class AiChatInfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: BoiseStateAIStackProps) {
    super(scope, id, props);

    const tags = {
      Project: 'Dev-BoiseState.ai',
      Environment: `${props?.environment}`,
      Owner: 'WebTeam',
      Purpose: 'ConversationStorage'
    };

    // Conversations Table
    const conversationsTable = new dynamodb.Table(this, 'BoiseState.ai.Conversations.DynamoDB', {
      tableName: `${props?.environment}-BoiseState.ai.Conversations`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // userId
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING }, // timestamp
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    conversationsTable.addGlobalSecondaryIndex({
      indexName: 'ConversationByIdIndex',
      partitionKey: { name: 'conversationId', type: dynamodb.AttributeType.STRING },
    });

    // Messages Table
    const messagesTable = new dynamodb.Table(this, 'BoiseState.ai.Messages.DynamoDB', {
      tableName: `${props?.environment}-BoiseState.ai.Messages`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // userId#conversationId
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING }, // timestamp
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Shared Conversations Table
    const sharedConversationsTable = new dynamodb.Table(this, 'BoiseState.ai.SharedConversations.DynamoDB', {
      tableName: `${props?.environment}-BoiseState.ai.SharedConversations`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // sharedConversationId
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    sharedConversationsTable.addGlobalSecondaryIndex({
      indexName: 'OwnerIdIndex',
      partitionKey: { name: 'ownerId', type: dynamodb.AttributeType.STRING }, // ownerId
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING }, // createdAt
    });

    // Shared Messages Table
    const sharedMessagesTable = new dynamodb.Table(this, 'BoiseState.ai.SharedMessages.DynamoDB', {
      tableName: `${props?.environment}-SharedMessages`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // sharedConversationId
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING }, // timestamp
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    new cdk.CfnOutput(this, 'ConversationsTableName', {
      value: conversationsTable.tableName,
    });

    new cdk.CfnOutput(this, 'MessagesTableName', {
      value: messagesTable.tableName,
    });

    new cdk.CfnOutput(this, 'SharedConversationsTableName', {
      value: sharedConversationsTable.tableName,
    });

    new cdk.CfnOutput(this, 'SharedMessagesTableName', {
      value: sharedMessagesTable.tableName,
    });


    // Apply Tags to Resources
    [conversationsTable, messagesTable, sharedConversationsTable, sharedMessagesTable].forEach((table) => {
      Object.entries(tags).forEach(([key, value]) => {
        cdk.Tags.of(table).add(key, value);
      });
    });

  }

}
