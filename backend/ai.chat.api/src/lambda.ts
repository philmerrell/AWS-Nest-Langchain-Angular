import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { Context, APIGatewayProxyEvent } from 'aws-lambda';
import serverlessExpress from '@vendia/serverless-express';
import { Response } from 'express';

// Initialize the NestJS app only once
let cachedApp: INestApplication;

async function bootstrapApp(): Promise<INestApplication> {
  if (cachedApp) {
    return cachedApp;
  }

  const app = await NestFactory.create(AppModule);

  // Apply helmet with adjusted settings for SSE
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for SSE
  }));

  // Enable CORS with appropriate settings for SSE
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    // Essential for SSE
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Last-Event-ID'],
    exposedHeaders: ['Content-Type', 'Cache-Control', 'Connection', 'Last-Event-ID'],
  });
  
  app.useGlobalPipes(new ZodValidationPipe());

  // Get configuration from ConfigService
  const configService = app.get(ConfigService);
  const apiPrefix = configService.get<string>('API_PREFIX');
  
  if (apiPrefix) {
    app.setGlobalPrefix(apiPrefix);
  }

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Boise State AI Chat API')
    .setDescription('API for Boise State AI chat application')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your Entra ID token',
        in: 'header',
      },
      'EntraID'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.init();
  cachedApp = app;
  
  return app;
}

// Custom function to handle SSE responses
function setupSSEConnection(response: Response): void {
  response.setHeader('Content-Type', 'text/event-stream');
  response.setHeader('Cache-Control', 'no-cache');
  response.setHeader('Connection', 'keep-alive');
  // Lambda keeps connections alive for max 14 seconds, so client should reconnect if needed
  // https://docs.aws.amazon.com/lambda/latest/dg/lambda-urls.html
  response.flushHeaders();
}

// Lambda handler for Function URL invocation
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
) => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  // Check if the request is for SSE (usually a GET with appropriate Accept header)
  const isSSERequest = 
    event.httpMethod === 'GET' && 
    (event.headers['Accept'] === 'text/event-stream' || 
     event.headers['accept'] === 'text/event-stream');

  if (isSSERequest) {
    // For SSE requests, we need to use a different approach
    // We'll initialize the NestJS app and let it handle the request directly
    const app = await bootstrapApp();
    const server = app.getHttpAdapter().getInstance();
    
    // Create a serverless wrapper that's aware of SSE
    const serverlessHandler = serverlessExpress({ app: server });
    const result = await serverlessHandler(event, context);
    
    // Ensure proper SSE headers in the response
    if (result.headers) {
      result.headers['Content-Type'] = 'text/event-stream';
      result.headers['Cache-Control'] = 'no-cache';
      result.headers['Connection'] = 'keep-alive';
    }
    
    return result;
  } else {
    // For non-SSE requests, use standard serverless-express handling
    const app = await bootstrapApp();
    const server = app.getHttpAdapter().getInstance();
    const serverlessHandler = serverlessExpress({ app: server });
    return serverlessHandler(event, context);
  }
};