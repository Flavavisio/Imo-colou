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
      activity_log: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          detail: string
          entity_id: string | null
          entity_type: string
          id: number
          reseller_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          detail?: string
          entity_id?: string | null
          entity_type: string
          id?: never
          reseller_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          detail?: string
          entity_id?: string | null
          entity_type?: string
          id?: never
          reseller_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      camera_plans: {
        Row: {
          created_at: string
          id: string
          max_clip_seconds: number
          max_resolution: string
          monthly_gb: number
          name: string
          original: boolean
          price: number
          retention: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_clip_seconds: number
          max_resolution: string
          monthly_gb: number
          name: string
          original?: boolean
          price?: number
          retention: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_clip_seconds?: number
          max_resolution?: string
          monthly_gb?: number
          name?: string
          original?: boolean
          price?: number
          retention?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      cameras: {
        Row: {
          active: boolean
          camera_plan_id: string | null
          client_id: string
          codec: string
          connection_mode: string
          created_at: string
          event_type: string
          external_channel_id: string | null
          external_device_id: string | null
          id: string
          installation_id: string
          local_host: string
          local_test: Json | null
          manufacturer: string
          model: string | null
          name: string
          notes: string
          provider: string
          reseller_id: string
          rtsp_path: string
          rtsp_port: number
          sale_price: number | null
          serial_number: string | null
          status: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          camera_plan_id?: string | null
          client_id: string
          codec?: string
          connection_mode?: string
          created_at?: string
          event_type?: string
          external_channel_id?: string | null
          external_device_id?: string | null
          id?: string
          installation_id: string
          local_host?: string
          local_test?: Json | null
          manufacturer?: string
          model?: string | null
          name: string
          notes?: string
          provider?: string
          reseller_id: string
          rtsp_path?: string
          rtsp_port?: number
          sale_price?: number | null
          serial_number?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          camera_plan_id?: string | null
          client_id?: string
          codec?: string
          connection_mode?: string
          created_at?: string
          event_type?: string
          external_channel_id?: string | null
          external_device_id?: string | null
          id?: string
          installation_id?: string
          local_host?: string
          local_test?: Json | null
          manufacturer?: string
          model?: string | null
          name?: string
          notes?: string
          provider?: string
          reseller_id?: string
          rtsp_path?: string
          rtsp_port?: number
          sale_price?: number | null
          serial_number?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cameras_camera_plan_id_fkey"
            columns: ["camera_plan_id"]
            isOneToOne: false
            referencedRelation: "camera_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cameras_installation_id_reseller_id_client_id_fkey"
            columns: ["installation_id", "reseller_id", "client_id"]
            isOneToOne: false
            referencedRelation: "installations"
            referencedColumns: ["id", "reseller_id", "client_id"]
          },
        ]
      }
      client_members: {
        Row: {
          client_id: string
          created_at: string
          reseller_id: string
          role: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          reseller_id: string
          role?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          reseller_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_members_client_id_reseller_id_fkey"
            columns: ["client_id", "reseller_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id", "reseller_id"]
          },
          {
            foreignKeyName: "client_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          active: boolean
          code: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string
          reseller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string
          reseller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string
          reseller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          camera_id: string
          client_id: string
          clip_path: string | null
          clip_seconds: number | null
          event_type: string
          id: string
          installation_id: string
          metadata: Json
          occurred_at: string
          provider: string
          provider_event_id: string | null
          received_at: string
          reseller_id: string
          status: string
          thumbnail_path: string | null
        }
        Insert: {
          camera_id: string
          client_id: string
          clip_path?: string | null
          clip_seconds?: number | null
          event_type: string
          id?: string
          installation_id: string
          metadata?: Json
          occurred_at: string
          provider: string
          provider_event_id?: string | null
          received_at?: string
          reseller_id: string
          status?: string
          thumbnail_path?: string | null
        }
        Update: {
          camera_id?: string
          client_id?: string
          clip_path?: string | null
          clip_seconds?: number | null
          event_type?: string
          id?: string
          installation_id?: string
          metadata?: Json
          occurred_at?: string
          provider?: string
          provider_event_id?: string | null
          received_at?: string
          reseller_id?: string
          status?: string
          thumbnail_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: false
            referencedRelation: "cameras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_installation_id_reseller_id_client_id_fkey"
            columns: ["installation_id", "reseller_id", "client_id"]
            isOneToOne: false
            referencedRelation: "installations"
            referencedColumns: ["id", "reseller_id", "client_id"]
          },
        ]
      }
      installations: {
        Row: {
          active: boolean
          address: string | null
          city: string | null
          client_id: string
          country: string
          created_at: string
          id: string
          name: string
          postal_code: string | null
          reseller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          city?: string | null
          client_id: string
          country?: string
          created_at?: string
          id?: string
          name: string
          postal_code?: string | null
          reseller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          city?: string | null
          client_id?: string
          country?: string
          created_at?: string
          id?: string
          name?: string
          postal_code?: string | null
          reseller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "installations_client_id_reseller_id_fkey"
            columns: ["client_id", "reseller_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id", "reseller_id"]
          },
        ]
      }
      plans: {
        Row: {
          camera_limit: number
          created_at: string
          id: string
          name: string
          original: boolean
          price: number
          retention: number
          status: string
          updated_at: string
        }
        Insert: {
          camera_limit: number
          created_at?: string
          id?: string
          name: string
          original?: boolean
          price?: number
          retention: number
          status?: string
          updated_at?: string
        }
        Update: {
          camera_limit?: number
          created_at?: string
          id?: string
          name?: string
          original?: boolean
          price?: number
          retention?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reseller_members: {
        Row: {
          created_at: string
          reseller_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          reseller_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          reseller_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reseller_members_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reseller_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reseller_sale_prices: {
        Row: {
          camera_plan_id: string
          created_at: string
          price: number
          reseller_id: string
          updated_at: string
        }
        Insert: {
          camera_plan_id: string
          created_at?: string
          price: number
          reseller_id: string
          updated_at?: string
        }
        Update: {
          camera_plan_id?: string
          created_at?: string
          price?: number
          reseller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reseller_sale_prices_camera_plan_id_fkey"
            columns: ["camera_plan_id"]
            isOneToOne: false
            referencedRelation: "camera_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reseller_sale_prices_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      resellers: {
        Row: {
          active: boolean
          brand: string
          color: string
          created_at: string
          currency: string
          email: string | null
          id: string
          license_mode: string
          logo_id: string | null
          logo_url: string | null
          name: string
          phone: string
          plan_id: string | null
          primary_color: string | null
          secondary_color: string | null
          slug: string
          status: string
          support: string
          trial_camera_limit: number
          updated_at: string
          valid_until: string | null
          wallet_limit: number | null
        }
        Insert: {
          active?: boolean
          brand: string
          color?: string
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          license_mode?: string
          logo_id?: string | null
          logo_url?: string | null
          name: string
          phone?: string
          plan_id?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug: string
          status?: string
          support?: string
          trial_camera_limit?: number
          updated_at?: string
          valid_until?: string | null
          wallet_limit?: number | null
        }
        Update: {
          active?: boolean
          brand?: string
          color?: string
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          license_mode?: string
          logo_id?: string | null
          logo_url?: string | null
          name?: string
          phone?: string
          plan_id?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string
          status?: string
          support?: string
          trial_camera_limit?: number
          updated_at?: string
          valid_until?: string | null
          wallet_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "resellers_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_snapshots: {
        Row: {
          activity: Json
          records: Json
          revision: number
          updated_at: string
          user_id: string
        }
        Insert: {
          activity?: Json
          records?: Json
          revision?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          activity?: Json
          records?: Json
          revision?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
