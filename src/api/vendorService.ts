
import axios from './axiosConfig';
import { VendorEmployee } from '../types/vendor';

export interface BookingDetail {
  id: string;
  _id: string;
  bookingId: string;
  cabin: string;
  seat: string;
  amount: number;
  commission: number;
  netAmount: number;
  payoutStatus: 'pending' | 'included' | 'processed';
  createdAt: string;
}

export interface VendorIncome {
  today: {
    totalRevenue: number;
    commission: number;
    netIncome: number;
    bookingsCount: number;
    bookings: BookingDetail[];
  };
  yesterday: {
    totalRevenue: number;
    commission: number;
    netIncome: number;
    bookingsCount: number;
    bookings: BookingDetail[];
  };
  week: {
    totalRevenue: number;
    commission: number;
    netIncome: number;
    bookingsCount: number;
    bookings: BookingDetail[];
  };
  month: {
    totalRevenue: number;
    commission: number;
    netIncome: number;
    bookingsCount: number;
    bookings: BookingDetail[];
  };
  payoutSummary: {
    totalPendingBookings: number;
    pendingRevenue: number;
    requestedPayouts: number;
    availableBalance: number;
  };
  commissionRate: number;
}

interface PayoutRequest {
  amount: number;
  bookingIds?: string[];
  cabinId?: string;
}

export interface AutoPayoutSettings {
  enabled: boolean;
  payoutFrequency: number; // days
  lastAutoPayout?: string;
  nextAutoPayout?: string;
  manualRequestCharges: {
    enabled: boolean;
    chargeType: 'percentage' | 'fixed';
    chargeValue: number;
    description: string;
  };
  perCabinPayout: boolean;
  minimumPayoutAmount: number;
}


export interface EnhancedPayout {
  _id?: string;
  id: string;
  payoutId: string;
  amount: number;
  commission: number;
  netAmount: number;
  additionalCharges?: {
    manualRequestFee: number;
    description: string;
  };
  payoutType: 'auto' | 'manual';
  period: {
    startDate: string;
    endDate: string;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  requestedAt: string;
  processedAt?: string;
  transactionId?: string;
  notes?: string;
  bookingCount: number;
  bookingDetails: Array<{
    bookingId: string;
    amount: number;
    commission: number;
    netAmount: number;
  }>;
  cabinId?: string;
}

export const vendorService = {

  getAllVendors: async () => {
    const response = await axios.get('/vendor');
    return response.data;
  },
  
  // Enhanced Income Analytics with booking details
  getIncomeAnalytics: async (filters?: { 
    dateFilter?: 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'last_year' | 'custom';
    startDate?: string;
    endDate?: string;
  }) => {
    try {
      const response = await axios.get('/vendor/income/analytics', { params: filters });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Enhanced Payout Management with booking selection and date filtering
  getPayouts: async (filters?: {
    dateFilter?: 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'last_year' | 'custom';
    startDate?: string;
    endDate?: string;
  }) => {
    try {
      const response = await axios.get('/vendor/payouts', { params: filters });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  requestPayout: async (data: PayoutRequest) => {
    try {
      const response = await axios.post('/vendor/payouts', data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Auto Payout Settings Management
  getAutoPayoutSettings: async () => {
    try {
      const response = await axios.get('/vendor/auto-payout-settings');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  updateAutoPayoutSettings: async (settings: AutoPayoutSettings) => {
    try {
      const response = await axios.put('/vendor/auto-payout-settings', settings);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Get payout preview with charges
  getPayoutPreview: async (amount: number, cabinId?: string) => {
    try {
      const params = { amount, cabinId };
      if (cabinId) params.cabinId = cabinId;
      
      const response = await axios.get('/vendor/payout-preview', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Booking Management with commission details
  getBookingsForPayout: async (status?: 'pending' | 'included' | 'processed') => {
    try {
      const response = await axios.get('/vendor/bookings', { 
        params: { payoutStatus: status } 
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Employee Management
  getEmployees: async () => {
    try {
      const response = await axios.get('/vendor/employees');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  createEmployee: async (employeeData: Partial<VendorEmployee>) => {
    try {
      const response = await axios.post('/vendor/employees', employeeData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  updateEmployee: async (employeeId: string, employeeData: Partial<VendorEmployee>) => {
    try {
      const response = await axios.put(`/vendor/employees/${employeeId}`, employeeData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  deleteEmployee: async (employeeId: string) => {
    try {
      const response = await axios.delete(`/vendor/employees/${employeeId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  }
};
