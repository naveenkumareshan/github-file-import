
import axiosInstance from './axiosConfig';

export interface SettingsData {
  _id?: string;
  category: 'site' | 'payment' | 'email' | 'sms';
  provider?: string;
  settings: Record<string, any>;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const settingsService = {
  // Get all settings or filter by category
  getSettings: async (category?: string, provider?: string) => {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (provider) params.append('provider', provider);
      
      const response = await axiosInstance.get(`/admin/settings?${params}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error fetching settings:', error);
      return { success: false, error };
    }
  },

  // Get settings by category and provider
  getSettingsByProvider: async (category: string, provider: string) => {
    try {
      const response = await axiosInstance.get(`/admin/settings/${category}/${provider}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error fetching settings:', error);
      return { success: false, error };
    }
  },

  // Create or update settings
  saveSettings: async (settingsData: Omit<SettingsData, '_id' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await axiosInstance.post('/admin/settings', settingsData);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error saving settings:', error);
      return { success: false, error };
    }
  },

  // Update existing settings
  updateSettings: async (category: string, provider: string | undefined, settingsData: Partial<SettingsData>) => {
    try {
      const url = provider 
        ? `/admin/settings/${category}/${provider}` 
        : `/admin/settings/${category}`;
        
      const response = await axiosInstance.put(url, settingsData);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error updating settings:', error);
      return { success: false, error };
    }
  },

  // Delete settings
  deleteSettings: async (category: string, provider?: string) => {
    try {
      const url = provider 
        ? `/admin/settings/${category}/${provider}` 
        : `/admin/settings/${category}`;
        
      const response = await axiosInstance.delete(url);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error deleting settings:', error);
      return { success: false, error };
    }
  },

  // Test email configuration
  testEmailSettings: async (provider: string, settings: Record<string, any>, testEmail: string) => {
    try {
      const response = await axiosInstance.post('/admin/settings/test/email', {
        provider,
        settings,
        testEmail
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error testing email settings:', error);
      return { success: false, error };
    }
  },

  // Test SMS configuration
  testSmsSettings: async (provider: string, settings: Record<string, any>, testPhone: string) => {
    try {
      const response = await axiosInstance.post('/admin/settings/test/sms', {
        provider,
        settings,
        testPhone
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error testing SMS settings:', error);
      return { success: false, error };
    }
  }
};
