import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configure as serverlessExpress } from '@vendia/serverless-express';
import { Handler, Context } from 'aws-lambda';
import { ConfigService } from '@nestjs/config';
import { ZodValidationPipe } from 'nestjs-zod';

// Type for Lambda URL event structure
interface LambdaFunctionUrlEvent {
  version: string;
  routeKey: string;
  rawPath: string;
  rawQueryString: string;
  headers: Record<string, string>;
  queryStringParameters?: Record<string, string>;
  requestContext: {
    accountId: string;
    apiId: string;
    domainName: string;
    domainPrefix: string;
    http: {
      method: string;
      path: string;
      protocol: string;
      sourceIp: string;
      userAgent: string;
    };
    requestId: string;
    routeKey: string;
    stage: string;
    time: string;
    timeEpoch: number;
  };
  body?: string;
  isBase64Encoded: boolean;
}

type LambdaResult = {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
  isBase64Encoded?: boolean;
}

let cachedServer: Handler;

async function bootstrap(): Promise<Handler> {
  if (cachedServer) {
    return cachedServer;
  }

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Apply global middleware, pipes, etc.
  app.useGlobalPipes(new ZodValidationPipe());
  app.enableCors({
    origin: '*', // Configure as needed for your security requirements
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const configService = app.get(ConfigService);

  // Set global prefix if needed
  const apiPrefix = configService.get('API_PREFIX');
  if (apiPrefix) {
    app.setGlobalPrefix(apiPrefix);
  }

  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  cachedServer = serverlessExpress({ app: expressApp });

  return cachedServer;
}

// Lambda handler for Lambda Function URL
export const handler: Handler = async (
  event: LambdaFunctionUrlEvent,
  context: Context,
) => {
  // For keeping the database connection alive
  context.callbackWaitsForEmptyEventLoop = false;
  
  // Transform the Lambda URL event to a format compatible with serverless-express
  // The serverless-express library expects an API Gateway V2 format event
  const transformedEvent = {
    version: '2.0',
    routeKey: event.routeKey,
    rawPath: event.rawPath,
    rawQueryString: event.rawQueryString,
    headers: event.headers,
    queryStringParameters: event.queryStringParameters || {},
    requestContext: {
      ...event.requestContext,
      http: event.requestContext.http,
    },
    body: event.body,
    isBase64Encoded: event.isBase64Encoded
  };
  
  try {
    const server = await bootstrap();
    const response = await server(transformedEvent, context);
    return response;
  } catch (error) {
    console.error('Error handling request:', error);
    
    // Return a formatted error response
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Configure as needed
        'Access-Control-Allow-Credentials': 'true',
      },
      body: JSON.stringify({ 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message
      }),
    } as LambdaResult;
  }
};