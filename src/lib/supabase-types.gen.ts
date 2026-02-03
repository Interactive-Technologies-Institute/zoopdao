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
      cards: {
        Row: {
          character_category: string[]
          hero_steps: number[]
          id: number
          title: string | null
          type: Database["public"]["Enums"]["stop_type"]
        }
        Insert: {
          character_category?: string[]
          hero_steps?: number[]
          id?: number
          title?: string | null
          type: Database["public"]["Enums"]["stop_type"]
        }
        Update: {
          character_category?: string[]
          hero_steps?: number[]
          id?: number
          title?: string | null
          type?: Database["public"]["Enums"]["stop_type"]
        }
        Relationships: []
      }
      discussion_messages: {
        Row: {
          agent_role: Database["public"]["Enums"]["agent_role_type"] | null
          content: string
          created_at: string
          game_id: number
          id: number
          metadata: Json | null
          participant_id: number | null
          participant_type: Database["public"]["Enums"]["participant_type"]
          proposal_id: number | null
          round: number
          turn_index: number | null
        }
        Insert: {
          agent_role?: Database["public"]["Enums"]["agent_role_type"] | null
          content: string
          created_at?: string
          game_id: number
          id?: number
          metadata?: Json | null
          participant_id?: number | null
          participant_type: Database["public"]["Enums"]["participant_type"]
          proposal_id?: number | null
          round: number
          turn_index?: number | null
        }
        Update: {
          agent_role?: Database["public"]["Enums"]["agent_role_type"] | null
          content?: string
          created_at?: string
          game_id?: number
          id?: number
          metadata?: Json | null
          participant_id?: number | null
          participant_type?: Database["public"]["Enums"]["participant_type"]
          proposal_id?: number | null
          round?: number
          turn_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "discussion_messages_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_messages_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_messages_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          document_id: number
          embedding: string | null
          id: number
          metadata: Json
          proposal_id: number
          round: number
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          document_id: number
          embedding?: string | null
          id?: number
          metadata?: Json
          proposal_id: number
          round: number
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          document_id?: number
          embedding?: string | null
          id?: number
          metadata?: Json
          proposal_id?: number
          round?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chunks_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          filename: string
          id: number
          metadata: Json
          mime_type: string | null
          proposal_id: number
          round: number
          size_bytes: number | null
          storage_path: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          filename: string
          id?: number
          metadata?: Json
          mime_type?: string | null
          proposal_id: number
          round: number
          size_bytes?: number | null
          storage_path: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          filename?: string
          id?: number
          metadata?: Json
          mime_type?: string | null
          proposal_id?: number
          round?: number
          size_bytes?: number | null
          storage_path?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      game_rounds: {
        Row: {
          game_id: number
          id: number
          round: number
          timer_duration: number | null
        }
        Insert: {
          game_id: number
          id?: number
          round: number
          timer_duration?: number | null
        }
        Update: {
          game_id?: number
          id?: number
          round?: number
          timer_duration?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_rounds_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          code: string
          id: number
          inserted_at: string
          mode: Database["public"]["Enums"]["game_mode"] | null
          pedagogic_final_timer_minutes: number
          pedagogic_rounds_timer_minutes: number
          proposal_id: number | null
          state: Database["public"]["Enums"]["game_state"]
        }
        Insert: {
          code: string
          id?: number
          inserted_at?: string
          mode?: Database["public"]["Enums"]["game_mode"] | null
          pedagogic_final_timer_minutes?: number
          pedagogic_rounds_timer_minutes?: number
          proposal_id?: number | null
          state?: Database["public"]["Enums"]["game_state"]
        }
        Update: {
          code?: string
          id?: number
          inserted_at?: string
          mode?: Database["public"]["Enums"]["game_mode"] | null
          pedagogic_final_timer_minutes?: number
          pedagogic_rounds_timer_minutes?: number
          proposal_id?: number | null
          state?: Database["public"]["Enums"]["game_state"]
        }
        Relationships: [
          {
            foreignKeyName: "games_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      player_answers: {
        Row: {
          answer: string
          game_id: number
          id: number
          player_id: number
          round: number
        }
        Insert: {
          answer: string
          game_id: number
          id?: number
          player_id: number
          round: number
        }
        Update: {
          answer?: string
          game_id?: number
          id?: number
          player_id?: number
          round?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_answers_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_answers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_cards: {
        Row: {
          card_id: number
          game_id: number
          id: number
          player_id: number
          round: number
        }
        Insert: {
          card_id: number
          game_id: number
          id?: number
          player_id: number
          round: number
        }
        Update: {
          card_id?: number
          game_id?: number
          id?: number
          player_id?: number
          round?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_cards_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_cards_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          description: string | null
          game_id: number
          id: number
          inserted_at: string
          is_active: boolean | null
          is_owner: boolean
          last_active: string | null
          nickname: string | null
          role: Database["public"]["Enums"]["role_type"] | null
          user_id: string
        }
        Insert: {
          description?: string | null
          game_id: number
          id?: number
          inserted_at?: string
          is_active?: boolean | null
          is_owner?: boolean
          last_active?: string | null
          nickname?: string | null
          role?: Database["public"]["Enums"]["role_type"] | null
          user_id: string
        }
        Update: {
          description?: string | null
          game_id?: number
          id?: number
          inserted_at?: string
          is_active?: boolean | null
          is_owner?: boolean
          last_active?: string | null
          nickname?: string | null
          role?: Database["public"]["Enums"]["role_type"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_text: {
        Row: {
          card_id: number
          created_at: string
          id: number
          lang: string
          text: string
        }
        Insert: {
          card_id?: number
          created_at?: string
          id?: number
          lang?: string
          text?: string
        }
        Update: {
          card_id?: number
          created_at?: string
          id?: number
          lang?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_text_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_votes: {
        Row: {
          choice: string
          context: string
          created_at: string
          id: string
          proposal_id: number
          user_id: string
        }
        Insert: {
          choice: string
          context: string
          created_at?: string
          id?: string
          proposal_id: number
          user_id: string
        }
        Update: {
          choice?: string
          context?: string
          created_at?: string
          id?: string
          proposal_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_votes_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          created_at: string
          functionalities: string
          id: number
          language: string
          objectives: Json
          title: string
          user_id: string | null
          voting_period_id: string
        }
        Insert: {
          created_at?: string
          functionalities: string
          id?: number
          language?: string
          objectives: Json
          title: string
          user_id?: string | null
          voting_period_id: string
        }
        Update: {
          created_at?: string
          functionalities?: string
          id?: number
          language?: string
          objectives?: Json
          title?: string
          user_id?: string | null
          voting_period_id?: string
        }
        Relationships: []
      }
      rounds: {
        Row: {
          description: string
          id: number
          index: number
          title: string
        }
        Insert: {
          description: string
          id?: number
          index: number
          title: string
        }
        Update: {
          description?: string
          id?: number
          index?: number
          title?: string
        }
        Relationships: []
      }
      saved_discussions: {
        Row: {
          card_types: string[]
          character: Json
          character_search: unknown
          created_at: string
          discussion_mode: string | null
          discussion_id: string
          discussion_title: string
          full_discussion: string
          id: number
          player_name: string
          proposal_id: number | null
          public_discussion: boolean | null
          rounds: Json
          vote: string | null
        }
        Insert: {
          card_types?: string[]
          character: Json
          character_search?: unknown
          created_at?: string
          discussion_mode?: string | null
          discussion_id?: string
          discussion_title: string
          full_discussion: string
          id?: number
          player_name: string
          proposal_id?: number | null
          public_discussion?: boolean | null
          rounds: Json
          vote?: string | null
        }
        Update: {
          card_types?: string[]
          character?: Json
          character_search?: unknown
          created_at?: string
          discussion_mode?: string | null
          discussion_id?: string
          discussion_title?: string
          full_discussion?: string
          id?: number
          player_name?: string
          proposal_id?: number | null
          public_discussion?: boolean | null
          rounds?: Json
          vote?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_stories_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_all_players_ready: {
        Args: { p_game_id: number }
        Returns: undefined
      }
      check_round_completion: {
        Args: { p_game_id: number }
        Returns: undefined
      }
      create_game:
        | {
            Args: never
            Returns: Database["public"]["CompositeTypes"]["create_game_result"]
            SetofOptions: {
              from: "*"
              to: "create_game_result"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { p_proposal_id?: number }
            Returns: Database["public"]["CompositeTypes"]["create_game_result"]
            SetofOptions: {
              from: "*"
              to: "create_game_result"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              p_mode?: Database["public"]["Enums"]["game_mode"]
              p_proposal_id?: number
            }
            Returns: Database["public"]["CompositeTypes"]["create_game_result"]
            SetofOptions: {
              from: "*"
              to: "create_game_result"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      generate_story_id: { Args: never; Returns: string }
      join_game: { Args: { game_code: string }; Returns: undefined }
      mark_player_inactive_by_user: {
        Args: { game_code: string; p_user_id: string }
        Returns: undefined
      }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      player_answer: {
        Args: { answer: string; game_code: string; game_round: number }
        Returns: undefined
      }
      player_move: {
        Args: {
          game_code: string
          game_round: number
          p_character_category: string
          p_hero_step: number
          stop_id: number
        }
        Returns: number
      }
      player_next_discussion: {
        Args: {
          game_code: string
          game_round: number
          p_character_category: string
          p_hero_step: number
        }
        Returns: number
      }
      player_start_discussion: {
        Args: { game_code: string }
        Returns: undefined
      }
      roll_dice: { Args: { p_game_id: number }; Returns: number }
      save_discussion:
        | {
            Args: {
              p_card_types: string[]
              p_character: Json
              p_discussion_title: string
              p_discussion_mode?: string
              p_full_discussion: string
              p_player_name: string
              p_proposal_id?: number
              p_rounds: Json
              p_vote?: string
            }
            Returns: string
          }
        | {
            Args: {
              p_character: Json
              p_discussion_title: string
              p_discussion_mode?: string
              p_player_name: string
              p_proposal_id?: number
              p_rounds: Json
              p_vote?: string
            }
            Returns: string
          }
        | {
            Args: {
              p_card_types: string[]
              p_character: Json
              p_full_story: string
              p_player_name: string
              p_rounds: Json
              p_story_title: string
              p_vote?: string
            }
            Returns: string
          }
        | {
            Args: {
              p_character: Json
              p_player_name: string
              p_rounds: Json
              p_story_title: string
              p_vote?: string
            }
            Returns: string
          }
      start_game: { Args: { game_code: string }; Returns: undefined }
      update_player_activity: {
        Args: { game_code: string }
        Returns: undefined
      }
      update_player_character: {
        Args: {
          game_code: string
          player_character: Database["public"]["Enums"]["character_type"]
        }
        Returns: undefined
      }
      update_player_nickname_description: {
        Args: {
          game_code: string
          player_description: string
          player_nickname: string
        }
        Returns: undefined
      }
      update_player_role: {
        Args: {
          game_code: string
          player_role: Database["public"]["Enums"]["role_type"]
        }
        Returns: undefined
      }
    }
    Enums: {
      agent_role_type:
        | "administration"
        | "research"
        | "reception"
        | "operations"
        | "bar"
        | "cleaning"
      character_category: "human" | "non-human"
      character_type:
        | "administrator"
        | "research"
        | "reception"
        | "operations"
        | "bar"
        | "cleaning"
        | "trocaz-pigeon"
        | "monk-seal"
        | "vulcanic-rock"
        | "iberian-green-frog"
        | "zinos-petrel"
        | "water"
      game_mode: "pedagogic" | "decision_making"
      game_state: "waiting" | "ready" | "starting" | "playing" | "finished"
      participant_type: "human" | "ai_agent"
      role_type:
        | "administration"
        | "research"
        | "reception"
        | "operations"
        | "bar"
        | "cleaning"
      stop_type: "nature" | "sense" | "action" | "history" | "landmark"
    }
    CompositeTypes: {
      create_game_result: {
        game_id: number | null
        game_code: string | null
      }
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
      agent_role_type: [
        "administration",
        "research",
        "reception",
        "operations",
        "bar",
        "cleaning",
      ],
      character_category: ["human", "non-human"],
      character_type: [
        "administrator",
        "research",
        "reception",
        "operations",
        "bar",
        "cleaning",
        "trocaz-pigeon",
        "monk-seal",
        "vulcanic-rock",
        "iberian-green-frog",
        "zinos-petrel",
        "water",
      ],
      game_mode: ["pedagogic", "decision_making"],
      game_state: ["waiting", "ready", "starting", "playing", "finished"],
      participant_type: ["human", "ai_agent"],
      role_type: [
        "administration",
        "research",
        "reception",
        "operations",
        "bar",
        "cleaning",
      ],
      stop_type: ["nature", "sense", "action", "history", "landmark"],
    },
  },
} as const
