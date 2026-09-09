export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          auth_user_id: string | null
          created_at: string
          email: string
          id: string
          last_login_at: string | null
          name: string
          role: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          email: string
          id?: string
          last_login_at?: string | null
          name: string
          role?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          email?: string
          id?: string
          last_login_at?: string | null
          name?: string
          role?: string
        }
        Relationships: []
      }
      captain_clicks: {
        Row: {
          captain_code: string
          captain_id: string | null
          created_at: string
          id: string
          ip_hash: string | null
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          captain_code: string
          captain_id?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          captain_code?: string
          captain_id?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "captain_clicks_captain_id_fkey"
            columns: ["captain_id"]
            isOneToOne: false
            referencedRelation: "captains"
            referencedColumns: ["id"]
          },
        ]
      }
      captains: {
        Row: {
          area: string | null
          city: string | null
          code: string
          created_at: string
          id: string
          name: string
          notes: string | null
          phone: string
          source: string | null
          status: string
          token: string
          upi_id: string | null
        }
        Insert: {
          area?: string | null
          city?: string | null
          code: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          phone: string
          source?: string | null
          status?: string
          token: string
          upi_id?: string | null
        }
        Update: {
          area?: string | null
          city?: string | null
          code?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          source?: string | null
          status?: string
          token?: string
          upi_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          name_en: string
          name_ta: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name_en: string
          name_ta?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name_en?: string
          name_ta?: string | null
          slug?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          first_order_at: string | null
          id: string
          landmark: string | null
          last_order_at: string | null
          name: string
          phone: string
          pincode: string | null
          total_orders: number
          total_value: number
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_order_at?: string | null
          id?: string
          landmark?: string | null
          last_order_at?: string | null
          name: string
          phone: string
          pincode?: string | null
          total_orders?: number
          total_value?: number
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_order_at?: string | null
          id?: string
          landmark?: string | null
          last_order_at?: string | null
          name?: string
          phone?: string
          pincode?: string | null
          total_orders?: number
          total_value?: number
          whatsapp?: string | null
        }
        Relationships: []
      }
      general_enquiries: {
        Row: {
          category: string | null
          created_at: string
          email: string | null
          id: string
          message: string | null
          name: string
          phone: string
          status: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name: string
          phone: string
          status?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string
          status?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          is_discountable: boolean
          line_total: number
          name_en: string
          name_ta: string | null
          order_id: string
          product_id: string | null
          quantity: number
          sku: string
          unit: string
          unit_price: number
        }
        Insert: {
          id?: string
          is_discountable: boolean
          line_total: number
          name_en: string
          name_ta?: string | null
          order_id: string
          product_id?: string | null
          quantity: number
          sku: string
          unit: string
          unit_price: number
        }
        Update: {
          id?: string
          is_discountable?: boolean
          line_total?: number
          name_en?: string
          name_ta?: string | null
          order_id?: string
          product_id?: string | null
          quantity?: number
          sku?: string
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_ref_counters: {
        Row: {
          next_val: number
          yymm: string
        }
        Insert: {
          next_val?: number
          yymm: string
        }
        Update: {
          next_val?: number
          yymm?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          address: string
          captain_code: string | null
          captain_id: string | null
          city: string
          commission_amount: number | null
          commission_paid_at: string | null
          commission_rate: number | null
          confirmed_at: string | null
          created_at: string
          customer_id: string
          delivered_at: string | null
          discount_amount: number
          discount_percent: number
          discountable_subtotal: number
          email: string | null
          first_contacted_at: string | null
          grand_total: number
          id: string
          internal_notes: Json
          ip_hash: string | null
          landmark: string | null
          lost_reason: string | null
          name: string
          needs_review: boolean
          net_rate_subtotal: number
          notes: string | null
          order_ref: string
          phone: string
          pincode: string
          preferred_call_time: string | null
          source_url: string | null
          status: string
          subtotal: number
          total_quantity: number
          updated_at: string
          user_agent: string | null
          whatsapp: string | null
        }
        Insert: {
          address: string
          captain_code?: string | null
          captain_id?: string | null
          city: string
          commission_amount?: number | null
          commission_paid_at?: string | null
          commission_rate?: number | null
          confirmed_at?: string | null
          created_at?: string
          customer_id: string
          delivered_at?: string | null
          discount_amount?: number
          discount_percent?: number
          discountable_subtotal: number
          email?: string | null
          first_contacted_at?: string | null
          grand_total: number
          id?: string
          internal_notes?: Json
          ip_hash?: string | null
          landmark?: string | null
          lost_reason?: string | null
          name: string
          needs_review?: boolean
          net_rate_subtotal: number
          notes?: string | null
          order_ref?: string
          phone: string
          pincode: string
          preferred_call_time?: string | null
          source_url?: string | null
          status?: string
          subtotal: number
          total_quantity: number
          updated_at?: string
          user_agent?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string
          captain_code?: string | null
          captain_id?: string | null
          city?: string
          commission_amount?: number | null
          commission_paid_at?: string | null
          commission_rate?: number | null
          confirmed_at?: string | null
          created_at?: string
          customer_id?: string
          delivered_at?: string | null
          discount_amount?: number
          discount_percent?: number
          discountable_subtotal?: number
          email?: string | null
          first_contacted_at?: string | null
          grand_total?: number
          id?: string
          internal_notes?: Json
          ip_hash?: string | null
          landmark?: string | null
          lost_reason?: string | null
          name?: string
          needs_review?: boolean
          net_rate_subtotal?: number
          notes?: string | null
          order_ref?: string
          phone?: string
          pincode?: string
          preferred_call_time?: string | null
          source_url?: string | null
          status?: string
          subtotal?: number
          total_quantity?: number
          updated_at?: string
          user_agent?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_captain_id_fkey"
            columns: ["captain_id"]
            isOneToOne: false
            referencedRelation: "captains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          changed_by: string
          created_at: string
          id: string
          new_price: number | null
          old_price: number | null
          product_id: string
          reason: string | null
        }
        Insert: {
          changed_by: string
          created_at?: string
          id?: string
          new_price?: number | null
          old_price?: number | null
          product_id: string
          reason?: string | null
        }
        Update: {
          changed_by?: string
          created_at?: string
          id?: string
          new_price?: number | null
          old_price?: number | null
          product_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          image_urls: string[]
          is_bestseller: boolean
          is_discountable: boolean
          is_featured: boolean
          min_qty: number
          name_en: string
          name_ta: string | null
          price: number | null
          sku: string
          slug: string
          status: string
          unit: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          image_urls?: string[]
          is_bestseller?: boolean
          is_discountable?: boolean
          is_featured?: boolean
          min_qty?: number
          name_en: string
          name_ta?: string | null
          price?: number | null
          sku: string
          slug: string
          status?: string
          unit?: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          image_urls?: string[]
          is_bestseller?: boolean
          is_discountable?: boolean
          is_featured?: boolean
          min_qty?: number
          name_en?: string
          name_ta?: string | null
          price?: number | null
          sku?: string
          slug?: string
          status?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_order_ref: { Args: never; Returns: string }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

