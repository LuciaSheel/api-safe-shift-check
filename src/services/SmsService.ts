/**
 * SMS Service
 * Abstraction for sending SMS messages via Twilio
 * 
 * For production, set the following environment variables:
 * - TWILIO_ACCOUNT_SID: Your Twilio Account SID
 * - TWILIO_AUTH_TOKEN: Your Twilio Auth Token
 * - TWILIO_PHONE_NUMBER: Your Twilio phone number (e.g., +15551234567)
 * - SMS_PROVIDER: 'twilio' (defaults to 'console' for development)
 */

export interface SmsOptions {
  to: string;
  message: string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// SMS provider interface
export interface ISmsProvider {
  send(options: SmsOptions): Promise<SmsResult>;
}

// Console provider for development - logs SMS to console
class ConsoleSmsProvider implements ISmsProvider {
  async send(options: SmsOptions): Promise<SmsResult> {
    console.log('\n========== SMS SENT ==========');
    console.log(`To: ${options.to}`);
    console.log('-------------------------------');
    console.log(options.message);
    console.log('===============================\n');
    
    return {
      success: true,
      messageId: `console-${Date.now()}`,
    };
  }
}

// Twilio SMS provider
class TwilioSmsProvider implements ISmsProvider {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: { messages: { create: (opts: { body: string; from: string; to: string }) => Promise<{ sid: string }> } } | null = null;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      console.warn('Twilio credentials not configured. SMS will not be sent.');
      return;
    }

    // Dynamically import Twilio to avoid errors if not installed
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      const twilio = require('twilio');
      this.client = twilio(this.accountSid, this.authToken);
    } catch (err) {
      console.warn('Twilio package not installed. Run: npm install twilio');
    }
  }

  async send(options: SmsOptions): Promise<SmsResult> {
    if (!this.client) {
      console.warn('Twilio client not initialized. SMS not sent:', options.message);
      return {
        success: false,
        error: 'Twilio client not initialized',
      };
    }

    try {
      const message = await this.client.messages.create({
        body: options.message,
        from: this.fromNumber,
        to: options.to,
      });

      console.log(`SMS sent to ${options.to}: ${message.sid}`);

      return {
        success: true,
        messageId: message.sid,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to send SMS:', error);
      return {
        success: false,
        error,
      };
    }
  }
}

export class SmsService {
  private provider: ISmsProvider;
  private appName: string;

  constructor() {
    const providerType = process.env.SMS_PROVIDER || 'console';

    switch (providerType) {
      case 'twilio':
        this.provider = new TwilioSmsProvider();
        break;
      default:
        this.provider = new ConsoleSmsProvider();
    }

    this.appName = process.env.APP_NAME || 'Safe on Shift';
  }

  /**
   * Send a raw SMS message
   */
  async send(to: string, message: string): Promise<SmsResult> {
    // Normalize phone number (basic cleanup)
    const normalizedTo = this.normalizePhoneNumber(to);
    
    if (!normalizedTo) {
      return {
        success: false,
        error: 'Invalid phone number',
      };
    }

    return this.provider.send({
      to: normalizedTo,
      message,
    });
  }

  /**
   * Send an emergency alert SMS
   */
  async sendEmergencyAlert(
    to: string,
    workerName: string,
    message?: string
  ): Promise<SmsResult> {
    const smsText = `🚨 EMERGENCY ALERT - ${this.appName}\n\n` +
      `${workerName} has triggered an emergency alert.\n\n` +
      (message ? `Message: ${message}\n\n` : '') +
      `Please respond immediately.`;

    return this.send(to, smsText);
  }

  /**
   * Send a missed check-in alert SMS
   */
  async sendMissedCheckInAlert(
    to: string,
    workerName: string
  ): Promise<SmsResult> {
    const smsText = `⚠️ MISSED CHECK-IN - ${this.appName}\n\n` +
      `${workerName} has missed a scheduled check-in.\n\n` +
      `Please attempt to contact them immediately.`;

    return this.send(to, smsText);
  }

  /**
   * Send alert acknowledgment notification
   */
  async sendAlertAcknowledged(
    to: string,
    workerName: string,
    acknowledgerName: string
  ): Promise<SmsResult> {
    const smsText = `✓ Alert Acknowledged - ${this.appName}\n\n` +
      `The alert for ${workerName} has been acknowledged by ${acknowledgerName}.`;

    return this.send(to, smsText);
  }

  /**
   * Send alert resolved notification
   */
  async sendAlertResolved(
    to: string,
    workerName: string
  ): Promise<SmsResult> {
    const smsText = `✓ Alert Resolved - ${this.appName}\n\n` +
      `The alert for ${workerName} has been resolved.`;

    return this.send(to, smsText);
  }

  /**
   * Normalize phone number to E.164 format
   * Basic implementation - for production, use a library like libphonenumber
   */
  private normalizePhoneNumber(phone: string): string | null {
    if (!phone) return null;

    // Remove all non-numeric characters except +
    let normalized = phone.replace(/[^\d+]/g, '');

    // If it doesn't start with +, assume US/Canada (+1)
    if (!normalized.startsWith('+')) {
      // Remove leading 1 if present, then add +1
      if (normalized.startsWith('1') && normalized.length === 11) {
        normalized = '+' + normalized;
      } else if (normalized.length === 10) {
        normalized = '+1' + normalized;
      } else {
        // Invalid length
        return null;
      }
    }

    // Basic validation - should be at least 10 digits after country code
    const digitsOnly = normalized.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      return null;
    }

    return normalized;
  }
}

// Export singleton instance
export const smsService = new SmsService();
