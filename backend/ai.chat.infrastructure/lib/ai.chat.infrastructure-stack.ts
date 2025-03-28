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
      indexName: 'ConversationByKeyIndex',
      partitionKey: { name: 'conversationKey', type: dynamodb.AttributeType.STRING },
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
      tableName: `${props?.environment}-BoiseState.ai.SharedMessages`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // sharedConversationId
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING }, // timestamp
    });

    // Model Pricing Table
    const modelPricingTable = new dynamodb.Table(this, 'BoiseState.ai.ModelPricing.DynamoDB', {
      tableName: `${props?.environment}-BoiseState.ai.ModelPricing`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Models Table - used for UI model selection
    const modelsTable = new dynamodb.Table(this, 'BoiseState.ai.Models.DynamoDB', {
      tableName: `${props?.environment}-BoiseState.ai.Models`,
      partitionKey: {
        name: 'PK', // modelId
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Change to DESTROY for dev environments
    });

    modelsTable.addGlobalSecondaryIndex({
      indexName: 'ModelsByRoleIndex',
      partitionKey: { name: 'allowedRole', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // User Model Usage Table
    const userModelUsageTable = new dynamodb.Table(this, 'BoiseState.ai.UserModelUsage.DynamoDB', {
      tableName: `${props?.environment}-BoiseState.ai.UserModelUsage`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Admin Usage Aggregates Table
    const adminUsageAggregatesTable = new dynamodb.Table(this, 'BoiseState.ai.AdminUsageAggregates', {
      tableName: `${props?.environment}-BoiseState.ai.AdminUsageAggregates`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Optional GSI for user lookup by ID in admin aggregates if needed
    adminUsageAggregatesTable.addGlobalSecondaryIndex({
      indexName: 'UserIdIndex',
      partitionKey: { name: 'emplId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
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
    [conversationsTable, messagesTable, sharedConversationsTable, sharedMessagesTable, modelPricingTable, modelsTable, userModelUsageTable, adminUsageAggregatesTable].forEach((table) => {
      Object.entries(tags).forEach(([key, value]) => {
        cdk.Tags.of(table).add(key, value);
      });
    });

  }

}
