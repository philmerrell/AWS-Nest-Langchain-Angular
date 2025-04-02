#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AiClientStack } from '../lib/ai.client.infrastructure-stack';
import * as dotenv from 'dotenv';
dotenv.config();

const app = new cdk.App();
new AiClientStack(app, 'AiClientInfrastructureStack', {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

     // Domain information
    domainName: process.env.DOMAIN_NAME || '',
    subDomainName: process.env.SUB_DOMAIN_NAME || '',
    sslCertificateArn: process.env.SSL_CERT_ARN || '',
    environmentName: (process.env.ENVIRONMENT_NAME as 'Dev' | 'Test' | 'Prod'),

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});