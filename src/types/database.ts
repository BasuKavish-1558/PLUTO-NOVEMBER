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
    PostgrestVersion: "14.18"
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
      body_vitals: {
        Row: {
          created_at: string
          id: string
          local_date: string
          measured_at: string
          updated_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          id?: string
          local_date: string
          measured_at?: string
          updated_at?: string
          user_id?: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          id?: string
          local_date?: string
          measured_at?: string
          updated_at?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          id: string
          payload: Json
          received_at: string
          type: string
          user_id: string
        }
        Insert: {
          created_at: string
          id?: string
          payload?: Json
          received_at?: string
          type: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          received_at?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          archived_at: string | null
          created_at: string
          equipment: string
          id: string
          is_custom: boolean | null
          muscle_group_id: number
          name: string
          secondary_muscle_group_ids: number[]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          equipment: string
          id?: string
          is_custom?: boolean | null
          muscle_group_id: number
          name: string
          secondary_muscle_group_ids?: number[]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          equipment?: string
          id?: string
          is_custom?: boolean | null
          muscle_group_id?: number
          name?: string
          secondary_muscle_group_ids?: number[]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_muscle_group_id_fkey"
            columns: ["muscle_group_id"]
            isOneToOne: false
            referencedRelation: "muscle_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      muscle_groups: {
        Row: {
          id: number
          name: string
          slug: string
        }
        Insert: {
          id: number
          name: string
          slug: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
        }
        Relationships: []
      }
      nutrition_entries: {
        Row: {
          amount: number
          created_at: string
          id: string
          label: string | null
          local_date: string
          nutrient: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          label?: string | null
          local_date: string
          nutrient: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          label?: string | null
          local_date?: string
          nutrient?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nutrition_goals: {
        Row: {
          basis: string
          created_at: string
          effective_from: string
          goal_type: string | null
          id: string
          multiplier: number | null
          nutrient: string
          target: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          basis: string
          created_at?: string
          effective_from: string
          goal_type?: string | null
          id?: string
          multiplier?: number | null
          nutrient: string
          target?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          basis?: string
          created_at?: string
          effective_from?: string
          goal_type?: string | null
          id?: string
          multiplier?: number | null
          nutrient?: string
          target?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      personal_records: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          local_date: string
          note: string | null
          photo_path: string | null
          reps: number
          type: string
          updated_at: string
          user_id: string
          weight_kg: number
          workout_id: string | null
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          local_date: string
          note?: string | null
          photo_path?: string | null
          reps: number
          type: string
          updated_at?: string
          user_id?: string
          weight_kg: number
          workout_id?: string | null
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          local_date?: string
          note?: string | null
          photo_path?: string | null
          reps?: number
          type?: string
          updated_at?: string
          user_id?: string
          weight_kg?: number
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_records_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_records_workout_id_user_id_fkey"
            columns: ["workout_id", "user_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_split_id: string | null
          age: number | null
          avatar_path: string | null
          background: string
          created_at: string
          height_cm: number | null
          id: string
          length_unit: string
          name: string
          onboarded_at: string | null
          show_bmi: boolean
          theme_pref: string
          updated_at: string
          weight_unit: string
        }
        Insert: {
          active_split_id?: string | null
          age?: number | null
          avatar_path?: string | null
          background?: string
          created_at?: string
          height_cm?: number | null
          id: string
          length_unit?: string
          name?: string
          onboarded_at?: string | null
          show_bmi?: boolean
          theme_pref?: string
          updated_at?: string
          weight_unit?: string
        }
        Update: {
          active_split_id?: string | null
          age?: number | null
          avatar_path?: string | null
          background?: string
          created_at?: string
          height_cm?: number | null
          id?: string
          length_unit?: string
          name?: string
          onboarded_at?: string | null
          show_bmi?: boolean
          theme_pref?: string
          updated_at?: string
          weight_unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_split_fk"
            columns: ["active_split_id", "id"]
            isOneToOne: false
            referencedRelation: "splits"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      set_logs: {
        Row: {
          created_at: string
          id: string
          is_warmup: boolean
          reps: number
          set_number: number
          updated_at: string
          user_id: string
          weight_kg: number
          workout_exercise_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_warmup?: boolean
          reps: number
          set_number: number
          updated_at?: string
          user_id?: string
          weight_kg?: number
          workout_exercise_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_warmup?: boolean
          reps?: number
          set_number?: number
          updated_at?: string
          user_id?: string
          weight_kg?: number
          workout_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "set_logs_workout_exercise_id_user_id_fkey"
            columns: ["workout_exercise_id", "user_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      split_day_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          position: number
          split_day_id: string
          target_reps_max: number | null
          target_reps_min: number | null
          target_sets: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          position: number
          split_day_id: string
          target_reps_max?: number | null
          target_reps_min?: number | null
          target_sets?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          position?: number
          split_day_id?: string
          target_reps_max?: number | null
          target_reps_min?: number | null
          target_sets?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "split_day_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "split_day_exercises_split_day_id_user_id_fkey"
            columns: ["split_day_id", "user_id"]
            isOneToOne: false
            referencedRelation: "split_days"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      split_days: {
        Row: {
          created_at: string
          id: string
          is_rest: boolean
          label: string
          split_id: string
          updated_at: string
          user_id: string
          weekday: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_rest?: boolean
          label?: string
          split_id: string
          updated_at?: string
          user_id?: string
          weekday: number
        }
        Update: {
          created_at?: string
          id?: string
          is_rest?: boolean
          label?: string
          split_id?: string
          updated_at?: string
          user_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "split_days_split_id_user_id_fkey"
            columns: ["split_id", "user_id"]
            isOneToOne: false
            referencedRelation: "splits"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      splits: {
        Row: {
          created_at: string
          id: string
          name: string
          source_preset: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          source_preset?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          source_preset?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sync_tombstones: {
        Row: {
          deleted_at: string
          id: number
          row_id: string
          table_name: string
          user_id: string
        }
        Insert: {
          deleted_at?: string
          id?: never
          row_id: string
          table_name: string
          user_id: string
        }
        Update: {
          deleted_at?: string
          id?: never
          row_id?: string
          table_name?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          position: number
          updated_at: string
          user_id: string
          workout_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          position: number
          updated_at?: string
          user_id?: string
          workout_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          position?: number
          updated_at?: string
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_user_id_fkey"
            columns: ["workout_id", "user_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      workout_photos: {
        Row: {
          created_at: string
          id: string
          local_date: string
          storage_path: string
          updated_at: string
          user_id: string
          workout_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          local_date: string
          storage_path: string
          updated_at?: string
          user_id?: string
          workout_id: string
        }
        Update: {
          created_at?: string
          id?: string
          local_date?: string
          storage_path?: string
          updated_at?: string
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_photos_workout_id_user_id_fkey"
            columns: ["workout_id", "user_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string
          duration_seconds: number
          ended_at: string
          id: string
          local_date: string
          notes: string | null
          split_day_id: string | null
          started_at: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds: number
          ended_at: string
          id?: string
          local_date: string
          notes?: string | null
          split_day_id?: string | null
          started_at: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          ended_at?: string
          id?: string
          local_date?: string
          notes?: string | null
          split_day_id?: string | null
          started_at?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_split_day_id_user_id_fkey"
            columns: ["split_day_id", "user_id"]
            isOneToOne: false
            referencedRelation: "split_days"
            referencedColumns: ["id", "user_id"]
          },
        ]
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
