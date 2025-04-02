import { NestFactory } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

// This file is only used for local development
// For Lambda deployment, lambda.ts is used instead

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
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

  await app.listen(process.env.PORT ?? 3000);
  
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();