import { supabase } from '@/integrations/supabase/client';

export interface AttendanceRecord {
  id: string;
  student_id: string;
  property_id: string;
  property_type: string;
  seat_or_bed_id: string | null;
  booking_id: string | null;
  check_in_time: string;
  date: string;
  serial_number: string | null;
  created_at: string;
  // joined
  student_name?: string;
  student_phone?: string;
  student_email?: string;
  seat_label?: string;
}

export interface MarkAttendanceResult {
  success: boolean;
  error?: string;
  already_marked?: boolean;
  student_name?: string;
  phone?: string;
  seat_label?: string;
  property_name?: string;
  check_in_time?: string;
  meal_type?: string;
  booking_start_date?: string;
  booking_end_date?: string;
  booking_duration?: string;
}

export const attendanceService = {
  async markAttendance(propertyId: string, propertyType: string): Promise<MarkAttendanceResult> {
    const { data, error } = await supabase.rpc('mark_qr_attendance', {
      p_property_id: propertyId,
      p_property_type: propertyType,
    });
    if (error) return { success: false, error: error.message };
    return data as unknown as MarkAttendanceResult;
  },

  async getPropertyAttendance(propertyId: string, date: string): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase
      .from('property_attendance')
      .select('*')
      .eq('property_id', propertyId)
      .eq('date', date)
      .order('check_in_time', { ascending: false });
    if (error) {
      console.error('Error fetching attendance:', error);
      return [];
    }
    return (data || []) as unknown as AttendanceRecord[];
  },

  async getTodayAttendanceSet(propertyId: string): Promise<Set<string>> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('property_attendance')
      .select('seat_or_bed_id')
      .eq('property_id', propertyId)
      .eq('date', today);
    if (error) {
      console.error('Error fetching attendance set:', error);
      return new Set();
    }
    return new Set((data || []).map((r: any) => r.seat_or_bed_id).filter(Boolean));
  },

  async getAllPropertiesAttendanceToday(propertyIds: string[]): Promise<Set<string>> {
    if (propertyIds.length === 0) return new Set();
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('property_attendance')
      .select('seat_or_bed_id')
      .in('property_id', propertyIds)
      .eq('date', today);
    if (error) {
      console.error('Error fetching attendance:', error);
      return new Set();
    }
    return new Set((data || []).map((r: any) => r.seat_or_bed_id).filter(Boolean));
  },

  async getAttendanceSummary(propertyId: string, date: string) {
    const { data, error } = await supabase
      .from('property_attendance')
      .select('id')
      .eq('property_id', propertyId)
      .eq('date', date);
    return { count: data?.length || 0, error };
  },

  async markPinAttendance(propertyId: string, propertyType: string, pin: string): Promise<MarkAttendanceResult> {
    const { data, error } = await supabase.rpc('mark_pin_attendance', {
      p_property_id: propertyId,
      p_property_type: propertyType,
      p_pin: pin,
    });
    if (error) return { success: false, error: error.message };
    return data as unknown as MarkAttendanceResult;
  },

  async getAttendancePin(propertyId: string, propertyType: string): Promise<{ pin: string; seconds_remaining: number } | null> {
    const { data, error } = await supabase.rpc('generate_attendance_pin', {
      p_property_id: propertyId,
      p_property_type: propertyType,
    });
    if (error) {
      console.error('Error generating PIN:', error);
      return null;
    }
    return data as unknown as { pin: string; seconds_remaining: number };
  },
};
