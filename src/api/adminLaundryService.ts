
import axios from './axiosConfig';

interface LaundryItemData {
  icon?: string;
  name: string;
  price: number;
}

interface OrderStatusData {
  status: string;
  deliveryDate?: string;
}

interface LaundryFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
  block?: string;
  floor?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export const adminLaundryService = {
  // Menu Item Management
  getAllMenuItems: async () => {
    const response = await axios.get('/admin/laundry/menu');
    return response.data;
  },
  
  createMenuItem: async (data: LaundryItemData) => {
    const response = await axios.post('/admin/laundry/menu', data);
    return response.data;
  },
  
  updateMenuItem: async (id: string, data: Partial<LaundryItemData>) => {
    const response = await axios.put(`/admin/laundry/menu/${id}`, data);
    return response.data;
  },
  
  deleteMenuItem: async (id: string) => {
    const response = await axios.delete(`/admin/laundry/menu/${id}`);
    return response.data;
  },
  
  // Order Management
  getAllOrders: async (filters: LaundryFilters = {}) => {
    const response = await axios.get('/admin/laundry/orders', { params: filters });
    return response.data;
  },
  
  getOrderById: async (id: string) => {
    const response = await axios.get(`/admin/laundry/orders/${id}`);
    return response.data;
  },
  
  updateOrderStatus: async (id: string, data: OrderStatusData) => {
    const response = await axios.put(`/admin/laundry/orders/${id}/status`, data);
    return response.data;
  },
  
  deleteOrder: async (id: string) => {
    const response = await axios.delete(`/admin/laundry/orders/${id}`);
    return response.data;
  },
  
  // Complaint Management
  getAllComplaints: async (filters: LaundryFilters = {}) => {
    const response = await axios.get('/admin/laundry/complaints', { params: filters });
    return response.data;
  },
  
  resolveComplaint: async (orderId: string, complaintIndex: number, resolution: string) => {
    const response = await axios.put(`/admin/laundry/complaints/${orderId}/resolve`, {
      complaintIndex,
      resolution
    });
    return response.data;
  },
  
  // Reports and Analytics
  getOrderReports: async (filters: LaundryFilters = {}) => {
    const response = await axios.get('/admin/laundry/reports', { params: filters });
    return response.data;
  },
  
  getOrderStatistics: async (timeRange?: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    const response = await axios.get('/admin/laundry/statistics', { 
      params: { timeRange } 
    });
    return response.data;
  },
  
  getRevenueByCategory: async (timeRange?: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    const response = await axios.get('/admin/laundry/revenue-by-category', { 
      params: { timeRange } 
    });
    return response.data;
  },
  
  getBlockDistribution: async () => {
    const response = await axios.get('/admin/laundry/block-distribution');
    return response.data;
  },
  
  // Bulk Operations
  bulkUpdateOrderStatus: async (orderIds: string[], status: string) => {
    const response = await axios.put('/admin/laundry/orders/bulk-status', {
      orderIds,
      status
    });
    return response.data;
  }
};
