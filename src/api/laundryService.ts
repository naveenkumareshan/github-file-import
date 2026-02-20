
import axios from './axiosConfig';

interface LaundryOrderItem {
  icon?: string;
  name: string;
  price: number;
  quantity: number;
}

interface PickupLocation {
  roomNumber: string;
  block: string;
  floor: string;
  pickupTime?: string;
}

interface LaundryOrderData {
  items: LaundryOrderItem[];
  totalAmount: number;
  pickupLocation: PickupLocation;
}

interface LaundryComplaintData {
  text: string;
}

interface LaundryOrderFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  block?: string;
  page?: number;
  limit?: number;
}

export const laundryService = {
  // Menu Items
  getMenuItems: async () => {
    const response = await axios.get('/laundry/menu');
    return response.data;
  },
  
  createMenuItem: async (data: { icon: string; name: string; price: number }) => {
    const response = await axios.post('/laundry/menu', data);
    return response.data;
  },
  
  deleteMenuItem: async (id: string) => {
    const response = await axios.delete(`/laundry/menu/${id}`);
    return response.data;
  },
  
  // Orders
  createOrder: async (data: LaundryOrderData) => {
    const response = await axios.post('/laundry/orders', data);
    return response.data;
  },
  
  getUserOrders: async (filters?: LaundryOrderFilters) => {
    const response = await axios.get('/laundry/orders/user', { params: filters });
    return response.data;
  },
  
  getAllOrders: async (filters: LaundryOrderFilters = {}) => {
    const response = await axios.get('/laundry/orders', { params: filters });
    return response.data;
  },
  
  updateOrderStatus: async (id: string, data: { status: string; deliveryDate?: string }) => {
    const response = await axios.put(`/laundry/orders/${id}/status`, data);
    return response.data;
  },
  
  // Complaints
  createComplaint: async (orderId: string, data: LaundryComplaintData) => {
    const response = await axios.post(`/laundry/orders/${orderId}/complaints`, data);
    return response.data;
  },
  
  resolveComplaint: async (data: { orderId: string; complaintIndex: number }) => {
    const response = await axios.put(`/laundry/complaints/${data.orderId}/resolve`, data);
    return response.data;
  },
  
  // Reports
  getLaundryReports: async (filters?: LaundryOrderFilters) => {
    const response = await axios.get('/laundry/reports', { params: filters });
    return response.data;
  },
  
  // Current user orders by status
  getCurrentProcessingOrders: async () => {
    const response = await axios.get('/laundry/orders/user', { 
      params: { status: 'Processing' } 
    });
    return response.data;
  },
  
  getCurrentDeliveredOrders: async () => {
    const response = await axios.get('/laundry/orders/user', { 
      params: { status: 'Delivered' } 
    });
    return response.data;
  }
};
