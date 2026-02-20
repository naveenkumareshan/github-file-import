
import axios from './axiosConfig';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
  gender?: string;
}

interface HostelManagerRegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  hostelDetails?: {
    name: string;
    location: string;
    description?: string;
  };
}

interface LoginData {
  email: string;
  password: string;
}

interface SocialLoginData {
  name: string;
  email: string;
  provider: 'google' | 'facebook' | 'twitter';
  providerId: string;
  profilePicture?: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

interface UpdateUserData {
  newName: string;
}

export const authService = {
  register: async (data: RegisterData) => {
    const response = await axios.post('/auth/register', data);
    return response.data;
  },

  CreateUserregister: async (data: RegisterData) => {
    const response = await axios.post('/admin/users', data);
    return response.data;
  },
  
  registerHostelManager: async (data: HostelManagerRegisterData) => {
    const response = await axios.post('/auth/register-manager', data);
    return response.data;
  },
  
  login: async (data: LoginData) => {
    const response = await axios.post('/auth/login', data);
    return response.data;
  },
  
  socialLogin: async (data: SocialLoginData) => {
    const response = await axios.post('/auth/social-login', data);
    return response.data;
  },

  googleLogin: async (tokenData: { idToken: string, userData:any }) => {
    const response = await axios.post('/auth/google-token', tokenData);
    return response.data;
  },
  
  facebookLogin: async (tokenData: { accessToken: string, userData:any }) => {
    const response = await axios.post('/auth/facebook-token', tokenData);
    return response.data;
  },
  
  getProfile: async () => {
    const response = await axios.get('/auth/me');
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await axios.get('/auth/me');
    return response.data.user;
  },
  
  changePassword: async (data: ChangePasswordData) => {
    const response = await axios.post('/auth/change-password', data);
    return response.data;
  },

  updateName: async (data: UpdateUserData) => {
    const response = await axios.post('/auth/update-userdata', data);
    return response.data;
  },
  
  linkSocialAccount: async (provider: string, providerId: string) => {
    const response = await axios.post('/auth/link-social', { provider, providerId });
    return response.data;
  }
};
