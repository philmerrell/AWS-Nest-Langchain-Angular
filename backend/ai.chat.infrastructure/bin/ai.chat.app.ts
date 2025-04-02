#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AiChatTableStack } from '../lib/ai.chat.table-stack';
import { AiChatLambdaStack } from '../lib/ai.chat.lambda-stack';

const app = new cdk.App();

// Define environment variables
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

// Common props
const commonProps = {
  env,
  environmentName: (process.env.ENVIRONMENT as 'Dev' | 'Test' | 'Prod') || 'Dev',
  institutionName: process.env.INSTITUTION_NAME || 'BoiseState'
};

// Create the tables stack
const tablesStack = new AiChatTableStack(app, 'AiChatTableStack', {
  ...commonProps,
  stackName: `${commonProps.environmentName}-${commonProps.institutionName}-Ai-Chat-Tables`
});

// Create the API stack with a dependency on the tables stack
new AiChatLambdaStack(app, 'AiChatApiStack', {
  ...commonProps,
  stackName: `${commonProps.environmentName}-${commonProps.institutionName}-Ai-Chat-Api`,
  tablesStack // Pass the tables stack as a reference
});