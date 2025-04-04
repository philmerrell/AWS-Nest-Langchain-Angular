import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { AiChatTableStack } from './ai.chat.table-stack';
import { AiTableStackProps } from '../bin/ai.chat.table.props';

export interface AiChatLambdaStackProps extends AiTableStackProps {
    tablesStack: AiChatTableStack;
  }

export class AiChatLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AiChatLambdaStackProps) {
    super(scope, id, props);

    const { conversationsTable, messagesTable, sharedConversationsTable, sharedMessagesTable, modelPricingTable, modelsTable, userModelUsageTable, adminUsageAggregatesTable } = props.tablesStack;

    // Create environment variables object for Lambda
    const environment: Record<string, string> = {
      NODE_ENV: props.environmentName === 'Prod' ? 'production' : 'development',
      CONVERSATIONS_TABLE_NAME: conversationsTable.tableName,
      MESSAGES_TABLE_NAME: messagesTable.tableName, 
      SHARED_CONVERSATIONS_TABLE_NAME: sharedConversationsTable.tableName,
      SHARED_MESSAGES_TABLE_NAME: sharedMessagesTable.tableName,
      MODEL_PRICING_TABLE_NAME: modelPricingTable.tableName,
      MODELS_TABLE_NAME: modelsTable.tableName,
      USER_USAGE_TABLE_NAME: userModelUsageTable.tableName,
      ADMIN_AGGREGATES_TABLE_NAME: adminUsageAggregatesTable.tableName,
      
      // AWS Region for Bedrock
      BEDROCK_AWS_REGION: this.region,
      
      // Add any other environment variables needed for your application
    };

    // Create IAM role for Lambda function with required permissions
    const lambdaRole = new iam.Role(this, 'AiChatLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for Boise State AI Chat Lambda function',
    });

    // Add required managed policies
    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
    );
    
    // Add permissions for DynamoDB
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dynamodb:Query',
          'dynamodb:Scan',
          'dynamodb:BatchWriteItem',
          'dynamodb:BatchGetItem',
        ],
        resources: [
          `arn:aws:dynamodb:${this.region}:${this.account}:table/${props.environmentName}.${props.institutionName}.ai.*`,
          `arn:aws:dynamodb:${this.region}:${this.account}:table/${props.environmentName}.${props.institutionName}.ai.*/index/*`,
        ],
      })
    );

    // Add permissions for Bedrock
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
        ],
        resources: ['*'], // You may want to restrict this to specific model ARNs
      })
    );

    // Create Lambda function
    const lambdaFunction = new lambda.Function(this, 'AiChatLambdaFunction', {
      functionName: `${props.environmentName}-${props.institutionName}-ai-chat-api`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler', 
      code: lambda.Code.fromAsset('../ai.chat.api/dist'), // Point to your webpack output directory
      memorySize: 1024,
      timeout: cdk.Duration.minutes(5),
      environment,
      role: lambdaRole,
      tracing: lambda.Tracing.ACTIVE
    });

    // Create Lambda URL
    const functionUrl = lambdaFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE, // Use AWS_IAM for production
      invokeMode: lambda.InvokeMode.RESPONSE_STREAM
    });

    // Create CloudWatch Logs for Lambda function with appropriate retention
    new logs.LogGroup(this, 'AiChatLambdaLogs', {
      logGroupName: `/aws/lambda/${lambdaFunction.functionName}`,
      retention: props.environmentName === 'Prod'
        ? logs.RetentionDays.ONE_MONTH
        : logs.RetentionDays.ONE_WEEK,
      removalPolicy: props.environmentName === 'Prod'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    // Output the Lambda Function URL
    new cdk.CfnOutput(this, 'AiChatApiUrl', {
      value: functionUrl.url,
      description: 'URL endpoint for the AI Chat API',
      exportName: `${props.environmentName}-${props.institutionName}-ai-chat-api-url`,
    });
  }
}