import * as cdk from 'aws-cdk-lib';

export interface BoiseStateAIStackProps extends cdk.StackProps {
  environment: string;
}