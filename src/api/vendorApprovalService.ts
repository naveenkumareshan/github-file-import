
import { supabase } from '@/integrations/supabase/client';

export interface VendorFilters {
  status?: 'pending' | 'approved' | 'rejected' | 'suspended' | 'all';
  businessType?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  city?: string;
  state?: string;
}

export interface VendorApprovalData {
  action: 'approve' | 'reject' | 'suspend';
  notes?: string;
  rejectionReason?: string;
  commissionRate?: number;
}

export interface Vendor {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string;
  contact_person: string;
  email: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  address: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  business_details: {
    gstNumber?: string;
    panNumber?: string;
    aadharNumber?: string;
    businessLicense?: string;
    description?: string;
  };
  bank_details: {
    accountHolderName?: string;
    accountNumber?: string;
    bankName?: string;
    ifscCode?: string;
    upiId?: string;
  };
  commission_settings: {
    type?: string;
    value?: number;
    payoutCycle?: string;
  };
  serial_number: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VendorsResponse {
  vendors: Vendor[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface PaginationParams {
  page: number;
  limit: number;
}

export const vendorApprovalService = {
  getVendors: async (pagination: PaginationParams, filters: VendorFilters = {}) => {
    try {
      let query = supabase.from('partners').select('*', { count: 'exact' });

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.businessType) {
        query = query.eq('business_type', filters.businessType);
      }
      if (filters.search) {
        query = query.or(`business_name.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }
      if (filters.city) {
        query = query.ilike('address->>city', `%${filters.city}%`);
      }
      if (filters.state) {
        query = query.ilike('address->>state', `%${filters.state}%`);
      }

      const from = (pagination.page - 1) * pagination.limit;
      const to = from + pagination.limit - 1;
      query = query.order('created_at', { ascending: false }).range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pagination.limit);

      const response: VendorsResponse = {
        vendors: (data || []) as unknown as Vendor[],
        totalCount,
        totalPages,
        currentPage: pagination.page,
        hasNextPage: pagination.page < totalPages,
        hasPrevPage: pagination.page > 1,
      };

      return { success: true, data: { data: response } };
    } catch (error: any) {
      return { success: false, error: { message: error.message } };
    }
  },

  getAllVendors: async (pagination: PaginationParams, filters: VendorFilters = {}) => {
    return vendorApprovalService.getVendors(pagination, filters);
  },

  getVendorById: async (vendorId: string) => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('id', vendorId)
        .single();
      if (error) throw error;
      return { success: true, data: { data: data as unknown as Vendor } };
    } catch (error: any) {
      return { success: false, error: { message: error.message } };
    }
  },

  updateVendorStatus: async (vendorId: string, data: VendorApprovalData) => {
    try {
      const updateData: any = { status: data.action === 'approve' ? 'approved' : data.action === 'reject' ? 'rejected' : 'suspended' };
      if (data.action === 'approve' && data.commissionRate !== undefined) {
        updateData.commission_settings = { type: 'percentage', value: data.commissionRate, payoutCycle: 'monthly' };
      }

      const { error } = await supabase
        .from('partners')
        .update(updateData)
        .eq('id', vendorId);
      if (error) throw error;
      return { success: true, data: {} };
    } catch (error: any) {
      return { success: false, error: { message: error.message } };
    }
  },

  updateVendorDetails: async (vendorId: string, data: Partial<Vendor>) => {
    try {
      const { data: updated, error } = await supabase
        .from('partners')
        .update(data as any)
        .eq('id', vendorId)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data: { data: updated as unknown as Vendor } };
    } catch (error: any) {
      return { success: false, error: { message: error.message } };
    }
  },

  getVendorStats: async () => {
    try {
      const { data, error } = await supabase.from('partners').select('status');
      if (error) throw error;

      const partners = data || [];
      const stats = {
        totalVendors: partners.length,
        pendingApprovals: partners.filter(p => p.status === 'pending').length,
        approvedVendors: partners.filter(p => p.status === 'approved').length,
        rejectedVendors: partners.filter(p => p.status === 'rejected').length,
        suspendedVendors: partners.filter(p => p.status === 'suspended').length,
        totalRevenue: 0,
        monthlyGrowth: 0,
      };

      return { success: true, data: { data: stats } };
    } catch (error: any) {
      return { success: false, error: { message: error.message } };
    }
  },

  exportVendors: async (filters: VendorFilters = {}) => {
    try {
      let query = supabase.from('partners').select('*');
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.search) {
        query = query.or(`business_name.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      // Convert to CSV
      const vendors = (data || []) as unknown as Vendor[];
      const headers = ['Business Name', 'Contact Person', 'Email', 'Phone', 'Status', 'Business Type', 'City', 'State', 'Created At'];
      const rows = vendors.map(v => [
        v.business_name, v.contact_person, v.email, v.phone, v.status, v.business_type,
        v.address?.city || '', v.address?.state || '', new Date(v.created_at).toLocaleDateString()
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });

      return { success: true, data: blob };
    } catch (error: any) {
      return { success: false, error: { message: error.message } };
    }
  },

  updateCommissionSettings: async (vendorId: string, commissionData: any) => {
    try {
      const { error } = await supabase
        .from('partners')
        .update({ commission_settings: commissionData })
        .eq('id', vendorId);
      if (error) throw error;
      return { success: true, data: {} };
    } catch (error: any) {
      return { success: false, error: { message: error.message } };
    }
  }
};

export const partnerApprovalService = vendorApprovalService;
