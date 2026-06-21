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
      pages: {
        Row: {
          created_at: string
          id: string
          slug: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          slug: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          slug?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sections: {
        Row: {
          content: Json
          created_at: string
          id: string
          in_navigation: boolean
          nav_label: string | null
          nav_order: number | null
          order: number
          page_id: string | null
          site_id: string | null
          style_variant: Database["public"]["Enums"]["style_variant"]
          tenant_id: string | null
          type: Database["public"]["Enums"]["module_type"]
          updated_at: string
          width: number
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          in_navigation?: boolean
          nav_label?: string | null
          nav_order?: number | null
          order?: number
          page_id?: string | null
          site_id?: string | null
          style_variant?: Database["public"]["Enums"]["style_variant"]
          tenant_id?: string | null
          type: Database["public"]["Enums"]["module_type"]
          updated_at?: string
          width?: number
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          in_navigation?: boolean
          nav_label?: string | null
          nav_order?: number | null
          order?: number
          page_id?: string | null
          site_id?: string | null
          style_variant?: Database["public"]["Enums"]["style_variant"]
          tenant_id?: string | null
          type?: Database["public"]["Enums"]["module_type"]
          updated_at?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "sections_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      site_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          label: string
          sections: Json
          site_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string
          sections: Json
          site_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string
          sections?: Json
          site_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_versions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_versions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          created_at: string
          id: string
          is_published: boolean
          slug: string
          tenant_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_published?: boolean
          slug: string
          tenant_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_published?: boolean
          slug?: string
          tenant_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          created_at: string
          role: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          custom_domain: string | null
          id: string
          kind: Database["public"]["Enums"]["tenant_kind"]
          name: string
          plan: string
          schema_variant: string
          slug: string
          theme: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_domain?: string | null
          id?: string
          kind: Database["public"]["Enums"]["tenant_kind"]
          name: string
          plan?: string
          schema_variant?: string
          slug: string
          theme?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_domain?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["tenant_kind"]
          name?: string
          plan?: string
          schema_variant?: string
          slug?: string
          theme?: Json
          updated_at?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean
          is_disabled: boolean
          is_locked: boolean
          llm_model: string
          module_overrides: Json | null
          tier: Database["public"]["Enums"]["user_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin?: boolean
          is_disabled?: boolean
          is_locked?: boolean
          llm_model?: string
          module_overrides?: Json | null
          tier?: Database["public"]["Enums"]["user_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean
          is_disabled?: boolean
          is_locked?: boolean
          llm_model?: string
          module_overrides?: Json | null
          tier?: Database["public"]["Enums"]["user_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allowed_module_types: { Args: never; Returns: string[] }
      create_studio_client: {
        Args: {
          p_name: string
          p_schema_variant?: string
          p_slug: string
          p_theme?: Json
        }
        Returns: string
      }
      get_all_user_settings_for_admin: {
        Args: never
        Returns: {
          created_at: string
          id: string
          is_admin: boolean
          is_disabled: boolean
          is_locked: boolean
          llm_model: string
          module_overrides: Json | null
          tier: Database["public"]["Enums"]["user_tier"]
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "user_settings"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_auth_users_for_admin: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
        }[]
      }
      get_public_site: { Args: { p_slug: string }; Returns: Json }
      get_public_site_by_domain: { Args: { p_host: string }; Returns: Json }
      is_active_user: { Args: never; Returns: boolean }
      is_current_user_admin: { Args: never; Returns: boolean }
      is_tenant_member: { Args: { p_tenant_id: string }; Returns: boolean }
      reorder_sections: {
        Args: { p_page_id: string; p_updates: Json }
        Returns: undefined
      }
      restore_site_version: {
        Args: { p_version_id: string }
        Returns: undefined
      }
      snapshot_site: {
        Args: { p_label?: string; p_site_id: string }
        Returns: string
      }
    }
    Enums: {
      module_type:
        | "hero"
        | "bio"
        | "services"
        | "calendar"
        | "links"
        | "contact"
        | "gallery"
        | "testimonial"
        | "custom"
      style_variant: "minimal" | "bold" | "outlined" | "filled"
      tenant_kind: "self_serve" | "studio_client"
      user_tier: "free" | "paid"
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
      module_type: [
        "hero",
        "bio",
        "services",
        "calendar",
        "links",
        "contact",
        "gallery",
        "testimonial",
        "custom",
      ],
      style_variant: ["minimal", "bold", "outlined", "filled"],
      tenant_kind: ["self_serve", "studio_client"],
      user_tier: ["free", "paid"],
    },
  },
} as const
