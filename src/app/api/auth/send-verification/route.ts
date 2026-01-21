import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/user";
import { generateOTP } from "../../../utils/emailValidation";
import { sendVerificationEmail } from "../../../lib/emailService";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return NextResponse.json(
        { message: "Email is already verified" },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to user
    user.emailVerificationToken = otp;
    user.emailVerificationExpires = expiresAt;
    await user.save();

    // Send verification email
    const emailResult = await sendVerificationEmail(
      user.email,
      user.firstName,
      otp
    );

    if (!emailResult.success) {
      return NextResponse.json(
        { message: "Failed to send verification email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Verification code sent successfully. Please check your email.",
      expiresIn: 600, // 10 minutes in seconds
    });
  } catch (error: any) {
    console.error("Send verification error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to send verification email" },
      { status: 500 }
    );
  }
}
