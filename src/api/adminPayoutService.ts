
import axios from './axiosConfig';

export interface AdminPayout {
  id: string;
  _id: string;
  payoutId: string;
  vendorId: {
    id: string;
    businessName: string;
    email: string;
    phone: string;
  };
  bankDetails?: {
    accountNumber?: string;
    ifsc?: string;
    ifscCode?: string;
    bankName?: string;
    accountHolderName?: string;
  };
  amount: number;
  commission: number;
  netAmount: number;
  period: {
    startDate: string;
    endDate: string;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  requestedAt: string;
  processedAt?: string;
  transactionId?: string;
  notes?: string;
  payoutType?: 'auto' | 'manual';
}

export interface PayoutProcessData {
  status: 'completed' | 'failed' | 'cancelled';
  notes?: string;
  transactionId?: string;
}

export interface SystemAnalytics {
  vendors: {
    total: number;
    active: number;
  };
  payouts: {
    total: number;
    pending: number;
    completed: number;
    totalAmount: number;
  };
  bookings: {
    recent: number;
  };
}

interface PayoutFilters {
  status?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export const adminPayoutService = {
  getAllPayouts: async (filters?: PayoutFilters) => {
    try {
      const response = await axios.get('/admin/payouts', { params: filters });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  processPayout: async (payoutId: string, data: PayoutProcessData) => {
    try {
      const response = await axios.put(`/admin/payouts/${payoutId}/process`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  getSystemAnalytics: async (period?: 'today' | 'week' | 'month') => {
    try {
      const response = await axios.get('/admin/analytics', { params: { period } });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  getAllVendors: async (filters?: { status?: string; page?: number; limit?: number }) => {
    try {
      const response = await axios.get('/admin/vendors', { params: filters });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  updateVendorStatus: async (vendorId: string, status: string) => {
    try {
      const response = await axios.put(`/admin/vendors/${vendorId}/status`, { status });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  }
};
