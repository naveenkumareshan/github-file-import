/* eslint-disable @typescript-eslint/no-explicit-any */

import { settingsService } from '@/api/settingsService';

interface EmailConfig {
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
    fromEmail: string;
    fromName: string;
  };
  mailgun?: {
    apiKey: string;
    domain: string;
    fromEmail: string;
    fromName: string;
  };
  sendgrid?: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
  };
}

interface EmailTemplates {
  bookingConfirmation: string;
  paymentConfirmation: string;
  bookingCancellation: string;
  seatTransfer: string;
}

class EmailService {
  private config: EmailConfig = {};
  private defaultProvider: string = 'smtp';
  private templates: EmailTemplates = {
    bookingConfirmation: 'Your booking has been confirmed successfully.',
    paymentConfirmation: 'Payment received successfully for your booking.',
    bookingCancellation: 'Your booking has been cancelled.',
    seatTransfer: 'Your seat has been transferred successfully.'
  };

  async initialize() {
    try {
      const response = await settingsService.getSettings('email');
      if (response.success && response.data.length > 0) {
        // Load provider configurations
        this.config = response.data.reduce((acc: any, setting: any) => {
          if (setting.provider && setting.provider !== 'default' && setting.provider !== 'templates') {
            acc[setting.provider] = setting.settings;
          }
          return acc;
        }, {});

        // Get default provider
        const defaultSetting = response.data.find((s: any) => s.provider === 'default');
        if (defaultSetting) {
          this.defaultProvider = defaultSetting.settings.provider;
        }

        // Get templates
        const templatesSetting = response.data.find((s: any) => s.provider === 'templates');
        if (templatesSetting) {
          this.templates = { ...this.templates, ...templatesSetting.settings };
        }
      }
    } catch (error) {
      console.error('Failed to initialize email service:', error);
    }
  }

  getActiveProvider() {
    return this.defaultProvider;
  }

  getProviderConfig(provider?: string) {
    const providerToUse = provider || this.defaultProvider;
    return this.config[providerToUse as keyof EmailConfig];
  }

  getTemplate(templateType: keyof EmailTemplates) {
    return this.templates[templateType];
  }

  async sendEmail(to: string, subject: string, content: string, templateType?: keyof EmailTemplates) {
    const provider = this.getActiveProvider();
    const config = this.getProviderConfig(provider);
    
    if (!config) {
      throw new Error(`Email provider configuration not found for: ${provider}`);
    }

    // Use template if provided
    const emailContent = templateType ? this.getTemplate(templateType) : content;

    // This would typically make an API call to your backend
    // which would send the email using the configured provider
    const response = await fetch('/api/emails/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        to,
        subject,
        content: emailContent,
        provider,
        templateType
      })
    });

    return response.json();
  }

  async sendBookingConfirmation(to: string) {
    const subject = 'Booking Confirmation - InhaleStays';
    return this.sendEmail(to, subject, '', 'bookingConfirmation');
  }

  async sendPaymentConfirmation(to: string) {
    const subject = 'Payment Confirmation - InhaleStays';
    return this.sendEmail(to, subject, '', 'paymentConfirmation');
  }

  async sendBookingCancellation(to: string) {
    const subject = 'Booking Cancellation - InhaleStays';
    return this.sendEmail(to, subject, '', 'bookingCancellation');
  }

  async sendSeatTransfer(to: string) {
    const subject = 'Seat Transfer Confirmation - InhaleStays';
    return this.sendEmail(to, subject, '', 'seatTransfer');
  }
}

export const emailService = new EmailService();
