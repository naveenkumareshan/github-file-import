import axios from './axiosConfig';

export interface AdminVendorDocument {
  _id: string;
  vendorId: {
    _id: string;
    businessName: string;
    contactPerson: string;
    email: string;
    vendorId: string;
  };
  documentType: string;
  filename: string;
  url: string;
  fileSize: number;
  mimeType: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  reviewedAt?: string;
  reviewedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  rejectionReason?: string;
  notes?: string;
}

interface DocumentFilters {
  status?: string;
  vendorId?: string;
  documentType?: string;
}

export const adminVendorDocumentService = {
  // Get all vendor documents with pagination and filters
  getDocuments: async (pagination: { page: number; limit: number }, filters: DocumentFilters = {}) => {
    try {
      const params = { ...pagination, ...filters };
      const response = await axios.get('/admin/vendor-documents', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Get documents for specific vendor
  getVendorDocuments: async (vendorId: string) => {
    try {
      const response = await axios.get(`/admin/vendor-documents/vendor/${vendorId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Approve or reject document
  updateDocumentStatus: async (documentId: string, data: { status: 'approved' | 'rejected'; rejectionReason?: string; notes?: string }) => {
    try {
      const response = await axios.put(`/admin/vendor-documents/${documentId}/status`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Get document statistics
  getDocumentStats: async () => {
    try {
      const response = await axios.get('/admin/vendor-documents/stats');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  }
};

export const adminPartnerDocumentService = adminVendorDocumentService;