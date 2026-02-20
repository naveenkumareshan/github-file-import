
import axios from './axiosConfig';

interface UploadResponse {
  success: boolean;
  data: {
    url: string;
  };
  message?: string;
}

export const uploadService = {
  uploadImage: async (file: File): Promise<UploadResponse> => {
    // Create form data to send the file
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post('/uploads/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },
  
  deleteImage: async (imageUrl: string): Promise<UploadResponse> => {
    try {
      // Extract the filename from the URL
      const filename = imageUrl.split('/').pop();
      const response = await axios.delete(`/uploads/image/${filename}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  },
  
  // Upload multiple images at once
  uploadMultipleImages: async (files: File[]): Promise<UploadResponse> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append(`images`, file);
    });

    try {
      const response = await axios.post('/uploads/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      throw error;
    }
  },
  
  // Upload cabin image specifically
  uploadCabinImage: async (cabinId: string, file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await axios.post(`/cabins/${cabinId}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error uploading image for cabin ${cabinId}:`, error);
      throw error;
    }
  }
};
