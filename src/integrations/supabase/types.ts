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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      post_interactions: {
        Row: {
          comment_text: string | null
          created_at: string
          device_fingerprint: string
          id: string
          interaction_type: string
          post_id: string | null
        }
        Insert: {
          comment_text?: string | null
          created_at?: string
          device_fingerprint: string
          id?: string
          interaction_type: string
          post_id?: string | null
        }
        Update: {
          comment_text?: string | null
          created_at?: string
          device_fingerprint?: string
          id?: string
          interaction_type?: string
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_interactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_participations: {
        Row: {
          claimed_at: string | null
          created_at: string
          device_fingerprint: string
          email: string
          first_name: string
          id: string
          phone: string
          prize_claimed: boolean
          prize_code: string | null
          prize_won: string | null
          rgpd_consent: boolean
          score: number
          total_questions: number
          week_start: string
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          device_fingerprint: string
          email: string
          first_name: string
          id?: string
          phone: string
          prize_claimed?: boolean
          prize_code?: string | null
          prize_won?: string | null
          rgpd_consent?: boolean
          score?: number
          total_questions?: number
          week_start: string
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          device_fingerprint?: string
          email?: string
          first_name?: string
          id?: string
          phone?: string
          prize_claimed?: boolean
          prize_code?: string | null
          prize_won?: string | null
          rgpd_consent?: boolean
          score?: number
          total_questions?: number
          week_start?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          category: string
          correct_answer: string
          created_at: string
          id: string
          is_active: boolean
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question: string
        }
        Insert: {
          category?: string
          correct_answer: string
          created_at?: string
          id?: string
          is_active?: boolean
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question: string
        }
        Update: {
          category?: string
          correct_answer?: string
          created_at?: string
          id?: string
          is_active?: boolean
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question?: string
        }
        Relationships: []
      }
      quiz_sessions: {
        Row: {
          answers: Json
          completed: boolean
          current_question: number
          device_fingerprint: string
          expires_at: string
          id: string
          last_activity: string
          question_ids: string[]
          started_at: string
        }
        Insert: {
          answers?: Json
          completed?: boolean
          current_question?: number
          device_fingerprint: string
          expires_at?: string
          id?: string
          last_activity?: string
          question_ids: string[]
          started_at?: string
        }
        Update: {
          answers?: Json
          completed?: boolean
          current_question?: number
          device_fingerprint?: string
          expires_at?: string
          id?: string
          last_activity?: string
          question_ids?: string[]
          started_at?: string
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          created_at: string
          id: string
          is_visible: boolean
          network: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_visible?: boolean
          network: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_visible?: boolean
          network?: string
          url?: string
        }
        Relationships: []
      }
      splash_settings: {
        Row: {
          background_image_url: string | null
          created_at: string
          cta_text: string
          event_subtitle: string
          event_title: string
          game_line: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          background_image_url?: string | null
          created_at?: string
          cta_text?: string
          event_subtitle?: string
          event_title?: string
          game_line?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          background_image_url?: string | null
          created_at?: string
          cta_text?: string
          event_subtitle?: string
          event_title?: string
          game_line?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      weekly_stock: {
        Row: {
          created_at: string
          crepe_remaining: number
          crepe_total: number
          formule_complete_remaining: number
          formule_complete_total: number
          galette_remaining: number
          galette_total: number
          id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          crepe_remaining?: number
          crepe_total?: number
          formule_complete_remaining?: number
          formule_complete_total?: number
          galette_remaining?: number
          galette_total?: number
          id?: string
          week_start: string
        }
        Update: {
          created_at?: string
          crepe_remaining?: number
          crepe_total?: number
          formule_complete_remaining?: number
          formule_complete_total?: number
          galette_remaining?: number
          galette_total?: number
          id?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_prize: {
        Args: { p_prize_type: string; p_week_start: string }
        Returns: boolean
      }
      ensure_weekly_stock: {
        Args: never
        Returns: {
          created_at: string
          crepe_remaining: number
          crepe_total: number
          formule_complete_remaining: number
          formule_complete_total: number
          galette_remaining: number
          galette_total: number
          id: string
          week_start: string
        }
        SetofOptions: {
          from: "*"
          to: "weekly_stock"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      generate_prize_code: { Args: never; Returns: string }
      get_current_week_start: { Args: never; Returns: string }
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
