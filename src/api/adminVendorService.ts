
import axios from './axiosConfig';
import { AutoPayoutSettings } from './vendorService';

export interface VendorAutoPayoutConfig {
  _id: string;
  vendorId: string;
  businessName: string;
  contactPerson: string;
  email: string;
  status: 'pending' | 'approved' | 'suspended';
  autoPayoutSettings: AutoPayoutSettings;
}

export interface VendorFilters {
  search?: string;
  status?: 'all' | 'approved' | 'pending' | 'suspended';
}

export const adminVendorService = {
  // Get all vendors with auto payout settings
  getVendorsWithPayoutSettings: async (filters?: VendorFilters) => {
    try {
      const response = await axios.get('/admin/vendors-payout/payout-settings', { params: filters });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Update vendor auto payout settings
  updateVendorAutoPayoutSettings: async (vendorId: string, settings: AutoPayoutSettings) => {
    try {
      const response = await axios.put(`/admin/vendors-payout/${vendorId}/auto-payout-settings`, settings);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Get vendor auto payout settings
  getVendorAutoPayoutSettings: async (vendorId: string) => {
    try {
      const response = await axios.get(`/admin/vendors-payout/${vendorId}/auto-payout-settings`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Enable/disable auto payout for vendor
  toggleVendorAutoPayout: async (vendorId: string, enabled: boolean) => {
    try {
      const response = await axios.put(`/admin/vendors-payout/${vendorId}/auto-payout-toggle`, { enabled });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Get auto payout statistics
  getAutoPayoutStats: async () => {
    try {
      const response = await axios.get('/admin/vendors-payout/auto-payout-stats');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  }
};
