import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/user";
import { validateEmailDomain, validatePasswordStrength, generateOTP } from "../../../utils/emailValidation";

// Inline email sending function
async function sendEmail(to: string, subject: string, html: string) {
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
      to,
      subject,
      html,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
}

// This function is used to handle POST requests for user sign up
export async function POST(req: NextRequest) {
  try {
    // Connect to MongoDB
    await connectDB();

    // Get the request body data
    const { firstName, lastName, email, password, termsAccepted } = await req.json();

    // Validate input fields
    if (!firstName || !lastName || !email || !password || termsAccepted === undefined) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate terms accepted
    if (!termsAccepted) {
      return NextResponse.json(
        { message: "You must accept the terms and conditions" },
        { status: 400 }
      );
    }

    // Validate email format and domain
    const emailValidation = validateEmailDomain(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { message: emailValidation.message },
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

    // Check if the user already exists by email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return NextResponse.json(
          { message: "User already exists with this email" },
          { status: 400 }
        );
      } else {
        // User exists but not verified - resend verification
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        existingUser.emailVerificationToken = otp;
        existingUser.emailVerificationExpires = expiresAt;
        await existingUser.save();

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background-color:#f4f4f4}
            .container{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1)}
            .header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 30px;text-align:center;color:#fff}
            .header h1{margin:0;font-size:28px;font-weight:700}
            .content{padding:40px 30px}
            .otp-box{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;font-size:36px;font-weight:700;letter-spacing:8px;text-align:center;padding:24px;border-radius:8px;margin:30px 0;font-family:'Courier New',monospace}
            .warning{background:#fff3cd;border-left:4px solid #ffc107;padding:15px;margin:20px 0;border-radius:4px;font-size:14px;color:#856404}
            .footer{background:#f8f9fa;padding:20px 30px;text-align:center;font-size:14px;color:#666;border-top:1px solid #e9ecef}
            @media only screen and (max-width:600px){.container{margin:20px}.header,.content,.footer{padding:20px}.otp-box{font-size:28px;letter-spacing:4px}}
          </style>
          </head>
          <body>
            <div class="container">
              <div class="header"><h1>🔒 Email Verification</h1></div>
              <div class="content">
                <h2>Hello ${existingUser.firstName}!</h2>
                <p>Thank you for signing up with <strong>FileMint</strong>. Please verify your email using the OTP code below:</p>
                <div class="otp-box">${otp}</div>
                <p style="text-align:center;font-size:14px;color:#666">This code will expire in <strong>10 minutes</strong>.</p>
                <div class="warning"><strong>⚠️ Security Notice:</strong> If you didn't create an account with FileMint, please ignore this email.</div>
              </div>
              <div class="footer"><p style="margin:0 0 10px 0">© ${new Date().getFullYear()} FileMint. All rights reserved.</p><p style="margin:0;font-size:12px">Powered by <strong>PurpleMerit</strong></p></div>
            </div>
          </body>
          </html>
        `;

        const emailResult = await sendEmail(existingUser.email, 'Verify Your Email - FileMint', emailHtml);

        if (!emailResult.success) {
          return NextResponse.json(
            { message: "Failed to send verification email" },
            { status: 500 }
          );
        }

        return NextResponse.json({
          message: "Account exists but not verified. A new verification code has been sent to your email.",
          requiresVerification: true,
          email: existingUser.email,
        }, { status: 200 });
      }
    }

    // Generate OTP for email verification
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

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

    // Save the new user to the database
    await newUser.save();

    // Send verification email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background-color:#f4f4f4}
        .container{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1)}
        .header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 30px;text-align:center;color:#fff}
        .header h1{margin:0;font-size:28px;font-weight:700}
        .content{padding:40px 30px}
        .otp-box{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;font-size:36px;font-weight:700;letter-spacing:8px;text-align:center;padding:24px;border-radius:8px;margin:30px 0;font-family:'Courier New',monospace}
        .warning{background:#fff3cd;border-left:4px solid #ffc107;padding:15px;margin:20px 0;border-radius:4px;font-size:14px;color:#856404}
        .footer{background:#f8f9fa;padding:20px 30px;text-align:center;font-size:14px;color:#666;border-top:1px solid #e9ecef}
        @media only screen and (max-width:600px){.container{margin:20px}.header,.content,.footer{padding:20px}.otp-box{font-size:28px;letter-spacing:4px}}
      </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>🔒 Email Verification</h1></div>
          <div class="content">
            <h2>Hello ${newUser.firstName}!</h2>
            <p>Thank you for signing up with <strong>FileMint</strong>. Please verify your email using the OTP code below:</p>
            <div class="otp-box">${otp}</div>
            <p style="text-align:center;font-size:14px;color:#666">This code will expire in <strong>10 minutes</strong>.</p>
            <div class="warning"><strong>⚠️ Security Notice:</strong> If you didn't create an account with FileMint, please ignore this email.</div>
          </div>
          <div class="footer"><p style="margin:0 0 10px 0">© ${new Date().getFullYear()} FileMint. All rights reserved.</p><p style="margin:0;font-size:12px">Powered by <strong>PurpleMerit</strong></p></div>
        </div>
      </body>
      </html>
    `;

    const emailResult = await sendEmail(newUser.email, 'Verify Your Email - FileMint', emailHtml);

    if (!emailResult.success) {
      // Rollback user creation if email fails
      await User.findByIdAndDelete(newUser._id);
      return NextResponse.json(
        { message: "Failed to send verification email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Account created successfully! Please check your email for verification code.",
      requiresVerification: true,
      email: newUser.email,
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error during sign-up:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
