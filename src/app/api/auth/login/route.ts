import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import User from "../../../models/user";
import connectDB from "../../../lib/mongodb";
import { isAccountLocked, getLockTimeRemaining } from "../../../utils/emailValidation";
import { AUTH_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } from "../../../config/constants";
import { validator, ValidationSchemas } from "../../../lib/validation";
import { handleError, handleValidationError, handleSuccess, ApiError, HttpStatus } from "../../../lib/errorHandler";
import { logger } from "../../../lib/logger";

const SERVICE_NAME = 'AuthLogin';

// Handle POST requests to the login route
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body schema
    const validation = validator.validate(body, ValidationSchemas.login);
    if (!validation.isValid) {
      logger.warn(SERVICE_NAME, 'Login validation failed', validation.errors);
      return handleValidationError(validation.errors);
    }

    const { email, password } = body;

    // Connect to MongoDB
    await connectDB();

    // Find the user by email
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      logger.warn(SERVICE_NAME, `Login attempt with non-existent email: ${email}`);
      return handleError(
        new ApiError(HttpStatus.BAD_REQUEST, ERROR_MESSAGES.AUTH_USER_NOT_FOUND),
        SERVICE_NAME
      );
    }

    // Check if account is locked
    if (isAccountLocked(user)) {
      const remainingMinutes = getLockTimeRemaining(user);
      logger.warn(SERVICE_NAME, `Login attempt for locked account: ${email}`, { remainingMinutes });
      
      return NextResponse.json(
        {
          message: `${ERROR_MESSAGES.AUTH_ACCOUNT_LOCKED}. Try again in ${remainingMinutes} minutes.`,
          lockedUntil: user.lockUntil,
          status: HttpStatus.LOCKED,
          timestamp: new Date().toISOString(),
        },
        { status: HttpStatus.LOCKED }
      );
    }

    // Check if password exists (OAuth users might not have password)
    if (!user.password) {
      const providerName = user.provider === "google" ? "Google" : user.provider === "github" ? "GitHub" : "social account";
      logger.info(SERVICE_NAME, `OAuth user attempting password login: ${email}`, { provider: user.provider });
      
      return NextResponse.json(
        {
          message: `This account was created with ${providerName}. Please use the 'Continue with ${providerName}' button, or reset your password to login with email/password.`,
          provider: user.provider,
          canSetPassword: true,
          status: HttpStatus.BAD_REQUEST,
          timestamp: new Date().toISOString(),
        },
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    // Check if email is verified (only for credentials users)
    if (!user.isEmailVerified && user.provider === "credentials") {
      logger.info(SERVICE_NAME, `Unverified user login attempt: ${email}`);
      
      return NextResponse.json(
        {
          message: ERROR_MESSAGES.AUTH_EMAIL_NOT_VERIFIED,
          requiresVerification: true,
          email: user.email,
          status: HttpStatus.FORBIDDEN,
          timestamp: new Date().toISOString(),
        },
        { status: HttpStatus.FORBIDDEN }
      );
    }

    // Compare the provided password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      // Increment login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      // Lock account if max attempts reached
      if (user.loginAttempts >= AUTH_CONFIG.MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + AUTH_CONFIG.LOCK_TIME_MS);
        await user.save();

        logger.warn(SERVICE_NAME, `Account locked after max attempts: ${email}`, { attempts: user.loginAttempts });

        return NextResponse.json(
          {
            message: `${ERROR_MESSAGES.AUTH_ACCOUNT_LOCKED}. Account locked for ${AUTH_CONFIG.LOCK_TIME_MS / (60 * 1000)} minutes.`,
            status: HttpStatus.LOCKED,
            timestamp: new Date().toISOString(),
          },
          { status: HttpStatus.LOCKED }
        );
      }

      await user.save();

      const attemptsLeft = AUTH_CONFIG.MAX_LOGIN_ATTEMPTS - user.loginAttempts;
      logger.warn(SERVICE_NAME, `Failed login attempt: ${email}`, { attempt: user.loginAttempts, attempts_remaining: attemptsLeft });

      return NextResponse.json(
        {
          message: `${ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS}. You have ${attemptsLeft} attempts left.`,
          attemptsRemaining: attemptsLeft,
          status: HttpStatus.BAD_REQUEST,
          timestamp: new Date().toISOString(),
        },
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    // Successful login - reset login attempts
    if (user.loginAttempts > 0 || user.lockUntil) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
    }

    // Generate JWT token
    const signOptions: SignOptions = {
      expiresIn: AUTH_CONFIG.JWT_EXPIRY as any,
    };
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || '',
      signOptions
    );

    logger.info(SERVICE_NAME, `Successful login: ${email}`);

    // Send response with the token
    return handleSuccess(
      {
        token,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          subscriptionPlan: user.subscriptionPlan,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionEndDate: user.subscriptionEndDate,
          isEmailVerified: user.isEmailVerified,
        },
      },
      SUCCESS_MESSAGES.AUTH_LOGIN_SUCCESS,
      HttpStatus.OK
    );

  } catch (error: any) {
    return handleError(error, SERVICE_NAME);
  }
}
