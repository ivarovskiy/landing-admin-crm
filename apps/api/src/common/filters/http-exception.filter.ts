import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { requestId?: string }>();

    const requestId = req.requestId;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: unknown = 'Internal server error';
    let error: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse();

      if (typeof payload === 'string') {
        message = payload;
      } else if (payload && typeof payload === 'object') {
        const p = payload as any;
        message = p.message ?? exception.message;
        error = p.error;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message || message;
    }

    res.status(status).json({
      statusCode: status,
      error:
        error ??
        (status >= 500 ? 'InternalServerError' : 'RequestError'),
      message,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
      requestId,
    });
  }
}