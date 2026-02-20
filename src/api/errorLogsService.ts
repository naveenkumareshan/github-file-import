import axiosConfig from './axiosConfig';

export interface ErrorLog {
  _id: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  source: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
  userAgent?: string;
  ip?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  errorCode?: string;
  metadata?: any;
  resolved: boolean;
  resolvedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  resolvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ErrorLogFilters {
  page?: number;
  limit?: number;
  level?: string;
  source?: string;
  resolved?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface ErrorLogResponse {
  logs: ErrorLog[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalLogs: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ErrorLogStats {
  totalLogs: number;
  resolvedLogs: number;
  pendingLogs: number;
  errorLevelStats: Array<{ _id: string; count: number }>;
  sourceStats: Array<{ _id: string; count: number }>;
}

export interface CreateErrorLogData {
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  source: string;
  userId?: string;
  userAgent?: string;
  ip?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  errorCode?: string;
  metadata?: any;
}

const errorLogsService = {
  // Get error logs with pagination and filtering
  getErrorLogs: async (filters: ErrorLogFilters = {}): Promise<ErrorLogResponse> => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const response = await axiosConfig.get(`/error-logs?${params.toString()}`);
    return response.data;
  },

  // Create new error log
  createErrorLog: async (data: CreateErrorLogData): Promise<{ message: string; errorLog: ErrorLog }> => {
    const response = await axiosConfig.post('/error-logs', data);
    return response.data;
  },

  // Delete error log
  deleteErrorLog: async (id: string): Promise<{ message: string }> => {
    const response = await axiosConfig.delete(`/error-logs/${id}`);
    return response.data;
  },

  // Delete multiple error logs
  deleteMultipleErrorLogs: async (ids: string[]): Promise<{ message: string; deletedCount: number }> => {
    const response = await axiosConfig.delete('/error-logs/bulk', {
      data: { ids }
    });
    return response.data;
  },

  // Mark error log as resolved
  markAsResolved: async (id: string, notes?: string): Promise<{ message: string; errorLog: ErrorLog }> => {
    const response = await axiosConfig.patch(`/error-logs/${id}/resolve`, { notes });
    return response.data;
  },

  // Get error log statistics
  getErrorLogStats: async (startDate?: string, endDate?: string): Promise<ErrorLogStats> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await axiosConfig.get(`/error-logs/stats?${params.toString()}`);
    return response.data;
  }
};

export default errorLogsService