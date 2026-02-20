export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      banners: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          link_url: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_duration: string | null
          cabin_id: string | null
          created_at: string | null
          duration_count: string | null
          end_date: string | null
          id: string
          payment_status: string | null
          seat_number: number | null
          start_date: string | null
          total_price: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_duration?: string | null
          cabin_id?: string | null
          created_at?: string | null
          duration_count?: string | null
          end_date?: string | null
          id?: string
          payment_status?: string | null
          seat_number?: number | null
          start_date?: string | null
          total_price?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_duration?: string | null
          cabin_id?: string | null
          created_at?: string | null
          duration_count?: string | null
          end_date?: string | null
          id?: string
          payment_status?: string | null
          seat_number?: number | null
          start_date?: string | null
          total_price?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          },
        ]
      }
      cabins: {
        Row: {
          amenities: string[] | null
          area: string | null
          capacity: number | null
          category: string | null
          city: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price: number | null
          state: string | null
        }
        Insert: {
          amenities?: string[] | null
          area?: string | null
          capacity?: number | null
          category?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price?: number | null
          state?: string | null
        }
        Update: {
          amenities?: string[] | null
          area?: string | null
          capacity?: number | null
          category?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: number | null
          state?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          alternate_phone: string | null
          bio: string | null
          city: string | null
          college_studied: string | null
          course_preparing_for: string | null
          course_studying: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          gender: string | null
          id: string
          name: string | null
          parent_mobile_number: string | null
          phone: string | null
          pincode: string | null
          profile_edit_count: number | null
          profile_picture: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          alternate_phone?: string | null
          bio?: string | null
          city?: string | null
          college_studied?: string | null
          course_preparing_for?: string | null
          course_studying?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          gender?: string | null
          id: string
          name?: string | null
          parent_mobile_number?: string | null
          phone?: string | null
          pincode?: string | null
          profile_edit_count?: number | null
          profile_picture?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          alternate_phone?: string | null
          bio?: string | null
          city?: string | null
          college_studied?: string | null
          course_preparing_for?: string | null
          course_studying?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          name?: string | null
          parent_mobile_number?: string | null
          phone?: string | null
          pincode?: string | null
          profile_edit_count?: number | null
          profile_picture?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "student"
        | "vendor"
        | "vendor_employee"
        | "hostel_manager"
        | "super_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "student",
        "vendor",
        "vendor_employee",
        "hostel_manager",
        "super_admin",
      ],
    },
  },
} as const
