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
          expire_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link_url: string | null
          start_date: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          expire_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          start_date?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          expire_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          start_date?: string | null
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
          collected_by: string | null
          collected_by_name: string
          created_at: string | null
          discount_amount: number
          discount_reason: string
          duration_count: string | null
          end_date: string | null
          id: string
          locker_included: boolean
          locker_price: number
          locker_refund_amount: number
          locker_refund_date: string | null
          locker_refund_method: string
          locker_refund_transaction_id: string
          locker_refunded: boolean
          payment_method: string
          payment_status: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          seat_id: string | null
          seat_number: number | null
          serial_number: string | null
          start_date: string | null
          total_price: number | null
          transaction_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_duration?: string | null
          cabin_id?: string | null
          collected_by?: string | null
          collected_by_name?: string
          created_at?: string | null
          discount_amount?: number
          discount_reason?: string
          duration_count?: string | null
          end_date?: string | null
          id?: string
          locker_included?: boolean
          locker_price?: number
          locker_refund_amount?: number
          locker_refund_date?: string | null
          locker_refund_method?: string
          locker_refund_transaction_id?: string
          locker_refunded?: boolean
          payment_method?: string
          payment_status?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          seat_id?: string | null
          seat_number?: number | null
          serial_number?: string | null
          start_date?: string | null
          total_price?: number | null
          transaction_id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_duration?: string | null
          cabin_id?: string | null
          collected_by?: string | null
          collected_by_name?: string
          created_at?: string | null
          discount_amount?: number
          discount_reason?: string
          duration_count?: string | null
          end_date?: string | null
          id?: string
          locker_included?: boolean
          locker_price?: number
          locker_refund_amount?: number
          locker_refund_date?: string | null
          locker_refund_method?: string
          locker_refund_transaction_id?: string
          locker_refunded?: boolean
          payment_method?: string
          payment_status?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          seat_id?: string | null
          seat_number?: number | null
          serial_number?: string | null
          start_date?: string | null
          total_price?: number | null
          transaction_id?: string
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
          {
            foreignKeyName: "bookings_seat_id_fkey"
            columns: ["seat_id"]
            isOneToOne: false
            referencedRelation: "seats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cabins: {
        Row: {
          advance_auto_cancel: boolean
          advance_booking_enabled: boolean
          advance_flat_amount: number | null
          advance_percentage: number
          advance_use_flat: boolean
          advance_validity_days: number
          amenities: string[] | null
          area: string | null
          capacity: number | null
          category: string | null
          city: string | null
          closing_time: string
          created_at: string | null
          created_by: string | null
          description: string | null
          floors: Json | null
          full_address: string | null
          grid_size: number
          id: string
          image_url: string | null
          images: string[] | null
          is_active: boolean | null
          is_booking_active: boolean
          layout_image: string | null
          locker_available: boolean
          locker_mandatory: boolean
          locker_price: number
          name: string
          opening_time: string
          price: number | null
          room_elements: Json | null
          room_height: number
          room_width: number
          sections: Json
          serial_number: string | null
          state: string | null
          working_days: Json
        }
        Insert: {
          advance_auto_cancel?: boolean
          advance_booking_enabled?: boolean
          advance_flat_amount?: number | null
          advance_percentage?: number
          advance_use_flat?: boolean
          advance_validity_days?: number
          amenities?: string[] | null
          area?: string | null
          capacity?: number | null
          category?: string | null
          city?: string | null
          closing_time?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          floors?: Json | null
          full_address?: string | null
          grid_size?: number
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean | null
          is_booking_active?: boolean
          layout_image?: string | null
          locker_available?: boolean
          locker_mandatory?: boolean
          locker_price?: number
          name: string
          opening_time?: string
          price?: number | null
          room_elements?: Json | null
          room_height?: number
          room_width?: number
          sections?: Json
          serial_number?: string | null
          state?: string | null
          working_days?: Json
        }
        Update: {
          advance_auto_cancel?: boolean
          advance_booking_enabled?: boolean
          advance_flat_amount?: number | null
          advance_percentage?: number
          advance_use_flat?: boolean
          advance_validity_days?: number
          amenities?: string[] | null
          area?: string | null
          capacity?: number | null
          category?: string | null
          city?: string | null
          closing_time?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          floors?: Json | null
          full_address?: string | null
          grid_size?: number
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean | null
          is_booking_active?: boolean
          layout_image?: string | null
          locker_available?: boolean
          locker_mandatory?: boolean
          locker_price?: number
          name?: string
          opening_time?: string
          price?: number | null
          room_elements?: Json | null
          room_height?: number
          room_width?: number
          sections?: Json
          serial_number?: string | null
          state?: string | null
          working_days?: Json
        }
        Relationships: []
      }
      complaints: {
        Row: {
          booking_id: string | null
          cabin_id: string | null
          category: string
          created_at: string
          description: string
          id: string
          priority: string
          responded_at: string | null
          responded_by: string | null
          response: string | null
          serial_number: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          cabin_id?: string | null
          category?: string
          created_at?: string
          description: string
          id?: string
          priority?: string
          responded_at?: string | null
          responded_by?: string | null
          response?: string | null
          serial_number?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          cabin_id?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          priority?: string
          responded_at?: string | null
          responded_by?: string | null
          response?: string | null
          serial_number?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          },
        ]
      }
      due_payments: {
        Row: {
          amount: number
          collected_by: string | null
          collected_by_name: string
          created_at: string
          due_id: string
          id: string
          notes: string
          payment_method: string
          transaction_id: string
        }
        Insert: {
          amount?: number
          collected_by?: string | null
          collected_by_name?: string
          created_at?: string
          due_id: string
          id?: string
          notes?: string
          payment_method?: string
          transaction_id?: string
        }
        Update: {
          amount?: number
          collected_by?: string | null
          collected_by_name?: string
          created_at?: string
          due_id?: string
          id?: string
          notes?: string
          payment_method?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "due_payments_due_id_fkey"
            columns: ["due_id"]
            isOneToOne: false
            referencedRelation: "dues"
            referencedColumns: ["id"]
          },
        ]
      }
      dues: {
        Row: {
          advance_paid: number
          booking_id: string | null
          cabin_id: string | null
          created_at: string
          due_amount: number
          due_date: string
          id: string
          paid_amount: number
          proportional_end_date: string | null
          seat_id: string | null
          serial_number: string | null
          status: string
          total_fee: number
          updated_at: string
          user_id: string
        }
        Insert: {
          advance_paid?: number
          booking_id?: string | null
          cabin_id?: string | null
          created_at?: string
          due_amount?: number
          due_date: string
          id?: string
          paid_amount?: number
          proportional_end_date?: string | null
          seat_id?: string | null
          serial_number?: string | null
          status?: string
          total_fee?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          advance_paid?: number
          booking_id?: string | null
          cabin_id?: string | null
          created_at?: string
          due_amount?: number
          due_date?: string
          id?: string
          paid_amount?: number
          proportional_end_date?: string | null
          seat_id?: string | null
          serial_number?: string | null
          status?: string
          total_fee?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dues_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dues_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dues_seat_id_fkey"
            columns: ["seat_id"]
            isOneToOne: false
            referencedRelation: "seats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          serial_number: string | null
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
          serial_number?: string | null
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
          serial_number?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      receipts: {
        Row: {
          amount: number
          booking_id: string | null
          cabin_id: string | null
          collected_by: string | null
          collected_by_name: string
          created_at: string
          due_id: string | null
          id: string
          notes: string
          payment_method: string
          receipt_type: string
          seat_id: string | null
          serial_number: string | null
          transaction_id: string
          user_id: string
        }
        Insert: {
          amount?: number
          booking_id?: string | null
          cabin_id?: string | null
          collected_by?: string | null
          collected_by_name?: string
          created_at?: string
          due_id?: string | null
          id?: string
          notes?: string
          payment_method?: string
          receipt_type?: string
          seat_id?: string | null
          serial_number?: string | null
          transaction_id?: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          cabin_id?: string | null
          collected_by?: string | null
          collected_by_name?: string
          created_at?: string
          due_id?: string | null
          id?: string
          notes?: string
          payment_method?: string
          receipt_type?: string
          seat_id?: string | null
          serial_number?: string | null
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_due_id_fkey"
            columns: ["due_id"]
            isOneToOne: false
            referencedRelation: "dues"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          cabin_id: string
          comment: string
          created_at: string
          id: string
          rating: number
          status: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id: string
          cabin_id: string
          comment: string
          created_at?: string
          id?: string
          rating: number
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string
          cabin_id?: string
          comment?: string
          created_at?: string
          id?: string
          rating?: number
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_reviews_booking"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_reviews_cabin"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          },
        ]
      }
      seat_block_history: {
        Row: {
          action: string
          block_from: string | null
          block_to: string | null
          created_at: string
          id: string
          performed_by: string | null
          reason: string
          seat_id: string
        }
        Insert: {
          action: string
          block_from?: string | null
          block_to?: string | null
          created_at?: string
          id?: string
          performed_by?: string | null
          reason?: string
          seat_id: string
        }
        Update: {
          action?: string
          block_from?: string | null
          block_to?: string | null
          created_at?: string
          id?: string
          performed_by?: string | null
          reason?: string
          seat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seat_block_history_seat_id_fkey"
            columns: ["seat_id"]
            isOneToOne: false
            referencedRelation: "seats"
            referencedColumns: ["id"]
          },
        ]
      }
      seat_categories: {
        Row: {
          cabin_id: string | null
          created_at: string
          id: string
          name: string
          price: number
        }
        Insert: {
          cabin_id?: string | null
          created_at?: string
          id?: string
          name: string
          price?: number
        }
        Update: {
          cabin_id?: string | null
          created_at?: string
          id?: string
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "seat_categories_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          },
        ]
      }
      seats: {
        Row: {
          cabin_id: string
          category: string
          col_index: number
          created_at: string
          floor: number
          id: string
          is_available: boolean
          is_hot_selling: boolean
          number: number
          position_x: number
          position_y: number
          price: number
          row_index: number
          sharing_capacity: number
          sharing_type: string
          unavailable_until: string | null
        }
        Insert: {
          cabin_id: string
          category?: string
          col_index?: number
          created_at?: string
          floor?: number
          id?: string
          is_available?: boolean
          is_hot_selling?: boolean
          number: number
          position_x?: number
          position_y?: number
          price?: number
          row_index?: number
          sharing_capacity?: number
          sharing_type?: string
          unavailable_until?: string | null
        }
        Update: {
          cabin_id?: string
          category?: string
          col_index?: number
          created_at?: string
          floor?: number
          id?: string
          is_available?: boolean
          is_hot_selling?: boolean
          number?: number
          position_x?: number
          position_y?: number
          price?: number
          row_index?: number
          sharing_capacity?: number
          sharing_type?: string
          unavailable_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seats_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          },
        ]
      }
      serial_counters: {
        Row: {
          current_seq: number
          entity_type: string
          year: number
        }
        Insert: {
          current_seq?: number
          entity_type: string
          year: number
        }
        Update: {
          current_seq?: number
          entity_type?: string
          year?: number
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_response: string | null
          category: string
          created_at: string
          description: string
          id: string
          responded_at: string | null
          responded_by: string | null
          serial_number: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          category?: string
          created_at?: string
          description: string
          id?: string
          responded_at?: string | null
          responded_by?: string | null
          serial_number?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          responded_at?: string | null
          responded_by?: string | null
          serial_number?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
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
      generate_serial_number: {
        Args: { p_entity_type: string }
        Returns: string
      }
      get_cabin_rating_stats: {
        Args: { p_cabin_id: string }
        Returns: {
          average_rating: number
          review_count: number
        }[]
      }
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
