
import axios from './axiosConfig';

interface EmailTemplate {
  _id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
  category: 'booking' | 'reminder' | 'welcome' | 'password_reset' | 'notification';
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateTemplateData {
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables?: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
  category?: string;
}

export const emailTemplatesService = {
  // Get all email templates
  getEmailTemplates: async (category?: string, isActive?: boolean) => {
    try {
      let url = '/email-templates';
      const params = new URLSearchParams();
      
      if (category) params.append('category', category);
      if (isActive !== undefined) params.append('isActive', isActive.toString());
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching email templates:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get single email template
  getEmailTemplate: async (id: string) => {
    try {
      const response = await axios.get(`/email-templates/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching email template:', error);
      throw error.response?.data || error.message;
    }
  },

  // Create email template
  createEmailTemplate: async (data: CreateTemplateData) => {
    try {
      const response = await axios.post('/email-templates', data);
      return response.data;
    } catch (error) {
      console.error('Error creating email template:', error);
      throw error.response?.data || error.message;
    }
  },

  // Update email template
  updateEmailTemplate: async (id: string, data: Partial<CreateTemplateData>) => {
    try {
      const response = await axios.put(`/email-templates/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating email template:', error);
      throw error.response?.data || error.message;
    }
  },

  // Delete email template
  deleteEmailTemplate: async (id: string) => {
    try {
      const response = await axios.delete(`/email-templates/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting email template:', error);
      throw error.response?.data || error.message;
    }
  }
};

export type { EmailTemplate, CreateTemplateData };
