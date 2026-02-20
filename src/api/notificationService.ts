
import axios from './axiosConfig';

export interface NotificationData {
  title: string;
  body: string;
  type: 'offer' | 'booking' | 'general' | 'vendor_promotion';
  targetType: 'all' | 'vendor_specific' | 'user_specific' | 'role_specific';
  targetIds?: string[];
  vendorId?: string;
  offerData?: {
    discount: number;
    validUntil: string;
    offerCode?: string;
    description?: string;
  };
  scheduledFor?: string;
  includeEmail?: boolean;
  emailTemplateId?: string;
}

export interface NotificationHistory {
  _id: string;
  title: string;
  body: string;
  type: string;
  targetType: string;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  sentAt: string;
  createdBy: {
    name: string;
    email: string;
  };
  status: 'pending' | 'sent' | 'failed';
}

export const notificationService = {
  // Send push notification
  sendNotification: async (data: NotificationData) => {
    const response = await axios.post('/notifications/send', data);
    return response.data;
  },

  // Send offer notification to vendor users
  sendVendorOffer: async (vendorId: string, offerData: NotificationData) => {
    const response = await axios.post(`/notifications/vendor-offer/${vendorId}`, offerData);
    return response.data;
  },

  // Get notification history
  getNotificationHistory: async (page = 1, limit = 20) => {
    const response = await axios.get('/notifications/history', {
      params: { page, limit }
    });
    return response.data;
  },

  // Get notification statistics
  getNotificationStats: async () => {
    const response = await axios.get('/notifications/stats');
    return response.data;
  },

  // Update FCM token for user
  updateFcmToken: async (token: string) => {
    const response = await axios.post('/notifications/update-token', { fcmToken: token });
    return response.data;
  },

  // Test notification
  testNotification: async (token: string, title: string, body: string) => {
    const response = await axios.post('/notifications/test', { token, title, body });
    return response.data;
  }
};
