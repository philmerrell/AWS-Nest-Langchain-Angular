import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { AiTableStackProps } from '../bin/ai.chat.table.props';

export class AiChatTableStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: AiTableStackProps) {
    super(scope, id, props);

    if (!['Dev', 'Test', 'Prod'].includes(props?.environmentName || '')) {
      throw new Error("The environmentName property must be one of 'Dev', 'Test', or 'Prod'.");
    }

    if (!/^[a-zA-Z]+$/.test(props?.institutionName || '')) {
      throw new Error('The environmentName property must contain only letters (a-z, A-Z) with no spaces.');
    }
    const removalPolicy = props?.environmentName.toLowerCase().includes('prod') ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY

    const tags = {
      Project: 'AiChat',
      Environment: `${props?.environmentName}`,
      Owner: ''
    };

    // Conversations Table
    const conversationsTable = new dynamodb.Table(this, `${props?.institutionName}.ai.Conversations.DynamoDB`, {
      tableName: `${props?.environmentName}.${props?.institutionName}.ai.Conversations`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // userId
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING }, // timestamp
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    conversationsTable.addGlobalSecondaryIndex({
      indexName: 'ConversationByKeyIndex',
      partitionKey: { name: 'conversationKey', type: dynamodb.AttributeType.STRING },
    });

    // Messages Table
    const messagesTable = new dynamodb.Table(this, `${props?.institutionName}.ai.Messages.DynamoDB`, {
      tableName: `${props?.environmentName}.${props?.institutionName}.ai.Messages`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // userId#conversationId
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING }, // timestamp
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy
    });

    // Shared Conversations Table
    const sharedConversationsTable = new dynamodb.Table(this, `${props?.institutionName}.ai.SharedConversations.DynamoDB`, {
      tableName: `${props?.environmentName}.${props?.institutionName}.ai.SharedConversations`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // sharedConversationId
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy
    });

    sharedConversationsTable.addGlobalSecondaryIndex({
      indexName: 'OwnerIdIndex',
      partitionKey: { name: 'ownerId', type: dynamodb.AttributeType.STRING }, // ownerId
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING }, // createdAt
    });

    // Shared Messages Table
    const sharedMessagesTable = new dynamodb.Table(this, `${props?.institutionName}.ai.SharedMessages.DynamoDB`, {
      tableName: `${props?.environmentName}.${props?.institutionName}.ai.SharedMessages`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // sharedConversationId
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING }, // timestamp
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy
    });

    // Model Pricing Table
    const modelPricingTable = new dynamodb.Table(this, `${props?.institutionName}.ai.ModelPricing.DynamoDB`, {
      tableName: `${props?.environmentName}.${props?.institutionName}.ai.ModelPricing`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy
    });

    // Models Table - used for UI model selection
    const modelsTable = new dynamodb.Table(this, `${props?.institutionName}.ai.Models.DynamoDB`, {
      tableName: `${props?.environmentName}.${props?.institutionName}.ai.Models`,
      partitionKey: {
        name: 'PK', // modelId
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy
    });

    modelsTable.addGlobalSecondaryIndex({
      indexName: 'ModelsByRoleIndex',
      partitionKey: { name: 'allowedRole', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // User Model Usage Table
    const userModelUsageTable = new dynamodb.Table(this, `${props?.institutionName}.ai.UserModelUsage.DynamoDB`, {
      tableName: `${props?.environmentName}.${props?.institutionName}.ai.UserModelUsage`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy
    });

    // Admin Usage Aggregates Table
    const adminUsageAggregatesTable = new dynamodb.Table(this, `${props?.institutionName}.ai.AdminUsageAggregates`, {
      tableName: `${props?.environmentName}.${props?.institutionName}.ai.AdminUsageAggregates`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy
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

    new cdk.CfnOutput(this, 'ModelPricingTableName', {
      value: modelPricingTable.tableName,
    });

    new cdk.CfnOutput(this, 'ModelsTableName', {
      value: modelsTable.tableName,
    });

    new cdk.CfnOutput(this, 'UserModelUsageTableName', {
      value: userModelUsageTable.tableName,
    });

    new cdk.CfnOutput(this, 'AdminUsageAggregatesTableName', {
      value: adminUsageAggregatesTable.tableName,
    });


    // Apply Tags to Resources
    [conversationsTable, messagesTable, sharedConversationsTable, sharedMessagesTable, modelPricingTable, modelsTable, userModelUsageTable, adminUsageAggregatesTable].forEach((table) => {
      Object.entries(tags).forEach(([key, value]) => {
        cdk.Tags.of(table).add(key, value);
      });
    });

  }

}
