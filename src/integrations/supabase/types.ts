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
      donations: {
        Row: {
          created_at: string
          dosage: string | null
          expiry_date: string
          health_post_id: string
          id: string
          medicine_name: string
          notes: string | null
          photo_urls: string[]
          points_awarded: number
          quantity: number
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sealed: boolean
          status: Database["public"]["Enums"]["donation_status"]
          unit: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dosage?: string | null
          expiry_date: string
          health_post_id: string
          id?: string
          medicine_name: string
          notes?: string | null
          photo_urls?: string[]
          points_awarded?: number
          quantity: number
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sealed?: boolean
          status?: Database["public"]["Enums"]["donation_status"]
          unit?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dosage?: string | null
          expiry_date?: string
          health_post_id?: string
          id?: string
          medicine_name?: string
          notes?: string | null
          photo_urls?: string[]
          points_awarded?: number
          quantity?: number
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sealed?: boolean
          status?: Database["public"]["Enums"]["donation_status"]
          unit?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "donations_health_post_id_fkey"
            columns: ["health_post_id"]
            isOneToOne: false
            referencedRelation: "health_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      health_posts: {
        Row: {
          accepts_donations: boolean
          address: string
          cep: string
          city: string
          cnes_code: string | null
          created_at: string
          id: string
          lat: number
          lng: number
          name: string
          neighborhood: string | null
          phone: string | null
          state: string
        }
        Insert: {
          accepts_donations?: boolean
          address: string
          cep: string
          city: string
          cnes_code?: string | null
          created_at?: string
          id?: string
          lat: number
          lng: number
          name: string
          neighborhood?: string | null
          phone?: string | null
          state: string
        }
        Update: {
          accepts_donations?: boolean
          address?: string
          cep?: string
          city?: string
          cnes_code?: string | null
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          neighborhood?: string | null
          phone?: string | null
          state?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          created_at: string
          donation_id: string | null
          dosage: string | null
          expiry_date: string
          health_post_id: string
          id: string
          medicine_name: string
          points_cost: number
          quantity: number
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          donation_id?: string | null
          dosage?: string | null
          expiry_date: string
          health_post_id: string
          id?: string
          medicine_name: string
          points_cost?: number
          quantity: number
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          donation_id?: string | null
          dosage?: string | null
          expiry_date?: string
          health_post_id?: string
          id?: string
          medicine_name?: string
          points_cost?: number
          quantity?: number
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_health_post_id_fkey"
            columns: ["health_post_id"]
            isOneToOne: false
            referencedRelation: "health_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_alerts: {
        Row: {
          created_at: string
          id: string
          medicine_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          medicine_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          medicine_name?: string
          user_id?: string
        }
        Relationships: []
      }
      medicine_requests: {
        Row: {
          created_at: string
          health_post_id: string
          id: string
          inventory_id: string
          medicine_name: string
          points_spent: number
          quantity: number
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
          used_cadunico: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          health_post_id: string
          id?: string
          inventory_id: string
          medicine_name: string
          points_spent?: number
          quantity?: number
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          used_cadunico?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          health_post_id?: string
          id?: string
          inventory_id?: string
          medicine_name?: string
          points_spent?: number
          quantity?: number
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          used_cadunico?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicine_requests_health_post_id_fkey"
            columns: ["health_post_id"]
            isOneToOne: false
            referencedRelation: "health_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_requests_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          email_sent: boolean
          id: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          email_sent?: boolean
          id?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          email_sent?: boolean
          id?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      points_ledger: {
        Row: {
          created_at: string
          delta: number
          donation_id: string | null
          id: string
          reason: string
          request_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          donation_id?: string | null
          id?: string
          reason: string
          request_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          donation_id?: string | null
          id?: string
          reason?: string
          request_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_ledger_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_ledger_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "medicine_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cadunico_declared: boolean
          cadunico_verified: boolean
          cep: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          points: number
          updated_at: string
        }
        Insert: {
          cadunico_declared?: boolean
          cadunico_verified?: boolean
          cep?: string | null
          created_at?: string
          full_name?: string
          id: string
          phone?: string | null
          points?: number
          updated_at?: string
        }
        Update: {
          cadunico_declared?: boolean
          cadunico_verified?: boolean
          cep?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          points?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      nearby_health_posts: {
        Args: {
          _donations_only?: boolean
          _lat: number
          _limit?: number
          _lng: number
        }
        Returns: {
          accepts_donations: boolean
          address: string
          cep: string
          city: string
          distance_km: number
          id: string
          lat: number
          lng: number
          name: string
          phone: string
          state: string
        }[]
      }
    }
    Enums: {
      app_role: "citizen" | "professional" | "admin"
      donation_status: "pending" | "approved" | "rejected"
      request_status: "pending" | "ready" | "completed" | "cancelled"
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
    Enums: {
      app_role: ["citizen", "professional", "admin"],
      donation_status: ["pending", "approved", "rejected"],
      request_status: ["pending", "ready", "completed", "cancelled"],
    },
  },
} as const
