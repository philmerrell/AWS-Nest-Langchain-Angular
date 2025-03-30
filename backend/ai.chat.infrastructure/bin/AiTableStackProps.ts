import * as cdk from 'aws-cdk-lib';

export interface AiTableStackProps extends cdk.StackProps {
  environment: string;
  institutionName: string; 
}