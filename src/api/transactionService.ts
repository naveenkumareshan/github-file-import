
import axios from './axiosConfig';

interface TransactionData {
  bookingId: string;
  bookingType: 'cabin' | 'hostel' | 'laundry';
  transactionType: 'booking' | 'renewal' | 'cancellation';
  amount: number;
  currency: string;
  additionalMonths?: number;
  newEndDate?: string;
  paymentMethod?: string;
}

export const transactionService = {
  // Create a new transaction
  createTransaction: async (data: TransactionData) => {
    try {
      const response = await axios.post('/transactions', data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating transaction:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  createTransactionByAdmin: async (data: TransactionData) => {
    try {
      const response = await axios.post('/transactions/by-admin', data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating transaction:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Get transaction by ID
  getTransaction: async (transactionId: string) => {
    try {
      const response = await axios.get(`/transactions/${transactionId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Update transaction status
  updateTransactionStatus: async (bookingId: string, status: string, paymentData?: object) => {
    try {
      const response = await axios.put(`/transactions/${bookingId}/status`, {
        status,
        ...paymentData
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating transaction status:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Process renewal after successful payment
  processRenewal: async (transactionId: string, paymentData: unknown) => {
    try {
      const response = await axios.post(`/transactions/${transactionId}/process-renewal`, paymentData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error processing renewal:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Get user transactions
  getUserTransactions: async () => {
    try {
      const response = await axios.get('/transactions/user-transactions');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },
    // Get user transactions
  getBookingTransactions: async (bookingId) => {
    try {
      const response = await axios.get(`/transactions/booking/${bookingId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  }
};
