/**
 * Application Configuration Constants
 * Centralized configuration for all hardcoded values
 */

// Auth Configuration
export const AUTH_CONFIG = {
  // Login Security
  MAX_LOGIN_ATTEMPTS: 5,
  LOCK_TIME_MS: 15 * 60 * 1000, // 15 minutes
  
  // OTP Configuration
  OTP_EXPIRY_MS: 10 * 60 * 1000, // 10 minutes
  OTP_LENGTH: 6,
  
  // JWT Configuration
  JWT_EXPIRY: '7d',
  JWT_ALGORITHM: 'HS256',
  
  // Email Configuration
  EMAIL_FROM_NAME: 'FileMint',
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || '587'),
  EMAIL_SECURE: process.env.EMAIL_SECURE === 'true',
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
};

// CORS Configuration
export const CORS_CONFIG = {
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Number'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// API Configuration
export const API_CONFIG = {
  MAX_FILE_UPLOAD_SIZE: 100 * 1024 * 1024, // 100MB
  REQUEST_TIMEOUT_MS: 30000, // 30 seconds
  BATCH_OPERATION_TIMEOUT_MS: 60000, // 60 seconds
};

// Error Messages
export const ERROR_MESSAGES = {
  // Auth Errors
  AUTH_INVALID_CREDENTIALS: 'Invalid email or password',
  AUTH_ACCOUNT_LOCKED: 'Account locked due to multiple failed attempts',
  AUTH_EMAIL_NOT_VERIFIED: 'Email verification required before login',
  AUTH_USER_NOT_FOUND: 'User not found',
  AUTH_INVALID_TOKEN: 'Invalid or expired token',
  
  // Validation Errors
  VALIDATION_INVALID_EMAIL: 'Invalid email format',
  VALIDATION_INVALID_PASSWORD: 'Password does not meet requirements',
  VALIDATION_REQUIRED_FIELD: 'This field is required',
  VALIDATION_INVALID_OTP: 'Invalid verification code',
  
  // Email Errors
  EMAIL_SEND_FAILED: 'Failed to send email',
  EMAIL_DISPOSABLE_DOMAIN: 'Temporary or disposable email addresses are not allowed',
  
  // General Errors
  SERVER_ERROR: 'An unexpected error occurred',
  INVALID_REQUEST: 'Invalid request',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  AUTH_LOGIN_SUCCESS: 'Login successful',
  AUTH_SIGNUP_SUCCESS: 'Account created successfully. Please verify your email.',
  AUTH_PASSWORD_SET: 'Password set successfully',
  EMAIL_VERIFIED: 'Email verified successfully',
  EMAIL_VERIFICATION_SENT: 'Verification email sent',
};

// Validation Rules
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_NUMBERS: true,
  PASSWORD_REQUIRE_SPECIAL: true,
  EMAIL_MAX_LENGTH: 254,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
};
