import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/user";
import { validatePasswordStrength } from "../../../utils/emailValidation";

// Allow OAuth users to set a password for email/password login
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { message: passwordValidation.message },
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

    // Only allow OAuth users to set password
    if (user.provider === "credentials" && user.password) {
      return NextResponse.json(
        { message: "This account already has a password. Use password reset instead." },
        { status: 400 }
      );
    }

    // Set the password (will be hashed by pre-save hook)
    user.password = password;
    user.provider = "credentials"; // Change provider to credentials
    user.isEmailVerified = true; // OAuth users are already verified
    await user.save();

    return NextResponse.json({
      message: "Password set successfully! You can now login with email and password.",
      success: true,
    }, { status: 200 });

  } catch (error: any) {
    console.error("Set password error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to set password" },
      { status: 500 }
    );
  }
}
