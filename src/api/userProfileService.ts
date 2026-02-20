import { supabase } from '@/integrations/supabase/client';

interface ProfileData {
  name?: string;
  email?: string;
  phone?: string;
  alternate_phone?: string;
  address?: string;
  bio?: string;
  profile_picture?: string;
  gender?: string;
  city?: string;
  state?: string;
  pincode?: string;
  date_of_birth?: string;
  course_preparing_for?: string;
  course_studying?: string;
  college_studied?: string;
  parent_mobile_number?: string;
}

export const userProfileService = {
  getUserProfile: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, data: null };

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !data) {
        // Return defaults from auth metadata if no profile row yet
        return {
          success: true,
          data: {
            id: user.id,
            name: user.user_metadata?.name || '',
            email: user.email || '',
            phone: user.user_metadata?.phone || '',
            alternate_phone: '',
            address: '',
            bio: '',
            profile_picture: user.user_metadata?.avatar_url || '',
            gender: user.user_metadata?.gender || '',
            city: '',
            state: '',
            pincode: '',
            date_of_birth: null,
            course_preparing_for: '',
            course_studying: '',
            college_studied: '',
            parent_mobile_number: '',
            profile_edit_count: 0,
          },
        };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching profile:', error);
      return { success: false, data: null };
    }
  },

  updateProfile: async (data: Partial<ProfileData>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false };

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...data,
          updated_at: new Date().toISOString(),
        });

      if (!error && data.name) {
        await supabase.auth.updateUser({ data: { name: data.name } });
      }

      return { success: !error };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false };
    }
  },

  uploadProfilePicture: async (file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false };

      const ext = file.name.split('.').pop();
      const path = `avatars/${user.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(path, file, { upsert: true });

      if (uploadError) return { success: false };

      const { data: urlData } = supabase.storage.from('profiles').getPublicUrl(path);
      const url = urlData.publicUrl;

      await supabase.from('profiles').upsert({ id: user.id, profile_picture: url });

      return { success: true, data: { url } };
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      return { success: false };
    }
  },

  removeProfilePicture: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false };

      const { error } = await supabase
        .from('profiles')
        .update({ profile_picture: null })
        .eq('id', user.id);

      return { success: !error };
    } catch (error) {
      console.error('Error removing profile picture:', error);
      return { success: false };
    }
  },

  updatePassword: async (currentPassword: string, newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      return { success: !error };
    } catch (error) {
      console.error('Error updating password:', error);
      return { success: false };
    }
  },

  getPreferences: async () => {
    return { success: true, data: {} };
  },

  updatePreferences: async (preferences: Record<string, any>) => {
    return { success: true };
  },
};
