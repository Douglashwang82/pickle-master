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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          club_id: string | null
          event_name: string
          id: string
          occurred_at: string
          properties_json: Json
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          club_id?: string | null
          event_name: string
          id?: string
          occurred_at?: string
          properties_json?: Json
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          club_id?: string | null
          event_name?: string
          id?: string
          occurred_at?: string
          properties_json?: Json
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      club_memberships: {
        Row: {
          club_id: string
          id: string
          joined_at: string
          removed_at: string | null
          role: string
          status: string
          user_id: string
        }
        Insert: {
          club_id: string
          id?: string
          joined_at?: string
          removed_at?: string | null
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          club_id?: string
          id?: string
          joined_at?: string
          removed_at?: string | null
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_memberships_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          dissolved_at: string | null
          id: string
          name: string
          owner_user_id: string
          public_status: string
          rules: string | null
          slug: string
          sport_type: string
          status: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          dissolved_at?: string | null
          id?: string
          name: string
          owner_user_id: string
          public_status?: string
          rules?: string | null
          slug: string
          sport_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          dissolved_at?: string | null
          id?: string
          name?: string
          owner_user_id?: string
          public_status?: string
          rules?: string | null
          slug?: string
          sport_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clubs_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_applications: {
        Row: {
          club_id: string
          created_at: string
          id: string
          intro_message: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          intro_message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          intro_message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_applications_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          channel: string
          created_at: string
          id: string
          payload_json: Json
          send_at: string
          status: string
          type: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          id?: string
          payload_json?: Json
          send_at?: string
          status?: string
          type: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          payload_json?: Json
          send_at?: string
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount_twd: number
          club_id: string
          created_at: string
          failure_code: string | null
          failure_message: string | null
          gateway: string
          gateway_payment_id: string | null
          id: string
          net_amount_twd: number
          payer_user_id: string
          platform_fee_twd: number
          registration_id: string
          session_id: string
          settled_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_twd: number
          club_id: string
          created_at?: string
          failure_code?: string | null
          failure_message?: string | null
          gateway?: string
          gateway_payment_id?: string | null
          id?: string
          net_amount_twd?: number
          payer_user_id: string
          platform_fee_twd?: number
          registration_id: string
          session_id: string
          settled_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_twd?: number
          club_id?: string
          created_at?: string
          failure_code?: string | null
          failure_message?: string | null
          gateway?: string
          gateway_payment_id?: string | null
          id?: string
          net_amount_twd?: number
          payer_user_id?: string
          platform_fee_twd?: number
          registration_id?: string
          session_id?: string
          settled_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_payer_user_id_fkey"
            columns: ["payer_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "session_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          contact_preference: string | null
          created_at: string
          display_name: string
          locale: string
          photo_url: string | null
          skill_level: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          contact_preference?: string | null
          created_at?: string
          display_name: string
          locale?: string
          photo_url?: string | null
          skill_level?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          contact_preference?: string | null
          created_at?: string
          display_name?: string
          locale?: string
          photo_url?: string | null
          skill_level?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      refund_transactions: {
        Row: {
          amount_twd: number
          created_at: string
          gateway_refund_id: string | null
          id: string
          payment_transaction_id: string
          reason: string | null
          retry_count: number
          status: string
          updated_at: string
        }
        Insert: {
          amount_twd: number
          created_at?: string
          gateway_refund_id?: string | null
          id?: string
          payment_transaction_id: string
          reason?: string | null
          retry_count?: number
          status?: string
          updated_at?: string
        }
        Update: {
          amount_twd?: number
          created_at?: string
          gateway_refund_id?: string | null
          id?: string
          payment_transaction_id?: string
          reason?: string | null
          retry_count?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_transactions_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_registrations: {
        Row: {
          booking_hold_expires_at: string | null
          cancelled_at: string | null
          id: string
          joined_at: string
          payment_transaction_id: string | null
          session_id: string
          status: string
          user_id: string
        }
        Insert: {
          booking_hold_expires_at?: string | null
          cancelled_at?: string | null
          id?: string
          joined_at?: string
          payment_transaction_id?: string | null
          session_id: string
          status?: string
          user_id: string
        }
        Update: {
          booking_hold_expires_at?: string | null
          cancelled_at?: string | null
          id?: string
          joined_at?: string
          payment_transaction_id?: string | null
          session_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_registrations_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_registrations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          cancelled_at: string | null
          capacity: number
          club_id: string
          created_at: string
          created_by: string
          currency: string
          duration_minutes: number
          fee_twd: number
          id: string
          location_name: string
          notes: string | null
          scheduled_end_at: string
          scheduled_start_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          capacity: number
          club_id: string
          created_at?: string
          created_by: string
          currency?: string
          duration_minutes: number
          fee_twd?: number
          id?: string
          location_name: string
          notes?: string | null
          scheduled_end_at: string
          scheduled_start_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          capacity?: number
          club_id?: string
          created_at?: string
          created_by?: string
          currency?: string
          duration_minutes?: number
          fee_twd?: number
          id?: string
          location_name?: string
          notes?: string | null
          scheduled_end_at?: string
          scheduled_start_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_provider_user_id: string
          created_at: string
          email: string
          id: string
          last_active_at: string
          status: string
        }
        Insert: {
          auth_provider_user_id: string
          created_at?: string
          email: string
          id?: string
          last_active_at?: string
          status?: string
        }
        Update: {
          auth_provider_user_id?: string
          created_at?: string
          email?: string
          id?: string
          last_active_at?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_app_user_id: { Args: never; Returns: string }
      is_club_leader: { Args: { p_club_id: string }; Returns: boolean }
      is_club_member: { Args: { p_club_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
