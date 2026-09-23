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
          commission_rate: number
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
          commission_rate?: number
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
          commission_rate?: number
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
          group_id: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name_en: string
          name_ta: string | null
          shop_id: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          group_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name_en: string
          name_ta?: string | null
          shop_id: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          group_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name_en?: string
          name_ta?: string | null
          shop_id?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "category_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      category_groups: {
        Row: {
          created_at: string
          display_order: number
          icon_url: string | null
          id: string
          is_featured: boolean
          name_en: string
          name_ta: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          icon_url?: string | null
          id?: string
          is_featured?: boolean
          name_en: string
          name_ta?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          display_order?: number
          icon_url?: string | null
          id?: string
          is_featured?: boolean
          name_en?: string
          name_ta?: string | null
          slug?: string
        }
        Relationships: []
      }
      combo_pack_items: {
        Row: {
          created_at: string
          display_order: number
          id: string
          product_id: string
          quantity: number
          variety_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          product_id: string
          quantity: number
          variety_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          product_id?: string
          quantity?: number
          variety_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "combo_pack_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combo_pack_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combo_pack_items_variety_id_fkey"
            columns: ["variety_id"]
            isOneToOne: false
            referencedRelation: "combo_pack_varieties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combo_pack_items_variety_id_fkey"
            columns: ["variety_id"]
            isOneToOne: false
            referencedRelation: "public_combo_pack_varieties"
            referencedColumns: ["id"]
          },
        ]
      }
      combo_pack_varieties: {
        Row: {
          combo_pack_id: string
          commission: number
          commission_pct: number
          created_at: string
          display_order: number
          id: string
          selling_price: number
          slug: string
          supplier_cost: number
          tier_label: string
          total_items: number
          updated_at: string
        }
        Insert: {
          combo_pack_id: string
          commission?: number
          commission_pct?: number
          created_at?: string
          display_order?: number
          id?: string
          selling_price?: number
          slug: string
          supplier_cost?: number
          tier_label?: string
          total_items?: number
          updated_at?: string
        }
        Update: {
          combo_pack_id?: string
          commission?: number
          commission_pct?: number
          created_at?: string
          display_order?: number
          id?: string
          selling_price?: number
          slug?: string
          supplier_cost?: number
          tier_label?: string
          total_items?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "combo_pack_varieties_combo_pack_id_fkey"
            columns: ["combo_pack_id"]
            isOneToOne: false
            referencedRelation: "combo_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      combo_packs: {
        Row: {
          badge_text: string
          created_at: string
          display_order: number
          hero_image_url: string | null
          id: string
          is_active: boolean
          name: string
          shop_id: string
          slug: string
          tagline: string | null
          updated_at: string
        }
        Insert: {
          badge_text?: string
          created_at?: string
          display_order?: number
          hero_image_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          shop_id: string
          slug: string
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          badge_text?: string
          created_at?: string
          display_order?: number
          hero_image_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          shop_id?: string
          slug?: string
          tagline?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "combo_packs_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
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
          combo_variety_id: string | null
          discount_percent: number | null
          id: string
          is_discountable: boolean
          line_commission: number | null
          line_supplier_total: number | null
          line_total: number
          name_en: string
          name_ta: string | null
          net_markup_percent: number | null
          order_id: string
          product_id: string | null
          quantity: number
          sku: string
          unit: string
          unit_mrp: number | null
          unit_price: number
          unit_supplier_price: number | null
        }
        Insert: {
          combo_variety_id?: string | null
          discount_percent?: number | null
          id?: string
          is_discountable: boolean
          line_commission?: number | null
          line_supplier_total?: number | null
          line_total: number
          name_en: string
          name_ta?: string | null
          net_markup_percent?: number | null
          order_id: string
          product_id?: string | null
          quantity: number
          sku: string
          unit: string
          unit_mrp?: number | null
          unit_price: number
          unit_supplier_price?: number | null
        }
        Update: {
          combo_variety_id?: string | null
          discount_percent?: number | null
          id?: string
          is_discountable?: boolean
          line_commission?: number | null
          line_supplier_total?: number | null
          line_total?: number
          name_en?: string
          name_ta?: string | null
          net_markup_percent?: number | null
          order_id?: string
          product_id?: string | null
          quantity?: number
          sku?: string
          unit?: string
          unit_mrp?: number | null
          unit_price?: number
          unit_supplier_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_combo_variety_id_fkey"
            columns: ["combo_variety_id"]
            isOneToOne: false
            referencedRelation: "combo_pack_varieties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_combo_variety_id_fkey"
            columns: ["combo_variety_id"]
            isOneToOne: false
            referencedRelation: "public_combo_pack_varieties"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
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
          agent_code: string | null
          agent_credit_source: string | null
          agent_id: string | null
          captain_code: string | null
          captain_id: string | null
          city: string
          commission_amount: number | null
          commission_paid_at: string | null
          commission_rate: number | null
          commission_total: number | null
          confirmed_at: string | null
          created_at: string
          customer_id: string
          delivered_at: string | null
          delivery_charge: number
          discount_amount: number
          discount_percent: number
          discountable_subtotal: number
          dispatched_at: string | null
          email: string | null
          first_contacted_at: string | null
          grand_total: number
          id: string
          internal_notes: Json
          ip_hash: string | null
          is_preview: boolean
          landmark: string | null
          lost_reason: string | null
          lr_number: string | null
          mrp_total: number | null
          name: string
          needs_review: boolean
          net_rate_subtotal: number
          notes: string | null
          order_ref: string
          packaging_charge: number
          phone: string
          pincode: string
          preferred_call_time: string | null
          price_context: string | null
          pricing_estimated: boolean
          shop_id: string
          source_url: string | null
          state: string | null
          status: string
          subtotal: number
          supplier_paid_amount: number | null
          supplier_paid_at: string | null
          supplier_payment_ref: string | null
          supplier_payment_status: string
          supplier_total: number | null
          total_quantity: number
          tracking_url: string | null
          transport_name: string | null
          updated_at: string
          user_agent: string | null
          whatsapp: string | null
          you_save: number | null
        }
        Insert: {
          address: string
          agent_code?: string | null
          agent_credit_source?: string | null
          agent_id?: string | null
          captain_code?: string | null
          captain_id?: string | null
          city: string
          commission_amount?: number | null
          commission_paid_at?: string | null
          commission_rate?: number | null
          commission_total?: number | null
          confirmed_at?: string | null
          created_at?: string
          customer_id: string
          delivered_at?: string | null
          delivery_charge?: number
          discount_amount?: number
          discount_percent?: number
          discountable_subtotal: number
          dispatched_at?: string | null
          email?: string | null
          first_contacted_at?: string | null
          grand_total: number
          id?: string
          internal_notes?: Json
          ip_hash?: string | null
          is_preview?: boolean
          landmark?: string | null
          lost_reason?: string | null
          lr_number?: string | null
          mrp_total?: number | null
          name: string
          needs_review?: boolean
          net_rate_subtotal: number
          notes?: string | null
          order_ref?: string
          packaging_charge?: number
          phone: string
          pincode: string
          preferred_call_time?: string | null
          price_context?: string | null
          pricing_estimated?: boolean
          shop_id: string
          source_url?: string | null
          state?: string | null
          status?: string
          subtotal: number
          supplier_paid_amount?: number | null
          supplier_paid_at?: string | null
          supplier_payment_ref?: string | null
          supplier_payment_status?: string
          supplier_total?: number | null
          total_quantity: number
          tracking_url?: string | null
          transport_name?: string | null
          updated_at?: string
          user_agent?: string | null
          whatsapp?: string | null
          you_save?: number | null
        }
        Update: {
          address?: string
          agent_code?: string | null
          agent_credit_source?: string | null
          agent_id?: string | null
          captain_code?: string | null
          captain_id?: string | null
          city?: string
          commission_amount?: number | null
          commission_paid_at?: string | null
          commission_rate?: number | null
          commission_total?: number | null
          confirmed_at?: string | null
          created_at?: string
          customer_id?: string
          delivered_at?: string | null
          delivery_charge?: number
          discount_amount?: number
          discount_percent?: number
          discountable_subtotal?: number
          dispatched_at?: string | null
          email?: string | null
          first_contacted_at?: string | null
          grand_total?: number
          id?: string
          internal_notes?: Json
          ip_hash?: string | null
          is_preview?: boolean
          landmark?: string | null
          lost_reason?: string | null
          lr_number?: string | null
          mrp_total?: number | null
          name?: string
          needs_review?: boolean
          net_rate_subtotal?: number
          notes?: string | null
          order_ref?: string
          packaging_charge?: number
          phone?: string
          pincode?: string
          preferred_call_time?: string | null
          price_context?: string | null
          pricing_estimated?: boolean
          shop_id?: string
          source_url?: string | null
          state?: string | null
          status?: string
          subtotal?: number
          supplier_paid_amount?: number | null
          supplier_paid_at?: string | null
          supplier_payment_ref?: string | null
          supplier_payment_status?: string
          supplier_total?: number | null
          total_quantity?: number
          tracking_url?: string | null
          transport_name?: string | null
          updated_at?: string
          user_agent?: string | null
          whatsapp?: string | null
          you_save?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "shop_agents"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "orders_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
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
          {
            foreignKeyName: "price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_settings: {
        Row: {
          default_discount_percent: number
          default_net_markup_percent: number
          id: boolean
          supplier_discount_percent: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          default_discount_percent?: number
          default_net_markup_percent?: number
          id?: boolean
          supplier_discount_percent?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          default_discount_percent?: number
          default_net_markup_percent?: number
          id?: boolean
          supplier_discount_percent?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          discount_percent: number
          display_order: number
          id: string
          image_url: string | null
          image_urls: string[]
          is_bestseller: boolean
          is_discountable: boolean
          is_featured: boolean
          min_qty: number
          mrp: number | null
          name_en: string
          name_ta: string | null
          net_markup_percent: number
          pack: string | null
          price: number | null
          price_agent: number | null
          shop_id: string
          sku: string
          slug: string
          status: string
          supplier_price: number | null
          unit: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          discount_percent?: number
          display_order?: number
          id?: string
          image_url?: string | null
          image_urls?: string[]
          is_bestseller?: boolean
          is_discountable?: boolean
          is_featured?: boolean
          min_qty?: number
          mrp?: number | null
          name_en: string
          name_ta?: string | null
          net_markup_percent?: number
          pack?: string | null
          price?: number | null
          price_agent?: number | null
          shop_id: string
          sku: string
          slug: string
          status?: string
          supplier_price?: number | null
          unit?: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          discount_percent?: number
          display_order?: number
          id?: string
          image_url?: string | null
          image_urls?: string[]
          is_bestseller?: boolean
          is_discountable?: boolean
          is_featured?: boolean
          min_qty?: number
          mrp?: number | null
          name_en?: string
          name_ta?: string | null
          net_markup_percent?: number
          pack?: string | null
          price?: number | null
          price_agent?: number | null
          shop_id?: string
          sku?: string
          slug?: string
          status?: string
          supplier_price?: number | null
          unit?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
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
      shop_agents: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          phone: string
          shop_id: string
          status: string
          token: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          phone: string
          shop_id: string
          status?: string
          token: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          phone?: string
          shop_id?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_agents_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          agent_markup_percent: number | null
          banner_url: string | null
          created_at: string
          customer_discount_percent: number | null
          default_agent_id: string | null
          display_order: number
          id: string
          logo_url: string | null
          markup_percent: number | null
          min_order_value: number | null
          name_en: string
          name_ta: string | null
          preview_token: string | null
          pricing_mode: string
          slug: string
          status: string
          supplier_discount_percent: number | null
          tagline: string | null
          updated_at: string
        }
        Insert: {
          agent_markup_percent?: number | null
          banner_url?: string | null
          created_at?: string
          customer_discount_percent?: number | null
          default_agent_id?: string | null
          display_order?: number
          id?: string
          logo_url?: string | null
          markup_percent?: number | null
          min_order_value?: number | null
          name_en: string
          name_ta?: string | null
          preview_token?: string | null
          pricing_mode?: string
          slug: string
          status?: string
          supplier_discount_percent?: number | null
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          agent_markup_percent?: number | null
          banner_url?: string | null
          created_at?: string
          customer_discount_percent?: number | null
          default_agent_id?: string | null
          display_order?: number
          id?: string
          logo_url?: string | null
          markup_percent?: number | null
          min_order_value?: number | null
          name_en?: string
          name_ta?: string | null
          preview_token?: string | null
          pricing_mode?: string
          slug?: string
          status?: string
          supplier_discount_percent?: number | null
          tagline?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shops_default_agent_id_fkey"
            columns: ["default_agent_id"]
            isOneToOne: false
            referencedRelation: "shop_agents"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_combo_pack_items: {
        Row: {
          category: Json | null
          display_order: number | null
          id: string | null
          name_en: string | null
          name_ta: string | null
          quantity: number | null
          unit: string | null
          variety_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "combo_pack_items_variety_id_fkey"
            columns: ["variety_id"]
            isOneToOne: false
            referencedRelation: "combo_pack_varieties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combo_pack_items_variety_id_fkey"
            columns: ["variety_id"]
            isOneToOne: false
            referencedRelation: "public_combo_pack_varieties"
            referencedColumns: ["id"]
          },
        ]
      }
      public_combo_pack_varieties: {
        Row: {
          combo_pack_id: string | null
          display_order: number | null
          id: string | null
          selling_price: number | null
          shop_id: string | null
          shop_slug: string | null
          slug: string | null
          tier_label: string | null
          total_items: number | null
        }
        Relationships: [
          {
            foreignKeyName: "combo_pack_varieties_combo_pack_id_fkey"
            columns: ["combo_pack_id"]
            isOneToOne: false
            referencedRelation: "combo_packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combo_packs_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      public_products: {
        Row: {
          category: Json | null
          category_id: string | null
          description: string | null
          discount_percent: number | null
          display_order: number | null
          id: string | null
          image_url: string | null
          image_urls: string[] | null
          is_bestseller: boolean | null
          is_discountable: boolean | null
          is_featured: boolean | null
          min_qty: number | null
          mrp: number | null
          name_en: string | null
          name_ta: string | null
          pack: string | null
          price: number | null
          price_agent: number | null
          shop_id: string | null
          shop_slug: string | null
          sku: string | null
          slug: string | null
          status: string | null
          unit: string | null
          video_url: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      generate_order_ref: { Args: never; Returns: string }
      recompute_combo_variety: {
        Args: { p_variety_id: string }
        Returns: undefined
      }
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
