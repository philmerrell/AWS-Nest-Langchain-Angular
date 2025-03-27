// Create a service to handle usage limits
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { User } from 'src/auth/strategies/entra.strategy';

@Injectable()
export class UsageLimitService {
  private readonly ddbClient: DynamoDBClient;
  private readonly ddbDocClient: DynamoDBDocumentClient;
  
  // Define monthly individual limits by role (in dollars)
  private readonly individualRoleLimits = {
    'Students': 3, // $3/month for each student
    'Faculty': 20, // $20/month for each faculty member
    'Staff': 10,   // $10/month for each staff member
    'DotNetDevelopers': 0.3 // $50/month for each developer
  };

  constructor(private readonly configService: ConfigService) {
    this.ddbClient = new DynamoDBClient({});
    this.ddbDocClient = DynamoDBDocumentClient.from(this.ddbClient);
  }

  // Get the spending limit for a user based on their roles
  getUserMonthlyLimit(user: User): number {
    // If user has multiple roles, use the highest limit
    const highestLimit = Math.max(
      ...user.roles.map(role => this.individualRoleLimits[role] || 0)
    );
    
    return highestLimit;
  }

  // Check if a user has exceeded their monthly limit
  async hasExceededLimit(user: User): Promise<boolean> {
    const now = new Date();
    const yearMonth = now.toISOString().slice(0, 7); // YYYY-MM
    
    // Get the user's limit based on their role(s)
    const userLimit = this.getUserMonthlyLimit(user);
    
    if (userLimit === 0) return false; // No limit set or unlimited
    
    // Get current user's usage for the month from your existing table
    const result = await this.ddbDocClient.send(new GetCommand({
      TableName: this.configService.get('USER_USAGE_TABLE_NAME'),
      Key: {
        PK: `USER#${user.emplId}`,
        SK: `AGG#MONTH#${yearMonth}`,
      },
    }));
    
    const currentUsage = result.Item?.totalCost || 0;
    
    // Compare current usage with the limit
    return currentUsage >= userLimit;
  }
  
  // Get user's remaining budget
  async getRemainingBudget(user: User): Promise<number> {
    const now = new Date();
    const yearMonth = now.toISOString().slice(0, 7); // YYYY-MM
    
    const userLimit = this.getUserMonthlyLimit(user);
    
    // Get current usage
    const result = await this.ddbDocClient.send(new GetCommand({
      TableName: this.configService.get('USER_USAGE_TABLE_NAME'),
      Key: {
        PK: `USER#${user.emplId}`,
        SK: `AGG#MONTH#${yearMonth}`,
      },
    }));
    
    const currentUsage = result.Item?.totalCost || 0;
    
    // Calculate remaining budget
    return Math.max(0, userLimit - currentUsage);
  }
}