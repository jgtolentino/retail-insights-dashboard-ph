export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      brands: {
        Row: {
          category: string | null
          created_at: string | null
          id: number
          is_tbwa: boolean | null
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: number
          is_tbwa?: boolean | null
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: number
          is_tbwa?: boolean | null
          name?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          brand_id: number | null
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          brand_id?: number | null
          created_at?: string | null
          id?: number
          name: string
        }
        Update: {
          brand_id?: number | null
          created_at?: string | null
          id?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          barangay: string | null
          city: string | null
          created_at: string | null
          id: number
          latitude: number | null
          location: string | null
          longitude: number | null
          name: string
          region: string | null
          updated_at: string | null
        }
        Insert: {
          barangay?: string | null
          city?: string | null
          created_at?: string | null
          id?: number
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name: string
          region?: string | null
          updated_at?: string | null
        }
        Update: {
          barangay?: string | null
          city?: string | null
          created_at?: string | null
          id?: number
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name?: string
          region?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      substitutions: {
        Row: {
          created_at: string | null
          id: number
          original_product_id: number | null
          reason: string | null
          substitute_product_id: number | null
          transaction_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          original_product_id?: number | null
          reason?: string | null
          substitute_product_id?: number | null
          transaction_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          original_product_id?: number | null
          reason?: string | null
          substitute_product_id?: number | null
          transaction_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "substitutions_original_product_id_fkey"
            columns: ["original_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "substitutions_substitute_product_id_fkey"
            columns: ["substitute_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "substitutions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_items: {
        Row: {
          created_at: string | null
          id: number
          price: number
          product_id: number | null
          quantity: number
          transaction_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          price: number
          product_id?: number | null
          quantity: number
          transaction_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          price?: number
          product_id?: number | null
          quantity?: number
          transaction_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          created_at: string | null
          customer_age: number | null
          customer_gender: string | null
          id: number
          store_location: string | null
          total_amount: number | null
        }
        Insert: {
          created_at?: string | null
          customer_age?: number | null
          customer_gender?: string | null
          id?: number
          store_location?: string | null
          total_amount?: number | null
        }
        Update: {
          created_at?: string | null
          customer_age?: number | null
          customer_gender?: string | null
          id?: number
          store_location?: string | null
          total_amount?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_age_distribution: {
        Args:
          | { start_date: string; end_date: string }
          | { start_date: string; end_date: string; bucket_size?: number }
          | { start_date?: string; end_date?: string; bucket_size?: number }
        Returns: {
          age_bucket: string
          customer_count: number
        }[]
      }
      get_daily_trends: {
        Args: { start_date: string; end_date: string }
        Returns: {
          day: string
          tx_count: number
          daily_revenue: number
          avg_tx: number
        }[]
      }
      get_frequently_bought_together: {
        Args: { start_date?: string; end_date?: string; min_frequency?: number }
        Returns: {
          product_1: string
          product_2: string
          frequency: number
          insight: string
        }[]
      }
      get_gender_distribution: {
        Args:
          | { start_date: string; end_date: string }
          | { start_date?: string; end_date?: string }
        Returns: {
          gender: string
          customer_count: number
          total_revenue: number
          percentage: number
        }[]
      }
      get_location_distribution: {
        Args:
          | { start_date: string; end_date: string }
          | { start_date?: string; end_date?: string }
        Returns: {
          location: string
          customer_count: number
          transaction_count: number
          total_revenue: number
          avg_transaction_value: number
          percentage: number
        }[]
      }
      get_product_substitutions: {
        Args: { start_date?: string; end_date?: string }
        Returns: {
          original_product: string
          substitute_product: string
          count: number
          reasons: string
        }[]
      }
      get_purchase_behavior_by_age: {
        Args: { start_date: string; end_date: string }
        Returns: {
          age_group: string
          avg_transaction_value: number
          purchase_frequency: number
          preferred_categories: string[]
        }[]
      }
      get_purchase_patterns_by_time: {
        Args: { start_date: string; end_date: string }
        Returns: {
          hour_of_day: number
          transaction_count: number
          total_revenue: number
          avg_transaction_value: number
        }[]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
