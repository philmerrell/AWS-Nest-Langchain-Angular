import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { AiTableStackProps } from '../bin/ai.chat.table.props';

export class AiChatTableStack extends cdk.Stack {

  // Expose tables as public properties
  public readonly conversationsTable: dynamodb.Table;
  public readonly messagesTable: dynamodb.Table;
  public readonly sharedConversationsTable: dynamodb.Table;
  public readonly sharedMessagesTable: dynamodb.Table;
  public readonly modelPricingTable: dynamodb.Table;
  public readonly modelsTable: dynamodb.Table;
  public readonly userModelUsageTable: dynamodb.Table;
  public readonly adminUsageAggregatesTable: dynamodb.Table;


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
    this.conversationsTable = new dynamodb.Table(this, `${props?.institutionName}.ai.Conversations.DynamoDB`, {
      tableName: `${props?.environmentName}.${props?.institutionName}.ai.Conversations`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // userId
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING }, // timestamp
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    this.conversationsTable.addGlobalSecondaryIndex({
      indexName: 'ConversationByKeyIndex',
      partitionKey: { name: 'conversationKey', type: dynamodb.AttributeType.STRING },
    });

    this.conversationsTable.addGlobalSecondaryIndex({
      indexName: 'StarredConversationsIndex',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, 
      sortKey: { name: 'isStarred', type: dynamodb.AttributeType.NUMBER }, // We'll use 1 for starred, 0 or not present for non-starred
      projectionType: dynamodb.ProjectionType.ALL
    });

    // Messages Table
    this.messagesTable = new dynamodb.Table(this, `${props?.institutionName}.ai.Messages.DynamoDB`, {
      tableName: `${props?.environmentName}.${props?.institutionName}.ai.Messages`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // userId#conversationId
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING }, // timestamp
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy
    });

    // Shared Conversations Table
    this.sharedConversationsTable = new dynamodb.Table(this, `${props?.institutionName}.ai.SharedConversations.DynamoDB`, {
      tableName: `${props?.environmentName}.${props?.institutionName}.ai.SharedConversations`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // sharedConversationId
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy
    });

    this.sharedConversationsTable.addGlobalSecondaryIndex({
      indexName: 'OwnerIdIndex',
      partitionKey: { name: 'ownerId', type: dynamodb.AttributeType.STRING }, // ownerId
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING }, // createdAt
    });

    // Shared Messages Table
    this.sharedMessagesTable = new dynamodb.Table(this, `${props?.institutionName}.ai.SharedMessages.DynamoDB`, {
      tableName: `${props?.environmentName}.${props?.institutionName}.ai.SharedMessages`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // sharedConversationId
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING }, // timestamp
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy
    });

    // Model Pricing Table
    this.modelPricingTable = new dynamodb.Table(this, `${props?.institutionName}.ai.ModelPricing.DynamoDB`, {
      tableName: `${props?.environmentName}.${props?.institutionName}.ai.ModelPricing`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy
    });

    // Models Table - used for UI model selection
    this.modelsTable = new dynamodb.Table(this, `${props?.institutionName}.ai.Models.DynamoDB`, {
      tableName: `${props?.environmentName}.${props?.institutionName}.ai.Models`,
      partitionKey: {
        name: 'PK', // modelId
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy
    });

    this.modelsTable.addGlobalSecondaryIndex({
      indexName: 'ModelsByRoleIndex',
      partitionKey: { name: 'allowedRole', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // User Model Usage Table
    this.userModelUsageTable = new dynamodb.Table(this, `${props?.institutionName}.ai.UserModelUsage.DynamoDB`, {
      tableName: `${props?.environmentName}.${props?.institutionName}.ai.UserModelUsage`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy
    });

    // Admin Usage Aggregates Table
    this.adminUsageAggregatesTable = new dynamodb.Table(this, `${props?.institutionName}.ai.AdminUsageAggregates`, {
      tableName: `${props?.environmentName}.${props?.institutionName}.ai.AdminUsageAggregates`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy
    });

    // Optional GSI for user lookup by ID in admin aggregates if needed
    this.adminUsageAggregatesTable.addGlobalSecondaryIndex({
      indexName: 'UserIdIndex',
      partitionKey: { name: 'emplId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
    });

    new cdk.CfnOutput(this, 'ConversationsTableName', {
      value: this.conversationsTable.tableName,
    });

    new cdk.CfnOutput(this, 'MessagesTableName', {
      value: this.messagesTable.tableName,
    });

    new cdk.CfnOutput(this, 'SharedConversationsTableName', {
      value: this.sharedConversationsTable.tableName,
    });

    new cdk.CfnOutput(this, 'SharedMessagesTableName', {
      value: this.sharedMessagesTable.tableName,
    });

    new cdk.CfnOutput(this, 'ModelPricingTableName', {
      value: this.modelPricingTable.tableName,
    });

    new cdk.CfnOutput(this, 'ModelsTableName', {
      value: this.modelsTable.tableName,
    });

    new cdk.CfnOutput(this, 'UserModelUsageTableName', {
      value: this.userModelUsageTable.tableName,
    });

    new cdk.CfnOutput(this, 'AdminUsageAggregatesTableName', {
      value: this.adminUsageAggregatesTable.tableName,
    });


    // Apply Tags to Resources
    [this.conversationsTable, this.messagesTable, this.sharedConversationsTable, this.sharedMessagesTable, this.modelPricingTable, this.modelsTable, this.userModelUsageTable, this.adminUsageAggregatesTable].forEach((table) => {
      Object.entries(tags).forEach(([key, value]) => {
        cdk.Tags.of(table).add(key, value);
      });
    });

  }

}
