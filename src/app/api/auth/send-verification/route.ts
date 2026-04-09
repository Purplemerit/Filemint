import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/user";
import { generateOTP } from "../../../utils/emailValidation";
import { sendVerificationEmail } from "../../../lib/emailService";
import { AUTH_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } from "../../../config/constants";
import { validator, ValidationSchemas } from "../../../lib/validation";
import { handleError, handleValidationError, handleSuccess, ApiError, HttpStatus } from "../../../lib/errorHandler";
import { logger } from "../../../lib/logger";

const SERVICE_NAME = 'AuthSendVerification';

/**
 * POST /api/auth/send-verification
 * Send/resend verification OTP email
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body schema
    const validation = validator.validate(body, ValidationSchemas.sendVerification);
    if (!validation.isValid) {
      logger.warn(SERVICE_NAME, 'Send verification validation failed', validation.errors);
      return handleValidationError(validation.errors);
    }

    const { email } = body;

    await connectDB();

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      logger.warn(SERVICE_NAME, 'Send verification attempt for non-existent user', { email });
      return handleError(
        new ApiError(HttpStatus.NOT_FOUND, ERROR_MESSAGES.AUTH_USER_NOT_FOUND),
        SERVICE_NAME
      );
    }

    // Check if already verified
    if (user.isEmailVerified) {
      logger.info(SERVICE_NAME, 'Send verification attempt for already verified email', { email });
      return handleError(
        new ApiError(HttpStatus.BAD_REQUEST, 'Email is already verified'),
        SERVICE_NAME
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + AUTH_CONFIG.OTP_EXPIRY_MS);

    // Save OTP to user
    user.emailVerificationToken = otp;
    user.emailVerificationExpires = expiresAt;
    await user.save();

    logger.info(SERVICE_NAME, 'OTP generated and saved', { email, userId: user._id });

    // Send verification email
    const emailResult = await sendVerificationEmail(user.email, user.firstName, otp);

    if (!emailResult.success) {
      logger.error(SERVICE_NAME, 'Failed to send verification email', emailResult.error);
      return handleError(
        new ApiError(HttpStatus.SERVER_ERROR, ERROR_MESSAGES.EMAIL_SEND_FAILED),
        SERVICE_NAME
      );
    }

    logger.info(SERVICE_NAME, 'Verification email sent successfully', { email });

    return handleSuccess(
      { email: user.email, expiresIn: AUTH_CONFIG.OTP_EXPIRY_MS / 1000 },
      SUCCESS_MESSAGES.EMAIL_VERIFICATION_SENT,
      HttpStatus.OK
    );

  } catch (error: any) {
    return handleError(error, SERVICE_NAME);
  }
}
