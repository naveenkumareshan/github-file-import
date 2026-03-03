import { supabase } from '@/integrations/supabase/client';

export interface AdminEmployeeData {
  id: string;
  admin_user_id: string;
  employee_user_id: string | null;
  name: string;
  email: string;
  phone: string;
  role: string;
  permissions: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AdminEmployeeCreateData {
  name: string;
  email: string;
  phone: string;
  password?: string;
  role?: string;
  permissions?: string[];
}

export interface AdminEmployeeUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  permissions?: string[];
  status?: string;
}

export const adminEmployeeService = {
  getEmployees: async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('admin_employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, data: [], error: error.message };
    }
  },

  createEmployee: async (employeeData: AdminEmployeeCreateData, employeeUserId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      const { data, error } = await (supabase as any)
        .from('admin_employees')
        .insert({
          admin_user_id: user.id,
          employee_user_id: employeeUserId || null,
          name: employeeData.name,
          email: employeeData.email,
          phone: employeeData.phone,
          role: employeeData.role || 'staff',
          permissions: employeeData.permissions || [],
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  updateEmployee: async (id: string, updateData: AdminEmployeeUpdateData) => {
    try {
      const payload: any = {};
      if (updateData.name !== undefined) payload.name = updateData.name;
      if (updateData.email !== undefined) payload.email = updateData.email;
      if (updateData.phone !== undefined) payload.phone = updateData.phone;
      if (updateData.role !== undefined) payload.role = updateData.role;
      if (updateData.permissions !== undefined) payload.permissions = updateData.permissions;
      if (updateData.status !== undefined) payload.status = updateData.status;

      const { data, error } = await (supabase as any)
        .from('admin_employees')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  deleteEmployee: async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('admin_employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};