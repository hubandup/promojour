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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      api_connections: {
        Row: {
          api_key: string | null
          api_secret: string | null
          created_at: string
          credentials: Json | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          type: string
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          api_secret?: string | null
          created_at?: string
          credentials?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          type: string
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          api_secret?: string | null
          created_at?: string
          credentials?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          canva_template_url: string | null
          created_at: string
          created_by: string | null
          daily_promotion_count: number | null
          description: string | null
          end_date: string
          id: string
          name: string
          organization_id: string
          random_order: boolean | null
          start_date: string
          status: Database["public"]["Enums"]["campaign_status"]
          store_id: string | null
          updated_at: string
        }
        Insert: {
          canva_template_url?: string | null
          created_at?: string
          created_by?: string | null
          daily_promotion_count?: number | null
          description?: string | null
          end_date: string
          id?: string
          name: string
          organization_id: string
          random_order?: boolean | null
          start_date: string
          status?: Database["public"]["Enums"]["campaign_status"]
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          canva_template_url?: string | null
          created_at?: string
          created_by?: string | null
          daily_promotion_count?: number | null
          description?: string | null
          end_date?: string
          id?: string
          name?: string
          organization_id?: string
          random_order?: boolean | null
          start_date?: string
          status?: Database["public"]["Enums"]["campaign_status"]
          store_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          max_promotions: number | null
          max_stores: number | null
          max_users: number | null
          name: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"]
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          max_promotions?: number | null
          max_stores?: number | null
          max_users?: number | null
          name: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          max_promotions?: number | null
          max_stores?: number | null
          max_users?: number | null
          name?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          organization_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_stats: {
        Row: {
          clicks: number | null
          created_at: string
          date: string
          id: string
          platform: Database["public"]["Enums"]["social_platform"] | null
          promotion_id: string
          store_id: string | null
          unique_visitors: number | null
          views: number | null
        }
        Insert: {
          clicks?: number | null
          created_at?: string
          date: string
          id?: string
          platform?: Database["public"]["Enums"]["social_platform"] | null
          promotion_id: string
          store_id?: string | null
          unique_visitors?: number | null
          views?: number | null
        }
        Update: {
          clicks?: number | null
          created_at?: string
          date?: string
          id?: string
          platform?: Database["public"]["Enums"]["social_platform"] | null
          promotion_id?: string
          store_id?: string | null
          unique_visitors?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "promotion_stats_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_stats_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_stats_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      promotional_mechanics: {
        Row: {
          code: string
          created_at: string | null
          fields: Json
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          fields?: Json
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          fields?: Json
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotional_mechanics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          attributes: Json | null
          campaign_id: string | null
          can_be_modified_by_stores: boolean | null
          category: string | null
          clicks_count: number | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          image_url: string | null
          is_mandatory: boolean | null
          organization_id: string
          start_date: string
          status: Database["public"]["Enums"]["promotion_status"]
          store_id: string | null
          title: string
          updated_at: string
          video_url: string | null
          views_count: number | null
        }
        Insert: {
          attributes?: Json | null
          campaign_id?: string | null
          can_be_modified_by_stores?: boolean | null
          category?: string | null
          clicks_count?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          image_url?: string | null
          is_mandatory?: boolean | null
          organization_id: string
          start_date: string
          status?: Database["public"]["Enums"]["promotion_status"]
          store_id?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
          views_count?: number | null
        }
        Update: {
          attributes?: Json | null
          campaign_id?: string | null
          can_be_modified_by_stores?: boolean | null
          category?: string | null
          clicks_count?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          image_url?: string | null
          is_mandatory?: boolean | null
          organization_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["promotion_status"]
          store_id?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "promotions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      social_connections: {
        Row: {
          access_token: string | null
          account_id: string | null
          account_name: string | null
          created_at: string
          followers_count: number | null
          id: string
          is_connected: boolean | null
          last_synced_at: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          refresh_token: string | null
          store_id: string
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          account_id?: string | null
          account_name?: string | null
          created_at?: string
          followers_count?: number | null
          id?: string
          is_connected?: boolean | null
          last_synced_at?: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          refresh_token?: string | null
          store_id: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          account_id?: string | null
          account_name?: string | null
          created_at?: string
          followers_count?: number | null
          id?: string
          is_connected?: boolean | null
          last_synced_at?: string | null
          platform?: Database["public"]["Enums"]["social_platform"]
          refresh_token?: string | null
          store_id?: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_connections_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_connections_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          alert_email_enabled: boolean | null
          created_at: string
          custom_attributes: Json | null
          id: string
          min_active_promotions: number | null
          min_upcoming_promotions: number | null
          seo_tags: Json | null
          store_id: string
          updated_at: string
        }
        Insert: {
          alert_email_enabled?: boolean | null
          created_at?: string
          custom_attributes?: Json | null
          id?: string
          min_active_promotions?: number | null
          min_upcoming_promotions?: number | null
          seo_tags?: Json | null
          store_id: string
          updated_at?: string
        }
        Update: {
          alert_email_enabled?: boolean | null
          created_at?: string
          custom_attributes?: Json | null
          id?: string
          min_active_promotions?: number | null
          min_upcoming_promotions?: number | null
          seo_tags?: Json | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          email: string | null
          google_maps_url: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          opening_hours: Json | null
          organization_id: string
          phone: string | null
          postal_code: string | null
          qr_code_url: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          google_maps_url?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          opening_hours?: Json | null
          organization_id: string
          phone?: string | null
          postal_code?: string | null
          qr_code_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          google_maps_url?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          opening_hours?: Json | null
          organization_id?: string
          phone?: string | null
          postal_code?: string | null
          qr_code_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          is_automatic: boolean | null
          name: string
          organization_id: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_automatic?: boolean | null
          name: string
          organization_id: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_automatic?: boolean | null
          name?: string
          organization_id?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      stores_public: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          google_maps_url: string | null
          id: string | null
          is_active: boolean | null
          logo_url: string | null
          name: string | null
          opening_hours: Json | null
          organization_id: string | null
          postal_code: string | null
          qr_code_url: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          google_maps_url?: string | null
          id?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string | null
          opening_hours?: Json | null
          organization_id?: string | null
          postal_code?: string | null
          qr_code_url?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          google_maps_url?: string | null
          id?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string | null
          opening_hours?: Json | null
          organization_id?: string | null
          postal_code?: string | null
          qr_code_url?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_user_organization: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      account_type: "free" | "store" | "central"
      app_role: "admin" | "editor" | "viewer" | "super_admin"
      campaign_status:
        | "draft"
        | "scheduled"
        | "active"
        | "completed"
        | "archived"
      promotion_status:
        | "draft"
        | "scheduled"
        | "active"
        | "expired"
        | "archived"
      social_platform: "facebook" | "instagram" | "google_business"
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
      account_type: ["free", "store", "central"],
      app_role: ["admin", "editor", "viewer", "super_admin"],
      campaign_status: [
        "draft",
        "scheduled",
        "active",
        "completed",
        "archived",
      ],
      promotion_status: ["draft", "scheduled", "active", "expired", "archived"],
      social_platform: ["facebook", "instagram", "google_business"],
    },
  },
} as const
