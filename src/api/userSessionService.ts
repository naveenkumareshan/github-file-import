
import axios from './axiosConfig';

export interface UserSession {
  _id: string;
  userId: {
    _id: string;
    userId: string;
    name: string;
    email: string;
    phone: string;
    role: string;
  };
  deviceType: 'web' | 'mobile';
  platform?: 'ios' | 'android' | 'web';
  deviceInfo?: {
    deviceId?: string;
    deviceModel?: string;
    osVersion?: string;
    appVersion?: string;
    userAgent?: string;
  };
  loginTime: string;
  lastActiveTime: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  isActive: boolean;
  sessionToken: string;
}

export interface SessionFilters {
  deviceType?: 'web' | 'mobile';
  platform?: 'ios' | 'android' | 'web';
  role?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedSessionResponse {
  success: boolean;
  data: UserSession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const userSessionService = {
  // Get all active user sessions with pagination
  getActiveSessions: async (filters?: SessionFilters): Promise<PaginatedSessionResponse> => {
    const response = await axios.get('/admin/user-sessions', { params: filters });
    return response.data;
  },

  // Get session statistics
  getSessionStatistics: async () => {
    const response = await axios.get('/admin/user-sessions/statistics');
    return response.data;
  },

  // Force logout a user session
  forceLogout: async (sessionId: string) => {
    const response = await axios.post(`/admin/user-sessions/${sessionId}/logout`);
    return response.data;
  },

  // Get user's login history
  getUserLoginHistory: async (userId: string, page?: number, limit?: number) => {
    const response = await axios.get(`/admin/user-sessions/history/${userId}`, {
      params: { page, limit }
    });
    return response.data;
  }
};
