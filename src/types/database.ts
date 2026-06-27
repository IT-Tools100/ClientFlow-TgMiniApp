export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          telegram_id: string | null;
          username: string | null;
          first_name: string | null;
          last_name: string | null;
          language_code: string | null;
          photo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          telegram_id?: string | null;
          username?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          language_code?: string | null;
          photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          telegram_id?: string | null;
          username?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          language_code?: string | null;
          photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          contact: string | null;
          source: string | null;
          status: string;
          value: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          contact?: string | null;
          source?: string | null;
          status?: string;
          value?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          contact?: string | null;
          source?: string | null;
          status?: string;
          value?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          client_id: string | null;
          title: string;
          description: string | null;
          due_date: string | null;
          status: string;
          priority: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id?: string | null;
          title: string;
          description?: string | null;
          due_date?: string | null;
          status?: string;
          priority?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          client_id?: string | null;
          title?: string;
          description?: string | null;
          due_date?: string | null;
          status?: string;
          priority?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      deals: {
        Row: {
          id: string;
          user_id: string;
          client_id: string | null;
          title: string;
          amount: number;
          status: string;
          probability: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id?: string | null;
          title: string;
          amount?: number;
          status?: string;
          probability?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          client_id?: string | null;
          title?: string;
          amount?: number;
          status?: string;
          probability?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      activities: {
        Row: {
          id: string;
          user_id: string;
          client_id: string | null;
          type: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id?: string | null;
          type: string;
          description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          client_id?: string | null;
          type?: string;
          description?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
export type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
export type DealRow = Database["public"]["Tables"]["deals"]["Row"];
export type ActivityRow = Database["public"]["Tables"]["activities"]["Row"];
