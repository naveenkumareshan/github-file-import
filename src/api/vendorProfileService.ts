import axios from './axiosConfig';

export interface VendorProfileData {
  _id: string;
  vendorId: string;
  businessName: string;
  businessType: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  businessDetails: {
    gstNumber: string;
    panNumber: string;
    aadharNumber: string;
    businessLicense: string;
    description: string;
  };
  bankDetails: {
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    upiId: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VendorProfileUpdateData {
  businessName?: string;
  contactPerson?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  businessDetails?: {
    description?: string;
  };
  bankDetails?: {
    accountHolderName?: string;
    accountNumber?: string;
    bankName?: string;
    ifscCode?: string;
    upiId?: string;
  };
}

export const vendorProfileService = {
  // Get vendor profile
  getProfile: async () => {
    try {
      const response = await axios.get('/vendor/profile');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Update vendor profile
  updateProfile: async (profileData: VendorProfileUpdateData) => {
    try {
      const response = await axios.put('/vendor/profile', profileData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  }
};