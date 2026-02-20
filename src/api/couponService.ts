
export interface CouponData {
  _id?: string;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed';
  value: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  applicableFor: string[];
  scope?: 'global' | 'vendor' | 'user_referral';
  vendorId?: string;
  isReferralCoupon?: boolean;
  referralType?: 'user_generated' | 'welcome_bonus' | 'friend_referral';
  generatedBy?: string;
  usageLimit?: number;
  usageCount?: number;
  userUsageLimit: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  firstTimeUserOnly: boolean;
  specificUsers?: string[];
  excludeUsers?: string[];
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

import axios from './axiosConfig';

export interface CouponValidationResponse {
  coupon: {
    _id: string;
    code: string;
    name: string;
    type: string;
    value: number;
    scope?: string;
    isReferralCoupon?: boolean;
  };
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  savings: number;
}

export const couponService = {
  // Admin methods
  getCoupons: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    scope?: string;
    applicableFor?: string;
    isActive?: boolean;
  }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.type && params.type !== 'all') queryParams.append('type', params.type);
      if (params?.scope && params.scope !== 'all') queryParams.append('scope', params.scope);
      if (params?.applicableFor) queryParams.append('applicableFor', params.applicableFor);
      if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

      const response = await axios.get(`/coupons/admin?${queryParams}`);
      return { success: true, data: response.data.data, pagination: response.data.pagination };
    } catch (error) {
      console.error('Error fetching coupons:', error);
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  // Generate referral coupon
  generateReferralCoupon: async (type: 'user_generated' | 'welcome_bonus' | 'friend_referral' = 'user_generated') => {
    try {
      const response = await axios.post('/coupons/generate-referral', { type });
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      console.error('Error generating referral coupon:', error);
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  getCoupon: async (id: string) => {
    try {
      const response = await axios.get(`/coupons/admin/${id}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error fetching coupon:', error);
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  createCoupon: async (couponData: Omit<CouponData, '_id' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt' | 'usageCount'>) => {
    try {
      const response = await axios.post('/coupons/admin', couponData);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      console.error('Error creating coupon:', error);
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  updateCoupon: async (id: string, couponData: Partial<CouponData>) => {
    try {
      const response = await axios.put(`/coupons/admin/${id}`, couponData);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      console.error('Error updating coupon:', error);
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  deleteCoupon: async (id: string) => {
    try {
      const response = await axios.delete(`/coupons/admin/${id}`);
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Error deleting coupon:', error);
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  // User methods
  getAvailableCoupons: async (bookingType?: string) => {
    try {
      const params = new URLSearchParams();
      if (bookingType) params.append('bookingType', bookingType);

      const response = await axios.get(`/coupons/available?${params}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error fetching available coupons:', error);
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  validateCoupon: async (code: string, bookingType: string, amount: number, cabinId?: string): Promise<{ success: boolean; data?: CouponValidationResponse; message?: string; error?: any }> => {
    try {
      const response = await axios.post('/coupons/validate', { 
        code, 
        bookingType, 
        amount,
        cabinId 
      });
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      console.error('Error validating coupon:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message,
        error: error.response?.data?.message || error.message 
      };
    }
  },

  applyCoupon: async (code: string, bookingId: string, bookingType: string, amount: number) => {
    try {
      const response = await axios.post('/coupons/apply', {
        code, 
        bookingId, 
        bookingType, 
        amount 
      });
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      console.error('Error applying coupon:', error);
      return { success: false, message: error.response?.data?.message || error.message };
    }
  }
};
