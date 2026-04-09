/**
 * API Error Handler
 * Provides consistent error responses across the application
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  LOCKED = 423,
  SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

export interface ApiErrorResponse {
  message: string;
  error?: string;
  status: number;
  timestamp?: string;
}

export class ApiError extends Error {
  constructor(
    public statusCode: HttpStatus,
    public message: string,
    public error?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleError(error: any, service: string, defaultStatus: HttpStatus = HttpStatus.SERVER_ERROR) {
  const timestamp = new Date().toISOString();
  let statusCode = defaultStatus;
  let message = error.message || 'An unexpected error occurred';
  let errorDetails = undefined;

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    errorDetails = error.error;
  } else if (error instanceof SyntaxError) {
    statusCode = HttpStatus.BAD_REQUEST;
    message = 'Invalid request body';
  } else if (error instanceof Error) {
    errorDetails = error.message;
  }

  // Log the error
  logger.error(service, message, error);

  const response: ApiErrorResponse = {
    message,
    status: statusCode,
    timestamp,
    ...(process.env.NODE_ENV === 'development' && errorDetails && { error: errorDetails }),
  };

  return NextResponse.json(response, { status: statusCode });
}

export function handleValidationError(errors: Record<string, string>) {
  return NextResponse.json(
    {
      message: 'Validation failed',
      errors,
      status: HttpStatus.BAD_REQUEST,
      timestamp: new Date().toISOString(),
    },
    { status: HttpStatus.BAD_REQUEST }
  );
}

export function handleSuccess<T>(data: T, message?: string, statusCode: HttpStatus = HttpStatus.OK) {
  return NextResponse.json(
    {
      message: message || 'Success',
      data,
      status: statusCode,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}
