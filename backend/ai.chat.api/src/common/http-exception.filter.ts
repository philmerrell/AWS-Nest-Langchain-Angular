// src/common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    
    // Format the response
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
      message: typeof exceptionResponse === 'object' && 'message' in exceptionResponse 
        ? exceptionResponse['message']
        : exception.message,
      error: typeof exceptionResponse === 'object' && 'error' in exceptionResponse
        ? exceptionResponse['error']
        : 'Error'
    };

    response.status(status).json(errorResponse);
  }
}