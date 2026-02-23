
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface UploadResponse {
  success: boolean;
  data: {
    url: string;
  };
  message?: string;
}

const BUCKET_NAME = 'cabin-images';

export const uploadService = {
  uploadImage: async (file: File): Promise<UploadResponse> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      return {
        success: true,
        data: { url: publicUrl },
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      return {
        success: false,
        data: { url: '' },
        message: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  },

  deleteImage: async (imageUrl: string): Promise<UploadResponse> => {
    try {
      // Extract the path from the full public URL
      const urlParts = imageUrl.split(`/storage/v1/object/public/${BUCKET_NAME}/`);
      const filePath = urlParts.length > 1 ? urlParts[1] : '';

      if (!filePath) {
        return { success: true, data: { url: '' } }; // Legacy URL, skip deletion
      }

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (error) throw error;

      return { success: true, data: { url: '' } };
    } catch (error) {
      console.error('Error deleting image:', error);
      return {
        success: false,
        data: { url: '' },
        message: error instanceof Error ? error.message : 'Delete failed',
      };
    }
  },

  uploadMultipleImages: async (files: File[]): Promise<{ success: boolean; data: { urls: string[] }; message?: string }> => {
    try {
      const urls: string[] = [];

      for (const file of files) {
        const result = await uploadService.uploadImage(file);
        if (result.success) {
          urls.push(result.data.url);
        }
      }

      return {
        success: true,
        data: { urls },
      };
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      return {
        success: false,
        data: { urls: [] },
        message: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  },

  uploadCabinImage: async (cabinId: string, file: File): Promise<UploadResponse> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `cabins/${cabinId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      return {
        success: true,
        data: { url: publicUrl },
      };
    } catch (error) {
      console.error(`Error uploading image for cabin ${cabinId}:`, error);
      return {
        success: false,
        data: { url: '' },
        message: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  },
};
