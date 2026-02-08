/**
 * Email Service
 * Abstraction for sending emails - can be swapped for real providers
 * (SendGrid, AWS SES, Mailgun, etc.)
 * 
 * For production, set EMAIL_PROVIDER environment variable and configure
 * the appropriate provider settings.
 */

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Email provider interface - implement this for different providers
export interface IEmailProvider {
  send(options: EmailOptions): Promise<EmailResult>;
}

// Console provider for development - logs emails to console
class ConsoleEmailProvider implements IEmailProvider {
  async send(options: EmailOptions): Promise<EmailResult> {
    console.log('\n========== EMAIL SENT ==========');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log('--------------------------------');
    console.log(options.text);
    console.log('================================\n');
    
    return {
      success: true,
      messageId: `console-${Date.now()}`,
    };
  }
}

// SMTP provider placeholder - implement with nodemailer for production
// class SmtpEmailProvider implements IEmailProvider {
//   async send(options: EmailOptions): Promise<EmailResult> {
//     // Use nodemailer or similar
//   }
// }

// SendGrid provider placeholder
// class SendGridEmailProvider implements IEmailProvider {
//   async send(options: EmailOptions): Promise<EmailResult> {
//     // Use @sendgrid/mail
//   }
// }

export class EmailService {
  private provider: IEmailProvider;
  private fromAddress: string;
  private appName: string;
  private appUrl: string;

  constructor() {
    // Configure based on environment
    const providerType = process.env.EMAIL_PROVIDER || 'console';
    
    switch (providerType) {
      // Add real providers here when needed:
      // case 'sendgrid':
      //   this.provider = new SendGridEmailProvider();
      //   break;
      // case 'smtp':
      //   this.provider = new SmtpEmailProvider();
      //   break;
      default:
        this.provider = new ConsoleEmailProvider();
    }

    this.fromAddress = process.env.EMAIL_FROM || 'noreply@safeonshift.com';
    this.appName = process.env.APP_NAME || 'Safe on Shift';
    this.appUrl = process.env.APP_URL || 'http://localhost:8080';
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<EmailResult> {
    const resetUrl = `${this.appUrl}/reset-password/${resetToken}`;
    
    const text = `
Hello,

You requested a password reset for your ${this.appName} account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you did not request this password reset, please ignore this email or contact support if you have concerns.

Best regards,
The ${this.appName} Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🛡️ ${this.appName}</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #111827; margin-top: 0;">Reset Your Password</h2>
    
    <p>Hello,</p>
    
    <p>You requested a password reset for your ${this.appName} account.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" 
         style="background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
        Reset Password
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">
      This link will expire in <strong>1 hour</strong>.
    </p>
    
    <p style="color: #6b7280; font-size: 14px;">
      If you did not request this password reset, please ignore this email or contact support if you have concerns.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${resetUrl}" style="color: #10b981;">${resetUrl}</a>
    </p>
  </div>
  
  <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
    © ${new Date().getFullYear()} ${this.appName}. All rights reserved.
  </p>
</body>
</html>
    `.trim();

    return this.provider.send({
      to: email,
      subject: `Reset your ${this.appName} password`,
      text,
      html,
    });
  }

  /**
   * Send password changed confirmation email
   */
  async sendPasswordChangedEmail(email: string): Promise<EmailResult> {
    const text = `
Hello,

Your ${this.appName} password has been successfully changed.

If you did not make this change, please contact support immediately and reset your password.

Best regards,
The ${this.appName} Team
    `.trim();

    return this.provider.send({
      to: email,
      subject: `Your ${this.appName} password has been changed`,
      text,
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();
