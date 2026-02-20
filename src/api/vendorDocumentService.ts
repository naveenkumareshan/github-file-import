import axios from './axiosConfig';

export interface VendorDocument {
  _id: string;
  vendorId: string;
  documentType: string;
  filename: string;
  url: string;
  fileSize: number;
  mimeType: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

interface DocumentUploadData {
  documentType: string;
  filename: string;
  url: string;
  fileSize: number;
  mimeType: string;
}

export const vendorDocumentService = {
  // Get all documents for current vendor
  getDocuments: async () => {
    try {
      const response = await axios.get('/vendor/documents');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Upload a new document
  uploadDocument: async (documentData: DocumentUploadData) => {
    try {
      const response = await axios.post('/vendor/documents', documentData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Update document
  updateDocument: async (documentId: string, documentData: Partial<DocumentUploadData>) => {
    try {
      const response = await axios.put(`/vendor/documents/${documentId}`, documentData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Delete document
  deleteDocument: async (documentId: string) => {
    try {
      const response = await axios.delete(`/vendor/documents/${documentId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Get document verification status
  getVerificationStatus: async () => {
    try {
      const response = await axios.get('/vendor/documents/verification-status');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  }
};