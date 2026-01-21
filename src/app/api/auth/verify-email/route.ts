import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/user";

// Inline email sending function
async function sendWelcomeEmail(email: string, firstName: string) {
  try {
    const nodemailerModule = await import('nodemailer');
    const nodemailer = nodemailerModule.default || nodemailerModule;

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"FileMint" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to FileMint! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8">
        <style>
          body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333}
          .container{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1)}
          .header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 30px;text-align:center;color:#fff}
          .content{padding:40px 30px}
          .footer{background:#f8f9fa;padding:20px 30px;text-align:center;font-size:14px;color:#666}
        </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>🎉 Welcome to FileMint!</h1></div>
            <div class="content">
              <h2>Hello ${firstName}!</h2>
              <p>Congratulations! Your email has been verified successfully.</p>
              <p>You now have full access to all FileMint tools. Start managing your PDFs like never before!</p>
              <p>Happy editing! 🚀</p>
            </div>
            <div class="footer"><p>© ${new Date().getFullYear()} FileMint. All rights reserved.</p></div>
          </div>
        </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Welcome email error:', error);
    return { success: false, error: error.message };
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { message: "Email and OTP are required" },
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

    // Check if OTP exists
    if (!user.emailVerificationToken) {
      return NextResponse.json(
        { message: "No verification code found. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      return NextResponse.json(
        { message: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if OTP matches
    if (user.emailVerificationToken !== otp) {
      return NextResponse.json(
        { message: "Invalid verification code. Please try again." },
        { status: 400 }
      );
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Send welcome email (don't wait for it)
    sendWelcomeEmail(user.email, user.firstName).catch(err =>
      console.error("Failed to send welcome email:", err)
    );

    return NextResponse.json({
      message: "Email verified successfully! You can now log in.",
      success: true,
    });
  } catch (error: any) {
    console.error("Verify email error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to verify email" },
      { status: 500 }
    );
  }
}
