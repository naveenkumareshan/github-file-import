
import axios from './axiosConfig';

interface ProfileData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  bio?: string;
  profilePicture?: string;
  preferences?: Record<string, any>;
}

export const userProfileService = {
  getUserProfile: async () => {
    const response = await axios.get('/users/profile');
    return response.data;
  },
  
  updateProfile: async (data: Partial<ProfileData>) => {
    const response = await axios.put('/users/profile', data);
    return response.data;
  },
  
  uploadProfilePicture: async (file: File) => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    const response = await axios.post('/users/profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  removeProfilePicture: async () => {
    const response = await axios.delete('/users/profile/picture');
    return response.data;
  },
  
  updatePassword: async (currentPassword: string, newPassword: string) => {
    const response = await axios.put('/users/password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },
  
  getPreferences: async () => {
    const response = await axios.get('/users/preferences');
    return response.data;
  },
  
  updatePreferences: async (preferences: Record<string, any>) => {
    const response = await axios.put('/users/preferences', { preferences });
    return response.data;
  }
};
