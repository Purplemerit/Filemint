import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../../models/user";
import connectDB from "../../../lib/mongodb";
import { isAccountLocked, getLockTimeRemaining } from "../../../utils/emailValidation";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

// Handle POST requests to the login route
export async function POST(req: NextRequest) {
  try {
    // Connect to MongoDB
    await connectDB();

    const { email, password } = await req.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    // Find the user by email
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return NextResponse.json(
        { message: "No account found with this email. Please sign up first." },
        { status: 400 }
      );
    }

    // Check if account is locked
    if (isAccountLocked(user)) {
      const remainingMinutes = getLockTimeRemaining(user);
      return NextResponse.json(
        {
          message: `Too many failed attempts. Account locked for ${remainingMinutes} more minutes.`,
          lockedUntil: user.lockUntil,
        },
        { status: 423 }
      );
    }

    // Check if password exists (OAuth users might not have password)
    if (!user.password) {
      // OAuth user trying to login with password - suggest using OAuth or setting password
      const providerName = user.provider === "google" ? "Google" : user.provider === "github" ? "GitHub" : "social account";
      return NextResponse.json(
        {
          message: `This account was created with ${providerName}. Please use the 'Continue with ${providerName}' button, or reset your password to login with email/password.`,
          provider: user.provider,
          canSetPassword: true
        },
        { status: 400 }
      );
    }

    // Check if email is verified (only for credentials users)
    if (!user.isEmailVerified && user.provider === "credentials") {
      return NextResponse.json(
        {
          message: "Please verify your email first. Check your inbox for the verification code.",
          requiresVerification: true,
          email: user.email,
        },
        { status: 403 }
      );
    }

    // Compare the provided password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      // Increment login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      // Lock account if max attempts reached
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME);
        await user.save();

        return NextResponse.json(
          {
            message: `Too many failed login attempts. Your account has been locked for 15 minutes.`,
          },
          { status: 423 }
        );
      }

      await user.save();

      const attemptsLeft = MAX_LOGIN_ATTEMPTS - user.loginAttempts;
      return NextResponse.json(
        {
          message: `Invalid email or password. You have ${attemptsLeft} attempts left.`,
          attemptsRemaining: attemptsLeft,
        },
        { status: 400 }
      );
    }

    // Successful login - reset login attempts
    if (user.loginAttempts > 0 || user.lockUntil) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" } // Token valid for 7 days
    );

    // Send response with the token
    return NextResponse.json({
      message: "Login successful",
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
    }, { status: 200 });

  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: error.message || "Server error. Please try again." },
      { status: 500 }
    );
  }
}
