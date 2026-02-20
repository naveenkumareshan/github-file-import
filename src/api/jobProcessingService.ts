import axios from './axiosConfig';

interface Job {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: 'high' | 'normal' | 'low';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  attempts: number;
  maxAttempts: number;
  error?: string;
  data: any;
}

interface JobResponse {
  success: boolean;
  jobId?: string;
  message?: string;
  error?: string;
}

interface JobStatusResponse {
  success: boolean;
  job?: Job;
  message?: string;
}

interface JobsListResponse {
  success: boolean;
  jobs?: Job[];
  message?: string;
}
export interface JobsFilters {
  status?: string;
  page?: number;
  limit?: number;
}

export const jobProcessingService = {
  // Add a new job to the queue
  addJob: async (type: string, data: any, priority: 'high' | 'normal' | 'low' = 'normal'): Promise<JobResponse> => {
    const response = await axios.post('/jobs/add', { type, data, priority });
    return response.data;
  },

  // Get job status by ID
  getJobStatus: async (jobId: string): Promise<JobStatusResponse> => {
    const response = await axios.get(`/jobs/${jobId}`);
    return response.data;
  },

  getAllJobs: async (filters?: JobsFilters) => {
    try {
      const response = await axios.get('/jobs', { params: filters });
      return {
        success: true,
        data: response.data.data || response.data,
        count: response.data.count || 0,
        totalPages: response.data.totalPages || 1
      };
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return {
        success: false,
        error,
        data: [],
        count: 0,
        totalPages: 1
      };
    }
  },

  // Get jobs by status
  getJobsByStatus: async (status: string): Promise<JobsListResponse> => {
    const response = await axios.get(`/jobs/status/${status}`);
    return response.data;
  },

  // Send welcome email job
  sendWelcomeEmail: async (email: string, name: string): Promise<JobResponse> => {
    return await jobProcessingService.addJob('send_welcome_email', { email, name }, 'normal');
  },

  // Send password reset email job
  sendPasswordResetEmail: async (email: string, resetToken: string, resetUrl: string): Promise<JobResponse> => {
    return await jobProcessingService.addJob('send_password_reset_email', { email, resetToken, resetUrl }, 'high');
  },

  // Send booking confirmation email job
  sendBookingConfirmationEmail: async (email: string, name: string, bookingDetails: any): Promise<JobResponse> => {
    return await jobProcessingService.addJob('send_booking_confirmation', { 
      email, 
      name, 
      bookingDetails 
    }, 'high');
  },

  // Send booking reminder email job
  sendBookingReminderEmail: async (email: string, name: string, bookingDetails: any): Promise<JobResponse> => {
    return await jobProcessingService.addJob('send_booking_reminder', { 
      email, 
      name, 
      bookingDetails 
    }, 'normal');
  },
  // Send booking failed email job
  sendBookingFailedEmail: async (email: string, name: string, bookingDetails: any, errorMessage: string): Promise<JobResponse> => {
    return await jobProcessingService.addJob('send_booking_failed', { 
      email, 
      name, 
      bookingDetails,
      errorMessage 
    }, 'high');
  },


  retryJob: async (jobId: string) => {
    try {
      const response = await axios.post(`/jobs/${jobId}/retry`);
      return response.data;
    } catch (error) {
      console.error('Error retrying job:', error);
      return { success: false, error: error };
    }
  },

  exportJobReport: async (filters: any) => {
    try {
      const response = await axios.post('/jobs/export', filters, {
        responseType: 'blob'
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error exporting job report:', error);
      return { success: false, error: error };
    }
  }
};