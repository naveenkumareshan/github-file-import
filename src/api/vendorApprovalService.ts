
import axios from './axiosConfig';

export interface VendorFilters {
  status?: 'pending' | 'approved' | 'rejected' | 'suspended' | 'all';
  businessType?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  city?: string;
  state?: string;
}

interface PaginationParams {
  page: number;
  limit: number;
}

export interface VendorApprovalData {
  action: 'approve' | 'reject' | 'suspend';
  notes?: string;
  rejectionReason?: string;
  commissionRate?: number;
}

export interface Vendor {
  _id: string;
  vendorId: string;
  businessName: string;
  businessType: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
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
  commissionSettings: {
    type: string;
    value: number;
    payoutCycle: string;
  };
  totalRevenue: number;
  pendingPayout: number;
  createdAt: string;
  updatedAt: string;
  documents: Array<{
    vendorId:string;
    documentType: string;
    url: string;
    status: string;
    filename:string;
    uploadedAt: string;
    _id:string;
    fileSize: number;
    mimeType: string;
    reviewedAt?: string;
    reviewedBy?: {
      _id: string;
      name: string;
      email: string;
    };
    rejectionReason?: string;
    notes?: string;
  }>;
}

export interface VendorsResponse {
  vendors: Vendor[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export const vendorApprovalService = {
  // Get all vendors with pagination and filters
  getVendors: async (pagination: PaginationParams, filters: VendorFilters = {}) => {
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      
      const response = await axios.get('/admin/vendors', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

    // Get all vendors with pagination and filters
  getAllVendors: async (pagination: PaginationParams, filters: VendorFilters = {}) => {
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      
      const response = await axios.get('/admin/vendors', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Get single vendor details
  getVendorById: async (vendorId: string) => {
    try {
      const response = await axios.get(`/admin/vendors/${vendorId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Update vendor status (approve/reject/suspend)
  updateVendorStatus: async (vendorId: string, data: VendorApprovalData) => {
    try {
      const response = await axios.put(`/admin/vendors/${vendorId}/status`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Update vendor details
  updateVendorDetails: async (vendorId: string, data: Partial<Vendor>) => {
    try {
      const response = await axios.put(`/admin/vendors/${vendorId}`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Get vendor statistics
  getVendorStats: async () => {
    try {
      const response = await axios.get('/admin/vendors/stats');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Export vendors data
  exportVendors: async (filters: VendorFilters = {}) => {
    try {
      const response = await axios.get('/admin/vendors/export', { 
        params: filters,
        responseType: 'blob'
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Update vendor commission settings
  updateCommissionSettings: async (vendorId: string, commissionData: unknown) => {
    try {
      const response = await axios.put(`/admin/vendors/${vendorId}/commission`, commissionData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  }
};
