import { supabase } from '@/integrations/supabase/client';

export interface VendorProfileData {
  _id: string;
  vendorId: string;
  businessName: string;
  businessType: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  businessDetails: {
    gstNumber: string;
    panNumber: string;
    aadharNumber: string;
    businessLicense: string;
    description: string;
  };
  bankDetails: {
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    upiId: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VendorProfileUpdateData {
  businessName?: string;
  contactPerson?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  businessDetails?: {
    description?: string;
    gstNumber?: string;
    panNumber?: string;
    aadharNumber?: string;
    businessLicense?: string;
  };
  bankDetails?: {
    accountHolderName?: string;
    accountNumber?: string;
    bankName?: string;
    ifscCode?: string;
    upiId?: string;
  };
}

// Helper to map Supabase partner row to VendorProfileData
function mapPartnerToProfile(row: any): VendorProfileData {
  const address = (row.address && typeof row.address === 'object') ? row.address : {};
  const businessDetails = (row.business_details && typeof row.business_details === 'object') ? row.business_details : {};
  const bankDetails = (row.bank_details && typeof row.bank_details === 'object') ? row.bank_details : {};

  return {
    _id: row.id,
    vendorId: row.serial_number || row.id,
    businessName: row.business_name || '',
    businessType: row.business_type || '',
    contactPerson: row.contact_person || '',
    email: row.email || '',
    phone: row.phone || '',
    address: {
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      pincode: address.pincode || '',
      country: address.country || 'India',
    },
    businessDetails: {
      gstNumber: businessDetails.gstNumber || '',
      panNumber: businessDetails.panNumber || '',
      aadharNumber: businessDetails.aadharNumber || '',
      businessLicense: businessDetails.businessLicense || '',
      description: businessDetails.description || '',
    },
    bankDetails: {
      accountHolderName: bankDetails.accountHolderName || '',
      accountNumber: bankDetails.accountNumber || '',
      bankName: bankDetails.bankName || '',
      ifscCode: bankDetails.ifscCode || '',
      upiId: bankDetails.upiId || '',
    },
    status: row.status || 'pending',
    isActive: row.is_active !== false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const vendorProfileService = {
  // Get vendor profile from Supabase partners table (auto-creates if missing)
  getProfile: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      let { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      // Auto-create partner record if missing
      if (!data) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, email, phone')
          .eq('id', user.id)
          .maybeSingle();

        const { data: newPartner, error: insertError } = await supabase
          .from('partners')
          .insert({
            user_id: user.id,
            business_name: profile?.name || 'Partner',
            contact_person: profile?.name || '',
            email: profile?.email || user.email || '',
            phone: profile?.phone || '',
            status: 'approved',
          })
          .select()
          .single();

        if (insertError) throw insertError;
        data = newPartner;
      }

      return { success: true, data: mapPartnerToProfile(data) };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to fetch profile' };
    }
  },

  // Update vendor profile in Supabase partners table
  updateProfile: async (profileData: VendorProfileUpdateData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      const updatePayload: any = {};
      if (profileData.businessName) updatePayload.business_name = profileData.businessName;
      if (profileData.contactPerson) updatePayload.contact_person = profileData.contactPerson;
      if (profileData.phone) updatePayload.phone = profileData.phone;
      if (profileData.address) updatePayload.address = profileData.address;
      if (profileData.businessDetails) {
        // Merge with existing business_details
        const { data: existing } = await supabase
          .from('partners')
          .select('business_details')
          .eq('user_id', user.id)
          .single();
        
        const existingDetails = (existing?.business_details && typeof existing.business_details === 'object') ? existing.business_details : {};
        updatePayload.business_details = { ...existingDetails, ...profileData.businessDetails };
      }
      if (profileData.bankDetails) {
        const { data: existing } = await supabase
          .from('partners')
          .select('bank_details')
          .eq('user_id', user.id)
          .single();
        
        const existingDetails = (existing?.bank_details && typeof existing.bank_details === 'object') ? existing.bank_details : {};
        updatePayload.bank_details = { ...existingDetails, ...profileData.bankDetails };
      }

      const { data, error } = await supabase
        .from('partners')
        .update(updatePayload)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: mapPartnerToProfile(data) };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to update profile' };
    }
  }
};

export const partnerProfileService = vendorProfileService;
