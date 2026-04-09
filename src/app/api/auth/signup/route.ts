import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/user";
import { validateEmailDomain, validatePasswordStrength, generateOTP } from "../../../utils/emailValidation";
import { sendVerificationEmail } from "../../../lib/emailService";
import { AUTH_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } from "../../../config/constants";
import { validator, ValidationSchemas } from "../../../lib/validation";
import { handleError, handleValidationError, handleSuccess, ApiError, HttpStatus } from "../../../lib/errorHandler";
import { logger } from "../../../lib/logger";

const SERVICE_NAME = 'AuthSignup';

/**
 * POST /api/auth/signup
 * Handle user registration with email verification
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body schema
    const validation = validator.validate(body, ValidationSchemas.signup);
    if (!validation.isValid) {
      logger.warn(SERVICE_NAME, 'Signup validation failed', validation.errors);
      return handleValidationError(validation.errors);
    }

    const { firstName, lastName, email, password, termsAccepted } = body;

    // Additional validation: terms must be accepted
    if (!termsAccepted) {
      logger.warn(SERVICE_NAME, 'Signup attempt without terms acceptance', { email });
      return handleError(
        new ApiError(HttpStatus.BAD_REQUEST, 'You must accept the terms and conditions'),
        SERVICE_NAME
      );
    }

    // Validate email domain
    const emailValidation = validateEmailDomain(email);
    if (!emailValidation.isValid) {
      logger.warn(SERVICE_NAME, 'Invalid email domain', { email, reason: emailValidation.message });
      return handleError(
        new ApiError(HttpStatus.BAD_REQUEST, emailValidation.message || ERROR_MESSAGES.VALIDATION_INVALID_EMAIL),
        SERVICE_NAME
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      logger.warn(SERVICE_NAME, 'Invalid password strength', { email });
      return handleError(
        new ApiError(HttpStatus.BAD_REQUEST, passwordValidation.message || ERROR_MESSAGES.VALIDATION_INVALID_PASSWORD),
        SERVICE_NAME
      );
    }

    // Connect to MongoDB
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        logger.warn(SERVICE_NAME, 'Signup attempt with existing verified email', { email });
        return handleError(
          new ApiError(HttpStatus.CONFLICT, 'User already exists with this email'),
          SERVICE_NAME
        );
      } else {
        // User exists but not verified - resend verification
        logger.info(SERVICE_NAME, 'Resending verification to unverified user', { email });
        
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + AUTH_CONFIG.OTP_EXPIRY_MS);

        existingUser.emailVerificationToken = otp;
        existingUser.emailVerificationExpires = expiresAt;
        await existingUser.save();

        const emailResult = await sendVerificationEmail(existingUser.email, existingUser.firstName, otp);

        if (!emailResult.success) {
          logger.error(SERVICE_NAME, 'Failed to send verification email', emailResult.error);
          return handleError(
            new ApiError(HttpStatus.SERVER_ERROR, ERROR_MESSAGES.EMAIL_SEND_FAILED),
            SERVICE_NAME
          );
        }

        return handleSuccess(
          { email: existingUser.email, requiresVerification: true },
          'Account exists but not verified. A new verification code has been sent to your email.',
          HttpStatus.OK
        );
      }
    }

    // Generate OTP for email verification
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + AUTH_CONFIG.OTP_EXPIRY_MS);

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      termsAccepted,
      isEmailVerified: false,
      emailVerificationToken: otp,
      emailVerificationExpires: expiresAt,
      provider: "credentials",
    });

    // Save the new user
    await newUser.save();

    logger.info(SERVICE_NAME, 'New user created', { email, userId: newUser._id });

    // Send verification email
    const emailResult = await sendVerificationEmail(newUser.email, newUser.firstName, otp);

    if (!emailResult.success) {
      // Rollback user creation if email fails
      logger.error(SERVICE_NAME, 'Failed to send verification email, rolling back user', emailResult.error);
      await User.findByIdAndDelete(newUser._id);
      
      return handleError(
        new ApiError(HttpStatus.SERVER_ERROR, ERROR_MESSAGES.EMAIL_SEND_FAILED),
        SERVICE_NAME
      );
    }

    logger.info(SERVICE_NAME, 'Verification email sent successfully', { email });

    return handleSuccess(
      { email: newUser.email, requiresVerification: true },
      'Account created successfully! Please check your email for verification code.',
      HttpStatus.CREATED
    );

  } catch (error: any) {
    return handleError(error, SERVICE_NAME);
  }
}
