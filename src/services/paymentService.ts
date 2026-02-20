
import { settingsService } from '@/api/settingsService';

interface PaymentGatewayConfig {
  razorpay?: {
    keyId: string;
    keySecret: string;
    testMode: boolean;
  };
  stripe?: {
    publishableKey: string;
    secretKey: string;
    testMode: boolean;
  };
  paypal?: {
    clientId: string;
    clientSecret: string;
    testMode: boolean;
  };
}

interface PaymentSetting {
  provider: string; // e.g. 'razorpay' | 'stripe' | 'default'
  settings: {
    gateway?: string;
    [key: string]: unknown; // other provider-specific config
  };
}

type PaymentConfigMap = Record<string, Record<string, unknown>>;


class PaymentService {
  private config: PaymentGatewayConfig = {};
  private defaultGateway: string = 'razorpay';

  async initialize() {
    try {
      const response = await settingsService.getSettings('payment');
      if (response.success && response.data.length > 0) {
        const data = response.data as PaymentSetting[];
        // Load gateway configurations
        this.config = data.reduce<PaymentConfigMap>((acc, setting) => {
          if (setting.provider && setting.provider !== 'default') {
            acc[setting.provider] = setting.settings;
          }
          return acc;
        }, {});

        // Get default gateway
        const defaultSetting = data.find(
          (s) => s.provider === 'default'
        );

        if (defaultSetting?.settings?.gateway) {
          this.defaultGateway = defaultSetting.settings.gateway;
        }
      }
    } catch (error) {
      console.error('Failed to initialize payment service:', error);
    }
  }

  getActiveGateway() {
    return this.defaultGateway;
  }

  getGatewayConfig(gateway?: string) {
    const gatewayToUse = gateway || this.defaultGateway;
    return this.config[gatewayToUse as keyof PaymentGatewayConfig];
  }

  async createRazorpayOrder(amount: number, bookingId: string, bookingType: string) {
    const config = this.getGatewayConfig('razorpay');
    if (!config) {
      throw new Error('Razorpay configuration not found');
    }

    // This would typically make an API call to your backend
    // which would create the Razorpay order using the stored credentials
    const response = await fetch('/api/payments/razorpay/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        amount,
        bookingId,
        bookingType,
        gateway: 'razorpay'
      })
    });

    return response.json();
  }

  async createStripeSession(amount: number, bookingId: string, bookingType: string) {
    const config = this.getGatewayConfig('stripe');
    if (!config) {
      throw new Error('Stripe configuration not found');
    }

    const response = await fetch('/api/payments/stripe/create-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        amount,
        bookingId,
        bookingType,
        gateway: 'stripe'
      })
    });

    return response.json();
  }

  async processPayment(amount: number, bookingId: string, bookingType: string, gateway?: string) {
    const gatewayToUse = gateway || this.defaultGateway;
    
    switch (gatewayToUse) {
      case 'razorpay':
        return this.createRazorpayOrder(amount, bookingId, bookingType);
      case 'stripe':
        return this.createStripeSession(amount, bookingId, bookingType);
      case 'paypal':
        // Implement PayPal payment logic
        throw new Error('PayPal integration not implemented yet');
      default:
        throw new Error(`Unsupported payment gateway: ${gatewayToUse}`);
    }
  }
}

export const paymentService = new PaymentService();
