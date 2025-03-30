#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as dotenv from 'dotenv';
import { AiChatTableStack } from '../lib/ai.chat.table-stack';

// Load environment variables from .env file
dotenv.config();

const app = new cdk.App();
new AiChatTableStack(app, 'AiChatTableStack', {

  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  environment: process.env.ENVIRONMENT || 'dev',
  institutionName: process.env.INSTITUTION_NAME || 'BoiseState'
  
});