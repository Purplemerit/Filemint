import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/user";
import { sendWelcomeEmail } from "../../../lib/emailService";
import { AUTH_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } from "../../../config/constants";
import { validator, ValidationSchemas } from "../../../lib/validation";
import { handleError, handleValidationError, handleSuccess, ApiError, HttpStatus } from "../../../lib/errorHandler";
import { logger } from "../../../lib/logger";

const SERVICE_NAME = 'AuthVerifyEmail';

/**
 * POST /api/auth/verify-email
 * Verify user email with OTP
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body schema
    const validation = validator.validate(body, ValidationSchemas.verifyEmail);
    if (!validation.isValid) {
      logger.warn(SERVICE_NAME, 'Email verification validation failed', validation.errors);
      return handleValidationError(validation.errors);
    }

    const { email, otp } = body;

    await connectDB();

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      logger.warn(SERVICE_NAME, 'Verification attempt for non-existent user', { email });
      return handleError(
        new ApiError(HttpStatus.NOT_FOUND, ERROR_MESSAGES.AUTH_USER_NOT_FOUND),
        SERVICE_NAME
      );
    }

    // Check if already verified
    if (user.isEmailVerified) {
      logger.info(SERVICE_NAME, 'Verification attempt for already verified email', { email });
      return handleError(
        new ApiError(HttpStatus.BAD_REQUEST, 'Email is already verified'),
        SERVICE_NAME
      );
    }

    // Check if OTP exists
    if (!user.emailVerificationToken) {
      logger.warn(SERVICE_NAME, 'Verification attempt with no OTP on file', { email });
      return handleError(
        new ApiError(HttpStatus.BAD_REQUEST, 'No verification code found. Please request a new one.'),
        SERVICE_NAME
      );
    }

    // Check if OTP is expired
    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      logger.warn(SERVICE_NAME, 'Verification attempt with expired OTP', { email });
      return handleError(
        new ApiError(HttpStatus.BAD_REQUEST, 'Verification code has expired. Please request a new one.'),
        SERVICE_NAME
      );
    }

    // Check if OTP matches
    if (user.emailVerificationToken !== otp) {
      logger.warn(SERVICE_NAME, 'Verification attempt with invalid OTP', { email });
      return handleError(
        new ApiError(HttpStatus.BAD_REQUEST, ERROR_MESSAGES.VALIDATION_INVALID_OTP),
        SERVICE_NAME
      );
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    logger.info(SERVICE_NAME, 'Email verified successfully', { email, userId: user._id });

    // Send welcome email (don't wait for it)
    sendWelcomeEmail(user.email, user.firstName).catch(err => {
      logger.error(SERVICE_NAME, 'Failed to send welcome email', err);
    });

    return handleSuccess(
      { email: user.email, userId: user._id },
      SUCCESS_MESSAGES.EMAIL_VERIFIED,
      HttpStatus.OK
    );

  } catch (error: any) {
    return handleError(error, SERVICE_NAME);
  }
}
