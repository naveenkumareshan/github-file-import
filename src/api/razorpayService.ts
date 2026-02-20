
import axios from './axiosConfig';

export interface RazorpayOrderParams {
  amount: number;
  currency: string;
  bookingId: string;
  bookingType: 'cabin' | 'hostel' | 'laundry';
  bookingDuration?: 'daily' | 'weekly' | 'monthly';
  durationCount?: number;
  notes?: Record<string, any>; // Add support for notes
}

export interface RazorpayVerifyParams {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  bookingId: string;
  bookingType: string;
  bookingDuration?: 'daily' | 'weekly' | 'monthly';
  durationCount?: number;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      return resolve(true);
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};


// Razorpay service
export const razorpayService = {
  // Create order
  createOrder: async (params: RazorpayOrderParams) => {
    try {
      const response = await axios.post('/payments/razorpay/create-order', params);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Razorpay create order error:', error);
      return {
        success: false,
        error: {
          message: error.response?.data?.message || 'Failed to create Razorpay order'
        }
      };
    }
  },
  
  // Verify payment
  verifyPayment: async (params: RazorpayVerifyParams) => {
    try {
      const response = await axios.post('/payments/razorpay/verify', params);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Razorpay verify payment error:', error);
      return {
        success: false,
        error: {
          message: error.response?.data?.message || 'Failed to verify payment'
        }
      };
    }
  }
  ,
 // verify-transaction-payment
  verifyTransactionPayment: async (params: RazorpayVerifyParams) => {
    try {
      const response = await axios.post('/payments/razorpay/verify-transaction-payment', params);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Razorpay verify payment error:', error);
      return {
        success: false,
        error: {
          message: error.response?.data?.message || 'Failed to verify payment'
        }
      };
    }
  }
};
