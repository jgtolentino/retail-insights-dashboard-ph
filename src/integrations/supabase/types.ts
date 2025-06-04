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
      customer_requests: {
        Row: {
          accepted_suggestion: boolean | null
          created_at: string | null
          id: number
          request_mode: string | null
          request_type: string | null
          transaction_id: number | null
        }
        Insert: {
          accepted_suggestion?: boolean | null
          created_at?: string | null
          id?: number
          request_mode?: string | null
          request_type?: string | null
          transaction_id?: number | null
        }
        Update: {
          accepted_suggestion?: boolean | null
          created_at?: string | null
          id?: number
          request_mode?: string | null
          request_type?: string | null
          transaction_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_requests_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          age: number | null
          barangay: string | null
          city: string | null
          created_at: string | null
          customer_id: string
          gender: string | null
          id: number
          loyalty_tier: string | null
          name: string
          region: string
          total_spent: number | null
          visit_count: number | null
        }
        Insert: {
          age?: number | null
          barangay?: string | null
          city?: string | null
          created_at?: string | null
          customer_id: string
          gender?: string | null
          id?: number
          loyalty_tier?: string | null
          name: string
          region: string
          total_spent?: number | null
          visit_count?: number | null
        }
        Update: {
          age?: number | null
          barangay?: string | null
          city?: string | null
          created_at?: string | null
          customer_id?: string
          gender?: string | null
          id?: number
          loyalty_tier?: string | null
          name?: string
          region?: string
          total_spent?: number | null
          visit_count?: number | null
        }
        Relationships: []
      }
      device_health: {
        Row: {
          battery_level: number | null
          cpu_usage: number | null
          created_at: string | null
          device_id: string
          disk_usage: number | null
          id: string
          memory_usage: number | null
          metadata: Json | null
          network_connected: boolean | null
          temperature: number | null
          timestamp: string | null
          uptime_seconds: number | null
        }
        Insert: {
          battery_level?: number | null
          cpu_usage?: number | null
          created_at?: string | null
          device_id: string
          disk_usage?: number | null
          id?: string
          memory_usage?: number | null
          metadata?: Json | null
          network_connected?: boolean | null
          temperature?: number | null
          timestamp?: string | null
          uptime_seconds?: number | null
        }
        Update: {
          battery_level?: number | null
          cpu_usage?: number | null
          created_at?: string | null
          device_id?: string
          disk_usage?: number | null
          id?: string
          memory_usage?: number | null
          metadata?: Json | null
          network_connected?: boolean | null
          temperature?: number | null
          timestamp?: string | null
          uptime_seconds?: number | null
        }
        Relationships: []
      }
      devices: {
        Row: {
          created_at: string | null
          device_id: string
          device_type: string
          firmware_version: string
          id: string
          last_seen: string | null
          location: string | null
          metadata: Json | null
          network_info: Json | null
          registration_time: string | null
          status: string
          store_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_id: string
          device_type?: string
          firmware_version?: string
          id?: string
          last_seen?: string | null
          location?: string | null
          metadata?: Json | null
          network_info?: Json | null
          registration_time?: string | null
          status?: string
          store_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string
          device_type?: string
          firmware_version?: string
          id?: string
          last_seen?: string | null
          location?: string | null
          metadata?: Json | null
          network_info?: Json | null
          registration_time?: string | null
          status?: string
          store_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      edge_logs: {
        Row: {
          component: string | null
          created_at: string | null
          device_id: string
          error_code: string | null
          id: string
          log_level: string
          message: string
          metadata: Json | null
          timestamp: string | null
        }
        Insert: {
          component?: string | null
          created_at?: string | null
          device_id: string
          error_code?: string | null
          id?: string
          log_level?: string
          message: string
          metadata?: Json | null
          timestamp?: string | null
        }
        Update: {
          component?: string | null
          created_at?: string | null
          device_id?: string
          error_code?: string | null
          id?: string
          log_level?: string
          message?: string
          metadata?: Json | null
          timestamp?: string | null
        }
        Relationships: []
      }
      product_detections: {
        Row: {
          brand_detected: string
          confidence_score: number | null
          created_at: string | null
          customer_age: number | null
          customer_gender: string | null
          detected_at: string | null
          device_id: string
          id: string
          image_path: string | null
          metadata: Json | null
          store_id: string | null
        }
        Insert: {
          brand_detected: string
          confidence_score?: number | null
          created_at?: string | null
          customer_age?: number | null
          customer_gender?: string | null
          detected_at?: string | null
          device_id: string
          id?: string
          image_path?: string | null
          metadata?: Json | null
          store_id?: string | null
        }
        Update: {
          brand_detected?: string
          confidence_score?: number | null
          created_at?: string | null
          customer_age?: number | null
          customer_gender?: string | null
          detected_at?: string | null
          device_id?: string
          id?: string
          image_path?: string | null
          metadata?: Json | null
          store_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          brand_id: number | null
          category: string | null
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          brand_id?: number | null
          category?: string | null
          created_at?: string | null
          id?: number
          name: string
        }
        Update: {
          brand_id?: number | null
          category?: string | null
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
      request_behaviors: {
        Row: {
          created_at: string | null
          extracted_entities: Json | null
          extracted_phrase: string | null
          id: number
          nlp_confidence: number | null
          nlp_model_version: string | null
          processing_timestamp: string | null
          raw_nlp_output: Json | null
          request_method: string | null
          request_type: string | null
          suggestion_accepted: boolean | null
          suggestion_offered: boolean | null
          transaction_id: number | null
          transaction_item_id: number | null
        }
        Insert: {
          created_at?: string | null
          extracted_entities?: Json | null
          extracted_phrase?: string | null
          id?: number
          nlp_confidence?: number | null
          nlp_model_version?: string | null
          processing_timestamp?: string | null
          raw_nlp_output?: Json | null
          request_method?: string | null
          request_type?: string | null
          suggestion_accepted?: boolean | null
          suggestion_offered?: boolean | null
          transaction_id?: number | null
          transaction_item_id?: number | null
        }
        Update: {
          created_at?: string | null
          extracted_entities?: Json | null
          extracted_phrase?: string | null
          id?: number
          nlp_confidence?: number | null
          nlp_model_version?: string | null
          processing_timestamp?: string | null
          raw_nlp_output?: Json | null
          request_method?: string | null
          request_type?: string | null
          suggestion_accepted?: boolean | null
          suggestion_offered?: boolean | null
          transaction_id?: number | null
          transaction_item_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "request_behaviors_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_behaviors_transaction_item_id_fkey"
            columns: ["transaction_item_id"]
            isOneToOne: false
            referencedRelation: "transaction_items"
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
          checkout_seconds: number | null
          checkout_time: string | null
          created_at: string | null
          customer_age: number | null
          customer_gender: string | null
          device_id: string | null
          id: number
          is_weekend: boolean | null
          nlp_confidence_score: number | null
          nlp_processed: boolean | null
          nlp_processed_at: string | null
          payment_method: string | null
          request_type: string | null
          store_id: number | null
          store_location: string | null
          suggestion_accepted: boolean | null
          total_amount: number | null
          transcription_text: string | null
        }
        Insert: {
          checkout_seconds?: number | null
          checkout_time?: string | null
          created_at?: string | null
          customer_age?: number | null
          customer_gender?: string | null
          device_id?: string | null
          id?: number
          is_weekend?: boolean | null
          nlp_confidence_score?: number | null
          nlp_processed?: boolean | null
          nlp_processed_at?: string | null
          payment_method?: string | null
          request_type?: string | null
          store_id?: number | null
          store_location?: string | null
          suggestion_accepted?: boolean | null
          total_amount?: number | null
          transcription_text?: string | null
        }
        Update: {
          checkout_seconds?: number | null
          checkout_time?: string | null
          created_at?: string | null
          customer_age?: number | null
          customer_gender?: string | null
          device_id?: string | null
          id?: number
          is_weekend?: boolean | null
          nlp_confidence_score?: number | null
          nlp_processed?: boolean | null
          nlp_processed_at?: string | null
          payment_method?: string | null
          request_type?: string | null
          store_id?: number | null
          store_location?: string | null
          suggestion_accepted?: boolean | null
          total_amount?: number | null
          transcription_text?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      mv_daily_metrics: {
        Row: {
          avg_transaction: number | null
          date: string | null
          store_id: number | null
          total_revenue: number | null
          transaction_count: number | null
          unique_customers: number | null
          weekday_transactions: number | null
          weekend_transactions: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_age_distribution_simple: {
        Args: Record<PropertyKey, never>
        Returns: {
          age_group: string
          value: number
          percentage: number
        }[]
      }
      get_basket_summary: {
        Args: { p_cat?: string; p_n?: number }
        Returns: {
          product_name: string
          brand_name: string
          category: string
          qty_sum: number
          revenue: number
        }[]
      }
      get_brand_analysis_for_filters: {
        Args: { p_category?: string; p_tbwa_only?: boolean }
        Returns: Json
      }
      get_brand_performance: {
        Args: {
          filter_categories?: string[]
          filter_brands?: number[]
          filter_locations?: string[]
          date_from?: string
          date_to?: string
          limit_count?: number
        }
        Returns: Json
      }
      get_bundle_analysis: {
        Args: { p_limit?: number }
        Returns: {
          product_1: string
          product_2: string
          frequency: number
          confidence: number
          lift: number
        }[]
      }
      get_category_metrics: {
        Args: { category_name: string }
        Returns: Json
      }
      get_consumer_profile: {
        Args: { p_start?: string; p_end?: string }
        Returns: Json
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
      get_dashboard_metrics: {
        Args:
          | {
              filter_categories?: string[]
              filter_brands?: number[]
              filter_locations?: string[]
              date_from?: string
              date_to?: string
            }
          | {
              filter_categories?: string[]
              filter_brands?: string[]
              filter_locations?: string[]
              date_from?: string
              date_to?: string
            }
        Returns: Json
      }
      get_dashboard_summary: {
        Args: {
          p_start_date?: string
          p_end_date?: string
          p_store_id?: number
        }
        Returns: {
          total_transactions: number
          total_revenue: number
          avg_transaction: number
          unique_customers: number
          suggestion_acceptance_rate: number
          substitution_rate: number
          suggestions_offered: number
          suggestions_accepted: number
        }[]
      }
      get_dashboard_summary_weekly: {
        Args:
          | { date_from?: string; date_to?: string }
          | { p_start_date?: string; p_end_date?: string; p_store_id?: number }
        Returns: {
          week_start: string
          week_end: string
          total_revenue: number
          total_transactions: number
          avg_transaction: number
          unique_customers: number
        }[]
      }
      get_filter_options: {
        Args: Record<PropertyKey, never>
        Returns: Json
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
      get_gender_distribution_simple: {
        Args: Record<PropertyKey, never>
        Returns: {
          demographic: string
          value: number
          percentage: number
        }[]
      }
      get_hierarchical_substitutions: {
        Args: {
          p_start_date?: string
          p_end_date?: string
          p_store_id?: number
        }
        Returns: {
          level: string
          original_category: string
          substitute_category: string
          original_brand: string
          substitute_brand: string
          original_product: string
          substitute_product: string
          reason: string
          frequency: number
          substitution_rate: number
        }[]
      }
      get_hourly_trends: {
        Args: { p_start: string; p_end: string; p_store?: number[] }
        Returns: {
          hr: string
          txn_ct: number
          peso: number
          units: number
          is_weekend: boolean
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
      get_product_categories_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          category: string
          product_count: number
          brand_count: number
          total_revenue: number
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
      get_request_behaviour: {
        Args: { p_start: string; p_end: string }
        Returns: Json
      }
      get_substitution_flow: {
        Args: Record<PropertyKey, never>
        Returns: {
          orig: string
          sub: string
          cnt: number
          orig_brand: string
          sub_brand: string
        }[]
      }
      get_substitution_flows: {
        Args: {
          p_start_date?: string
          p_end_date?: string
          p_store_id?: number
        }
        Returns: {
          original_product: string
          substitute_product: string
          reason: string
          frequency: number
        }[]
      }
      get_suggestion_funnel: {
        Args: {
          p_start_date?: string
          p_end_date?: string
          p_store_id?: number
        }
        Returns: {
          stage: string
          count: number
          percentage: number
        }[]
      }
      get_top_brand: {
        Args: Record<PropertyKey, never> | { p_start?: string; p_end?: string }
        Returns: {
          brand_name: string
          revenue: number
          transaction_count: number
          percentage: number
        }[]
      }
      get_top_brand_by_mentions: {
        Args: { p_start?: string; p_end?: string }
        Returns: {
          brand_name: string
          unique_transactions: number
          total_items_sold: number
          percentage: number
        }[]
      }
      get_top_brand_by_revenue: {
        Args: { p_start?: string; p_end?: string }
        Returns: {
          brand_name: string
          revenue: number
          transaction_count: number
          percentage: number
        }[]
      }
      get_top_bundle_simple: {
        Args: Record<PropertyKey, never>
        Returns: {
          product_1: string
          product_2: string
          frequency: number
          confidence: number
        }[]
      }
      refresh_materialized_views: {
        Args: Record<PropertyKey, never>
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
