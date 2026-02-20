
import axios from './axiosConfig';

export interface BulkBookingData {
  cabinId: string;
  students: {
    name: string;
    email: string;
    phone: string;
    status?: string;
    receipt_no?: string;
    endDate?: string;
    room_name: string;
    seat_no: number;
    startDate: string;
    transaction_id: string;
    amount: string;
    key_deposite:string;
  }[];
}

export interface BulkBookingResult {
  success: boolean;
  data?: {
    successful: Array<{
      studentName: string;
      bookingId: string;
      transactionId: string;
      seatNumber: number;
      totalPrice: number;
      userId: string;
    }>;
    failed: Array<{
      studentName: string;
      error: string;
    }>;
  };
  error?: string;
}

export const bulkBookingService = {
  // Create bulk bookings with seat assignment
  createBulkBookings: async (data: BulkBookingData): Promise<BulkBookingResult> => {
    try {
      const response = await axios.post('/admin/bookings/bulk-create', data);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error creating bulk bookings:', error);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // Get available seats for a cabin
  getAvailableSeats: async (cabinId: string, selectedFloor: string) => {
    try {
      const response = await axios.get(`/seats/cabin/${cabinId}/${selectedFloor}?isAvailable=true`);
      return { success: true, data: response.data.data || response.data };
    } catch (error) {
      console.error('Error fetching available seats:', error);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // Validate Excel data before processing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validateStudentData: (students: any[]): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const requiredFields = ['pay_mode','name','email', 'amount', 'startDate','endDate','seat_no','status','receipt_no','transaction_id'];

    students.forEach((student, index) => {
      requiredFields.forEach(field => {
        if (!student[field]) {
          errors.push(`Row ${index + 1}: Missing ${field}`);
        }
      });

      // Validate email format
      if (student.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
        errors.push(`Row ${index + 1}: Invalid email format`);
      }

      // Validate phone format
      if (student.phone && !/^\d{10}$/.test(String(student.phone).replace(/\D/g, ''))) {
        errors.push(`Row ${index + 1}  ${student.phone}: Invalid phone format`);
      }

      // Validate start date
      if (student.startDate && isNaN(Date.parse(student.startDate))) {
        errors.push(`Row ${index + 1}: Invalid start date format`);
      }
      if (student.endDate && isNaN(Date.parse(student.endDate))) {
        errors.push(`Row ${index + 1}: Invalid start date format`);
      }
    });

    return { valid: errors.length === 0, errors };
  },

  // Generate booking report
  generateBookingReport: async (bookingIds: string[]) => {
    try {
      const response = await axios.post('/admin/bookings/generate-report', { bookingIds });
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error generating report:', error);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // Get bulk booking status
  getBulkBookingStatus: async (batchId: string) => {
    try {
      const response = await axios.get(`/admin/bookings/status/${batchId}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error getting bulk booking status:', error);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }
};
