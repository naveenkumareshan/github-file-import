
import axios from './axiosConfig';

interface ForgotPasswordData {
  email: string;
}

interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export const passwordResetService = {
  requestPasswordReset: async (data: ForgotPasswordData) => {
    const response = await axios.post('/auth/forgot-password', data);
    return response.data;
  },
  
  resetPassword: async (data: ResetPasswordData) => {
    const response = await axios.post('/auth/reset-password', data);
    return response.data;
  },
  
  validateResetToken: async (token: string) => {
    const response = await axios.get(`/auth/validate-reset-token/${token}`);
    return response.data;
  }
};
