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
      admin_settings: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          setting_key: string
          setting_value: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          setting_key: string
          setting_value?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          setting_key?: string
          setting_value?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      carte_public: {
        Row: {
          created_at: string
          crepe_items: Json | null
          galette_items: Json | null
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          crepe_items?: Json | null
          galette_items?: Json | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          crepe_items?: Json | null
          galette_items?: Json | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          replied_at: string | null
          sender_email: string | null
          sender_name: string
          sender_phone: string | null
          sender_type: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          replied_at?: string | null
          sender_email?: string | null
          sender_name: string
          sender_phone?: string | null
          sender_type: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          replied_at?: string | null
          sender_email?: string | null
          sender_name?: string
          sender_phone?: string | null
          sender_type?: string
          subject?: string | null
        }
        Relationships: []
      }
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
      prize_history: {
        Row: {
          claimed_at: string | null
          id: string
          is_claimed: boolean | null
          loyalty_points_earned: number | null
          prize_code: string | null
          prize_type: string
          user_id: string | null
          won_at: string | null
        }
        Insert: {
          claimed_at?: string | null
          id?: string
          is_claimed?: boolean | null
          loyalty_points_earned?: number | null
          prize_code?: string | null
          prize_type: string
          user_id?: string | null
          won_at?: string | null
        }
        Update: {
          claimed_at?: string | null
          id?: string
          is_claimed?: boolean | null
          loyalty_points_earned?: number | null
          prize_code?: string | null
          prize_type?: string
          user_id?: string | null
          won_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          loyalty_points: number | null
          phone: string | null
          secret_menu_code: string | null
          secret_menu_unlocked: boolean | null
          secret_menu_unlocked_at: string | null
          total_visits: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          loyalty_points?: number | null
          phone?: string | null
          secret_menu_code?: string | null
          secret_menu_unlocked?: boolean | null
          secret_menu_unlocked_at?: string | null
          total_visits?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          loyalty_points?: number | null
          phone?: string | null
          secret_menu_code?: string | null
          secret_menu_unlocked?: boolean | null
          secret_menu_unlocked_at?: string | null
          total_visits?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
          security_token: string | null
          status: string
          token_generated_at: string | null
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
          security_token?: string | null
          status?: string
          token_generated_at?: string | null
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
          security_token?: string | null
          status?: string
          token_generated_at?: string | null
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
      reservations: {
        Row: {
          created_at: string | null
          id: string
          party_size: number | null
          reservation_date: string
          reservation_time: string
          special_requests: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          party_size?: number | null
          reservation_date: string
          reservation_time: string
          special_requests?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          party_size?: number | null
          reservation_date?: string
          reservation_time?: string
          special_requests?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      secret_access: {
        Row: {
          access_token: string
          created_at: string
          email: string
          expires_at: string
          first_name: string
          id: string
          phone: string
          secret_code: string
          week_start: string
        }
        Insert: {
          access_token: string
          created_at?: string
          email: string
          expires_at?: string
          first_name: string
          id?: string
          phone: string
          secret_code: string
          week_start: string
        }
        Update: {
          access_token?: string
          created_at?: string
          email?: string
          expires_at?: string
          first_name?: string
          id?: string
          phone?: string
          secret_code?: string
          week_start?: string
        }
        Relationships: []
      }
      secret_menu: {
        Row: {
          created_at: string
          crepe_items: Json | null
          crepe_special: string | null
          crepe_special_description: string | null
          crepe_special_image_url: string | null
          crepe_special_price: string | null
          crepe_special_video_url: string | null
          daily_code_seed: string | null
          galette_items: Json | null
          galette_special: string | null
          galette_special_description: string | null
          galette_special_image_url: string | null
          galette_special_price: string | null
          galette_special_video_url: string | null
          id: string
          is_active: boolean
          menu_name: string
          secret_code: string
          updated_at: string
          valid_from: string | null
          valid_to: string | null
          week_start: string
        }
        Insert: {
          created_at?: string
          crepe_items?: Json | null
          crepe_special?: string | null
          crepe_special_description?: string | null
          crepe_special_image_url?: string | null
          crepe_special_price?: string | null
          crepe_special_video_url?: string | null
          daily_code_seed?: string | null
          galette_items?: Json | null
          galette_special?: string | null
          galette_special_description?: string | null
          galette_special_image_url?: string | null
          galette_special_price?: string | null
          galette_special_video_url?: string | null
          id?: string
          is_active?: boolean
          menu_name?: string
          secret_code?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          week_start: string
        }
        Update: {
          created_at?: string
          crepe_items?: Json | null
          crepe_special?: string | null
          crepe_special_description?: string | null
          crepe_special_image_url?: string | null
          crepe_special_price?: string | null
          crepe_special_video_url?: string | null
          daily_code_seed?: string | null
          galette_items?: Json | null
          galette_special?: string | null
          galette_special_description?: string | null
          galette_special_image_url?: string | null
          galette_special_price?: string | null
          galette_special_video_url?: string | null
          id?: string
          is_active?: boolean
          menu_name?: string
          secret_code?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          week_start?: string
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
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
      carte_public_view: {
        Row: {
          crepe_items: Json | null
          galette_items: Json | null
          id: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      quiz_questions_public: {
        Row: {
          category: string | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          option_a: string | null
          option_b: string | null
          option_c: string | null
          option_d: string | null
          question: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          question?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          question?: string | null
        }
        Relationships: []
      }
      secret_menu_public: {
        Row: {
          created_at: string | null
          crepe_items: Json | null
          crepe_special: string | null
          crepe_special_description: string | null
          crepe_special_image_url: string | null
          crepe_special_price: string | null
          crepe_special_video_url: string | null
          galette_items: Json | null
          galette_special: string | null
          galette_special_description: string | null
          galette_special_image_url: string | null
          galette_special_price: string | null
          galette_special_video_url: string | null
          id: string | null
          is_active: boolean | null
          menu_name: string | null
          updated_at: string | null
          valid_from: string | null
          valid_to: string | null
          week_start: string | null
        }
        Insert: {
          created_at?: string | null
          crepe_items?: Json | null
          crepe_special?: string | null
          crepe_special_description?: string | null
          crepe_special_image_url?: string | null
          crepe_special_price?: string | null
          crepe_special_video_url?: string | null
          galette_items?: Json | null
          galette_special?: string | null
          galette_special_description?: string | null
          galette_special_image_url?: string | null
          galette_special_price?: string | null
          galette_special_video_url?: string | null
          id?: string | null
          is_active?: boolean | null
          menu_name?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_to?: string | null
          week_start?: string | null
        }
        Update: {
          created_at?: string | null
          crepe_items?: Json | null
          crepe_special?: string | null
          crepe_special_description?: string | null
          crepe_special_image_url?: string | null
          crepe_special_price?: string | null
          crepe_special_video_url?: string | null
          galette_items?: Json | null
          galette_special?: string | null
          galette_special_description?: string | null
          galette_special_image_url?: string | null
          galette_special_price?: string | null
          galette_special_video_url?: string | null
          id?: string | null
          is_active?: boolean | null
          menu_name?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_to?: string | null
          week_start?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_loyalty_points: {
        Args: { p_points: number; p_user_id: string }
        Returns: number
      }
      claim_prize: {
        Args: { p_prize_type: string; p_week_start: string }
        Returns: boolean
      }
      ensure_secret_menu: { Args: never; Returns: string }
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
      generate_access_token: { Args: never; Returns: string }
      generate_prize_code: { Args: never; Returns: string }
      get_current_week_start: { Args: never; Returns: string }
      get_daily_code: {
        Args: { p_date?: string; p_secret_code: string }
        Returns: string
      }
      grant_secret_access: {
        Args: {
          p_email: string
          p_first_name: string
          p_phone: string
          p_secret_code: string
          p_week_start: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      unlock_secret_menu_for_user: {
        Args: { p_secret_code: string; p_user_id: string }
        Returns: boolean
      }
      verify_secret_access: { Args: { p_token: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
