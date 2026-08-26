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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          address: string | null
          annual_revenue: string | null
          application: string
          company_name: string
          company_type: string
          country: string
          created_at: string
          description: string | null
          employee_range: string | null
          fit: number
          founded: number | null
          headquarters: string | null
          id: string
          patents_count: number | null
          projects_count: number | null
          publications_count: number | null
          sector: string
          state: string
          website: string | null
        }
        Insert: {
          address?: string | null
          annual_revenue?: string | null
          application: string
          company_name: string
          company_type: string
          country: string
          created_at?: string
          description?: string | null
          employee_range?: string | null
          fit: number
          founded?: number | null
          headquarters?: string | null
          id?: string
          patents_count?: number | null
          projects_count?: number | null
          publications_count?: number | null
          sector: string
          state: string
          website?: string | null
        }
        Update: {
          address?: string | null
          annual_revenue?: string | null
          application?: string
          company_name?: string
          company_type?: string
          country?: string
          created_at?: string
          description?: string | null
          employee_range?: string | null
          fit?: number
          founded?: number | null
          headquarters?: string | null
          id?: string
          patents_count?: number | null
          projects_count?: number | null
          publications_count?: number | null
          sector?: string
          state?: string
          website?: string | null
        }
        Relationships: []
      }
      pathway_chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          pathway_id: string
          user_id: string
          user_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          pathway_id: string
          user_id: string
          user_name: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          pathway_id?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      pathway_user_inputs: {
        Row: {
          category: string | null
          confidence_level: string | null
          content: string | null
          created_at: string
          decision_date: string | null
          file_name: string | null
          file_url: string | null
          id: string
          pathway_id: string
          rating: string | null
          responsible_person: string | null
          review_date: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          confidence_level?: string | null
          content?: string | null
          created_at?: string
          decision_date?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          pathway_id: string
          rating?: string | null
          responsible_person?: string | null
          review_date?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          category?: string | null
          confidence_level?: string | null
          content?: string | null
          created_at?: string
          decision_date?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          pathway_id?: string
          rating?: string | null
          responsible_person?: string | null
          review_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          category: string | null
          created_at: string
          goal: string
          id: string
          name: string
          owner: string
          pathways: Json
          status: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          goal: string
          id?: string
          name: string
          owner: string
          pathways?: Json
          status?: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          goal?: string
          id?: string
          name?: string
          owner?: string
          pathways?: Json
          status?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_companies: {
        Row: {
          category: string | null
          company_name: string
          country: string | null
          created_at: string
          feedstock: string | null
          id: string
          notes: string | null
          sector: string | null
          size: string | null
          tag: string | null
          topic_key: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          company_name: string
          country?: string | null
          created_at?: string
          feedstock?: string | null
          id?: string
          notes?: string | null
          sector?: string | null
          size?: string | null
          tag?: string | null
          topic_key?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          category?: string | null
          company_name?: string
          country?: string | null
          created_at?: string
          feedstock?: string | null
          id?: string
          notes?: string | null
          sector?: string | null
          size?: string | null
          tag?: string | null
          topic_key?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      topic_comment_replies: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          message: string
          user_id: string
          user_name: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          message: string
          user_id: string
          user_name: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          message?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_comment_replies_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "topic_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_comments: {
        Row: {
          analysis_context: string
          created_at: string
          due_date: string | null
          function_tag: string
          id: string
          message: string
          owner: string
          page_path: string
          priority: string
          resolved: boolean
          title: string
          topic_key: string
          user_id: string
          user_name: string
          x_percent: number
          y_percent: number
        }
        Insert: {
          analysis_context?: string
          created_at?: string
          due_date?: string | null
          function_tag?: string
          id?: string
          message: string
          owner?: string
          page_path: string
          priority?: string
          resolved?: boolean
          title?: string
          topic_key: string
          user_id: string
          user_name: string
          x_percent: number
          y_percent: number
        }
        Update: {
          analysis_context?: string
          created_at?: string
          due_date?: string | null
          function_tag?: string
          id?: string
          message?: string
          owner?: string
          page_path?: string
          priority?: string
          resolved?: boolean
          title?: string
          topic_key?: string
          user_id?: string
          user_name?: string
          x_percent?: number
          y_percent?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
