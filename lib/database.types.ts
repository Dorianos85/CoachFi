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
      certificates: {
        Row: {
          asset_address: string | null
          created_at: string
          id: string
          minted_at: string | null
          slug: string
          status: string
          title: string
          tx_hash: string | null
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          asset_address?: string | null
          created_at?: string
          id?: string
          minted_at?: string | null
          slug: string
          status?: string
          title: string
          tx_hash?: string | null
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          asset_address?: string | null
          created_at?: string
          id?: string
          minted_at?: string | null
          slug?: string
          status?: string
          title?: string
          tx_hash?: string | null
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      consents: {
        Row: {
          created_at: string
          doc_type: string
          doc_version: string
          granted: boolean
          id: string
          locale: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          doc_version: string
          granted?: boolean
          id?: string
          locale?: string
          user_id: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          doc_version?: string
          granted?: boolean
          id?: string
          locale?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_challenges: {
        Row: {
          challenge_date: string
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          reward_coins: number
          user_id: string
        }
        Insert: {
          challenge_date?: string
          created_at?: string
          id?: string
          is_correct: boolean
          question_id: string
          reward_coins?: number
          user_id: string
        }
        Update: {
          challenge_date?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          reward_coins?: number
          user_id?: string
        }
        Relationships: []
      }
      entitlements: {
        Row: {
          billing_provider: string | null
          current_period_end: string | null
          plan: string
          provider_customer_id: string | null
          status: string
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_provider?: string | null
          current_period_end?: string | null
          plan?: string
          provider_customer_id?: string | null
          status?: string
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_provider?: string | null
          current_period_end?: string | null
          plan?: string
          provider_customer_id?: string | null
          status?: string
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      health_checks: {
        Row: {
          answers: Json
          created_at: string
          id: string
          is_final: boolean
          score: number
          user_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          id?: string
          is_final?: boolean
          score: number
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          is_final?: boolean
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      jar_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          jar_id: string
          note: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          jar_id: string
          note?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          jar_id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jar_transactions_jar_id_fkey"
            columns: ["jar_id"]
            isOneToOne: false
            referencedRelation: "jars"
            referencedColumns: ["id"]
          },
        ]
      }
      jars: {
        Row: {
          balance: number
          currency: string
          id: string
          jar_type: string
          percent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          currency?: string
          id?: string
          jar_type: string
          percent: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          currency?: string
          id?: string
          jar_type?: string
          percent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kids_profiles: {
        Row: {
          avatar: Json
          created_at: string
          id: string
          nickname: string
          parent_id: string
        }
        Insert: {
          avatar?: Json
          created_at?: string
          id?: string
          nickname: string
          parent_id: string
        }
        Update: {
          avatar?: Json
          created_at?: string
          id?: string
          nickname?: string
          parent_id?: string
        }
        Relationships: []
      }
      leaderboard: {
        Row: {
          id: string
          name: string
          score: number
          streak: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          name: string
          score?: number
          streak?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          score?: number
          streak?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_gender: string | null
          avatar_style: string | null
          created_at: string
          goal: string
          id: string
          locale: string
          mode: string
          name: string
          onboarding_done: boolean
          updated_at: string
          voice_id: string | null
        }
        Insert: {
          avatar_gender?: string | null
          avatar_style?: string | null
          created_at?: string
          goal?: string
          id: string
          locale?: string
          mode?: string
          name?: string
          onboarding_done?: boolean
          updated_at?: string
          voice_id?: string | null
        }
        Update: {
          avatar_gender?: string | null
          avatar_style?: string | null
          created_at?: string
          goal?: string
          id?: string
          locale?: string
          mode?: string
          name?: string
          onboarding_done?: boolean
          updated_at?: string
          voice_id?: string | null
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          correct_count: number
          created_at: string
          id: string
          kind: string
          stage_id: string | null
          total_count: number
          user_id: string
        }
        Insert: {
          correct_count?: number
          created_at?: string
          id?: string
          kind?: string
          stage_id?: string | null
          total_count?: number
          user_id: string
        }
        Update: {
          correct_count?: number
          created_at?: string
          id?: string
          kind?: string
          stage_id?: string | null
          total_count?: number
          user_id?: string
        }
        Relationships: []
      }
      receipt_items: {
        Row: {
          category: string
          classification: string
          created_at: string
          id: string
          matched_list_item_id: string | null
          name: string
          price: number | null
          receipt_id: string
          user_id: string
        }
        Insert: {
          category?: string
          classification?: string
          created_at?: string
          id?: string
          matched_list_item_id?: string | null
          name: string
          price?: number | null
          receipt_id: string
          user_id: string
        }
        Update: {
          category?: string
          classification?: string
          created_at?: string
          id?: string
          matched_list_item_id?: string | null
          name?: string
          price?: number | null
          receipt_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipt_items_matched_list_item_id_fkey"
            columns: ["matched_list_item_id"]
            isOneToOne: false
            referencedRelation: "shopping_list_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          created_at: string
          currency: string
          id: string
          merchant: string | null
          purchased_at: string | null
          raw_text: string | null
          shopping_list_id: string | null
          source: string
          total_amount: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          merchant?: string | null
          purchased_at?: string | null
          raw_text?: string | null
          shopping_list_id?: string | null
          source?: string
          total_amount?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          merchant?: string | null
          purchased_at?: string | null
          raw_text?: string | null
          shopping_list_id?: string | null
          source?: string
          total_amount?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_shopping_list_id_fkey"
            columns: ["shopping_list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_ledger: {
        Row: {
          amount: number
          child_id: string | null
          created_at: string
          id: string
          meta: Json
          reason: string
          source: string
          unit: string
          user_id: string
        }
        Insert: {
          amount: number
          child_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          reason: string
          source?: string
          unit: string
          user_id: string
        }
        Update: {
          amount?: number
          child_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          reason?: string
          source?: string
          unit?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_ledger_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "kids_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_list_items: {
        Row: {
          category: string
          created_at: string
          id: string
          is_checked: boolean
          is_off_list: boolean
          list_id: string
          name: string
          price_estimate: number | null
          quantity: number
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_checked?: boolean
          is_off_list?: boolean
          list_id: string
          name: string
          price_estimate?: number | null
          quantity?: number
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_checked?: boolean
          is_off_list?: boolean
          list_id?: string
          name?: string
          price_estimate?: number | null
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          created_at: string
          id: string
          list_date: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          list_date?: string
          status?: string
          title?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          list_date?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      srs_cards: {
        Row: {
          ease_factor: number
          interval_days: number
          next_review: string
          question_id: string
          repetitions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ease_factor?: number
          interval_days?: number
          next_review?: string
          question_id: string
          repetitions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ease_factor?: number
          interval_days?: number
          next_review?: string
          question_id?: string
          repetitions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stage_progress: {
        Row: {
          stage_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          stage_id: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          stage_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      streaks: {
        Row: {
          current_streak: number
          last_active_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          last_active_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          last_active_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_events: {
        Row: {
          created_at: string
          id: string
          kind: string
          meta: Json
          units: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          meta?: Json
          units?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          meta?: Json
          units?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      reward_balances: {
        Row: {
          balance: number | null
          child_id: string | null
          unit: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reward_ledger_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "kids_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      mark_active_today: {
        Args: Record<PropertyKey, never>
        Returns: {
          current_streak: number
          last_active_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
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
