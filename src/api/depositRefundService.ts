import axios from './axiosConfig';

export interface DepositRefund {
  _id: string;
  transactionId:string;
  booking: any;
  user: any;
  cabin: any;
  seat: any;
  keyDeposit: number;
  isKeyDepositPaid: boolean;
  keyDepositRefunded: boolean;
  keyDepositRefundDate?: string;
  refundAmount?: number;
  refundReason?: string;
  refundMethod?: string;
  endDate: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepositRefundFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  cabinId?: string;
  type?:string;
  dateFilter?: 'all' | 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'last_year' | 'custom';
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const depositRefundService = {
  // Get deposits with pagination and filters
  getDeposits: async (page = 1, limit = 20, filters: DepositRefundFilters = {}) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      // Add filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await axios.get(`/admin/deposits?${params}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching deposits:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  getRefunds: async (page = 1, limit = 20, filters: DepositRefundFilters = {}) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      // Add filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await axios.get(`/admin/deposits/refunds?${params}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching deposits:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },
  // Process refund
  processRefund: async (depositId: string, refundData: {
    refundAmount: number;
    refundReason?: string;
    refundMethod?: string;
  }) => {
    try {
      const response = await axios.post(`/admin/deposits/${depositId}/refund`, refundData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error processing refund:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Bulk process refunds
  bulkProcessRefunds: async (depositIds: string[], refundData: {
    refundAmount: number;
    refundReason?: string;
    refundMethod?: string;
  }) => {
    try {
      const response = await axios.post('/admin/deposits/bulk-refund', {
        depositIds,
        ...refundData
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error processing bulk refunds:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Export deposits report
  exportDepositsReport: async (filters: DepositRefundFilters = {}, format: 'excel' | 'pdf' = 'excel') => {
    try {
      const params = new URLSearchParams();
      
      // Add filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      params.append('format', format);
      
      const response = await axios.get(`/admin/deposits/export?${params}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], {
        type: format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `deposits-report-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error exporting deposits report:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  }
};
