
// Create reusable transporter
async function createTransporter() {
    const nodemailerModule = await import('nodemailer');
    const nodemailer = nodemailerModule.default || nodemailerModule;

    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
}

// Generic email sending function
export async function sendEmail(to: string, subject: string, html: string) {
    try {
        const transporter = await createTransporter();

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

// Send verification email with OTP
export async function sendVerificationEmail(email: string, firstName: string, otp: string) {
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
          <h2>Hello ${firstName}!</h2>
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

    return sendEmail(email, 'Verify Your Email - FileMint', emailHtml);
}

// Send welcome email after verification
export async function sendWelcomeEmail(email: string, firstName: string) {
    const emailHtml = `
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
  `;

    return sendEmail(email, 'Welcome to FileMint! 🎉', emailHtml);
}
