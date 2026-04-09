/**
 * FileMint - Quick Reference Guide for Developers
 * Common patterns and usage examples
 */

// ============================================================================
// 1. USING THE LOGGER
// ============================================================================

import { logger } from '../lib/logger';

const SERVICE_NAME = 'MyService';

// Log different levels
logger.debug(SERVICE_NAME, 'Debug information', { debugData: true });
logger.info(SERVICE_NAME, 'User created', { userId: '123', email: 'user@example.com' });
logger.warn(SERVICE_NAME, 'Invalid attempt', { reason: 'Missing field' });
logger.error(SERVICE_NAME, 'Operation failed', error);

// ============================================================================
// 2. USING VALIDATION
// ============================================================================

import { validator, ValidationSchemas } from '../lib/validation';

// Validate request body
const validation = validator.validate(body, ValidationSchemas.signup);
if (!validation.isValid) {
  return handleValidationError(validation.errors);
}

// Create custom schema
const customSchema = {
  email: { type: 'email' as const, required: true },
  age: { type: 'number' as const, required: false },
  username: { type: 'string' as const, required: true, minLength: 3, maxLength: 20 },
};

const result = validator.validate(data, customSchema);

// ============================================================================
// 3. USING ERROR HANDLING
// ============================================================================

import { handleError, handleValidationError, handleSuccess, ApiError, HttpStatus } from '../lib/errorHandler';

// Handle custom errors
return handleError(
  new ApiError(HttpStatus.BAD_REQUEST, 'User not found'),
  SERVICE_NAME
);

// Handle validation errors
return handleValidationError({ email: 'Invalid email format', password: 'Too short' });

// Handle success responses
return handleSuccess(
  { userId: '123', email: 'user@example.com' },
  'User created successfully',
  HttpStatus.CREATED
);

// ============================================================================
// 4. USING EMAIL SERVICE
// ============================================================================

import { sendEmail, sendVerificationEmail, sendWelcomeEmail } from '../lib/emailService';

// Send verification email (OTP)
await sendVerificationEmail('user@example.com', 'John', '123456');

// Send welcome email
await sendWelcomeEmail('user@example.com', 'John');

// Send custom email
await sendEmail('user@example.com', 'Subject', '<html>...</html>');

// ============================================================================
// 5. USING CONSTANTS & CONFIG
// ============================================================================

import { AUTH_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES, VALIDATION_RULES } from '../config/constants';

// Access auth configuration
const maxAttempts = AUTH_CONFIG.MAX_LOGIN_ATTEMPTS; // 5
const lockTime = AUTH_CONFIG.LOCK_TIME_MS; // 900000 (15 minutes)
const jwtSecret = AUTH_CONFIG.JWT_EXPIRY; // '7d'

// Access error messages
const message = ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS;

// Access validation rules
const minPassword = VALIDATION_RULES.PASSWORD_MIN_LENGTH; // 8

// ============================================================================
// 6. COMPLETE API ENDPOINT EXAMPLE
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import User from '../../../models/user';
import { validator, ValidationSchemas } from '../../../lib/validation';
import { handleError, handleValidationError, handleSuccess, ApiError, HttpStatus } from '../../../lib/errorHandler';
import { logger } from '../../../lib/logger';
import { AUTH_CONFIG } from '../../../config/constants';

const SERVICE_NAME = 'MyEndpoint';

export async function POST(req: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await req.json();
    const validation = validator.validate(body, ValidationSchemas.login);
    if (!validation.isValid) {
      logger.warn(SERVICE_NAME, 'Validation failed', validation.errors);
      return handleValidationError(validation.errors);
    }

    // 2. Extract validated data
    const { email, password } = body;

    // 3. Connect to database
    await connectDB();

    // 4. Perform business logic
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      logger.warn(SERVICE_NAME, 'User not found', { email });
      return handleError(
        new ApiError(HttpStatus.NOT_FOUND, 'User not found'),
        SERVICE_NAME
      );
    }

    // 5. Return success response
    logger.info(SERVICE_NAME, 'Operation successful', { userId: user._id });
    return handleSuccess(
      { id: user._id, email: user.email },
      'Operation successful',
      HttpStatus.OK
    );

  } catch (error: any) {
    // 6. Handle any errors
    return handleError(error, SERVICE_NAME);
  }
}

// ============================================================================
// 7. ADDING NEW VALIDATION SCHEMA
// ============================================================================

// In src/app/lib/validation.ts, add to ValidationSchemas object:
export const ValidationSchemas = {
  // ... existing schemas ...
  
  myNewSchema: {
    field1: { type: 'string' as const, required: true, minLength: 2 },
    field2: { type: 'email' as const, required: true },
    field3: { type: 'password' as const, required: false },
  },
};

// Then use in your endpoint:
import { validator, ValidationSchemas } from '../lib/validation';
const validation = validator.validate(body, ValidationSchemas.myNewSchema);

// ============================================================================
// 8. ADDING NEW CONSTANT
// ============================================================================

// In src/app/config/constants.ts, add to appropriate section:
export const NEW_CONFIG = {
  VALUE: 'some value',
  TIMEOUT: 5000,
};

// Export permanent constants:
export const MY_CONSTANT = 'value';

// Then import and use:
import { NEW_CONFIG, MY_CONSTANT } from '../config/constants';
const value = NEW_CONFIG.VALUE;

// ============================================================================
// 9. TESTING ENDPOINTS
// ============================================================================

import request from 'supertest';

describe('My Endpoint', () => {
  it('should return success response', async () => {
    const response = await request('http://localhost:3000')
      .post('/api/my-endpoint')
      .send({ field: 'value' })
      .expect(200);

    expect(response.body.message).toContain('success');
    expect(response.body.data).toBeDefined();
  });

  it('should return validation error', async () => {
    const response = await request('http://localhost:3000')
      .post('/api/my-endpoint')
      .send({ invalid: 'data' })
      .expect(400);

    expect(response.body.errors).toBeDefined();
  });
});

// ============================================================================
// 10. COMMON RESPONSE FORMATS
// ============================================================================

// Success Response (200)
{
  "message": "Operation successful",
  "data": { "id": "123", "name": "John" },
  "status": 200,
  "timestamp": "2024-01-20T10:30:00.000Z"
}

// Validation Error Response (400)
{
  "message": "Validation failed",
  "errors": {
    "email": "Invalid email format",
    "password": "Password too short"
  },
  "status": 400,
  "timestamp": "2024-01-20T10:30:00.000Z"
}

// API Error Response (400, 401, 403, 404, 500, etc.)
{
  "message": "User not found",
  "status": 404,
  "timestamp": "2024-01-20T10:30:00.000Z"
  // In development only:
  "error": "User document not in database"
}

// ============================================================================
// 11. ENVIRONMENT VARIABLES REFERENCE
// ============================================================================

// .env.local
MONGODB_URI=mongodb://localhost:27017/filemint
JWT_SECRET=your-secret-key
NODE_ENV=development

// Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

// CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

// ============================================================================
// 12. FILE ORGANIZATION TEMPLATE FOR NEW FEATURES
// ============================================================================

// src/app/api/myfeature/route.ts
import { NextRequest } from 'next/server';
import connectDB from '../../../lib/mongodb';
import { validator } from '../../../lib/validation';
import { handleError, handleSuccess, ApiError, HttpStatus } from '../../../lib/errorHandler';
import { logger } from '../../../lib/logger';
import { MY_CONFIG } from '../../../config/constants';

const SERVICE_NAME = 'MyFeature';

export async function POST(req: NextRequest) {
  try {
    // Validate
    const body = await req.json();
    const validation = validator.validate(body, { /* schema */ });
    if (!validation.isValid) return handleValidationError(validation.errors);

    // Connect & execute
    await connectDB();
    logger.info(SERVICE_NAME, 'Processing request');

    // Return result
    return handleSuccess({ /* data */ }, 'Success message');
  } catch (error) {
    return handleError(error, SERVICE_NAME);
  }
}

// ============================================================================
// 13. DEBUGGING TIPS
// ============================================================================

// Check logs in development:
// npm run dev
// Look for [INFO], [WARN], [ERROR] logs in terminal

// Check MongoDB:
// Connect to your MongoDB instance
// Check the 'users' collection for created records

// Test emails:
// Use `console.log()` in emailService to debug
// Or use a service like Mailtrap for email testing

// Test API:
// Use Postman or Thunder Client
// Check response status and body
// Review logs for errors

// ============================================================================

// For more details, see: IMPROVEMENTS_GUIDE.md
