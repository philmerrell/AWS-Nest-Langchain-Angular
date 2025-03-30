import * as cdk from 'aws-cdk-lib';

export interface AiTableStackProps extends cdk.StackProps {
  environmentName: 'Dev' | 'Test' | 'Prod';
  institutionName: string; 
}