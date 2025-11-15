import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          created_at?: string;
        };
      };
      client_profiles: {
        Row: {
          id: string;
          user_id: string;
          training_experience: string | null;
          goals: string[] | null;
          sessions_per_week: string | null;
          chronic_diseases: string[] | null;
          injuries: string[] | null;
          weight_goal: string | null;
          overview: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          training_experience?: string | null;
          goals?: string[] | null;
          sessions_per_week?: string | null;
          chronic_diseases?: string[] | null;
          injuries?: string[] | null;
          weight_goal?: string | null;
          overview?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          training_experience?: string | null;
          goals?: string[] | null;
          sessions_per_week?: string | null;
          chronic_diseases?: string[] | null;
          injuries?: string[] | null;
          weight_goal?: string | null;
          overview?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      experts: {
        Row: {
          id: number;
          name: string;
          specialty: string | null;
          certifications: string | null;
          years_experience: number | null;
          overview: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          specialty?: string | null;
          certifications?: string | null;
          years_experience?: number | null;
          overview?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          specialty?: string | null;
          certifications?: string | null;
          years_experience?: number | null;
          overview?: string | null;
          created_at?: string;
        };
      };
      match_results: {
        Row: {
          id: string;
          client_profile_id: string;
          expert_id: number;
          match_score: number;
          reason_1: string | null;
          reason_2: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_profile_id: string;
          expert_id: number;
          match_score: number;
          reason_1?: string | null;
          reason_2?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_profile_id?: string;
          expert_id?: number;
          match_score?: number;
          reason_1?: string | null;
          reason_2?: string | null;
          created_at?: string;
        };
      };
      selected_trainers: {
        Row: {
          id: string;
          client_profile_id: string;
          expert_id: number;
          selected_at: string;
        };
        Insert: {
          id?: string;
          client_profile_id: string;
          expert_id: number;
          selected_at?: string;
        };
        Update: {
          id?: string;
          client_profile_id?: string;
          expert_id?: number;
          selected_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          client_profile_id: string;
          expert_id: number;
          sender: 'client' | 'expert';
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_profile_id: string;
          expert_id: number;
          sender: 'client' | 'expert';
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_profile_id?: string;
          expert_id?: number;
          sender?: 'client' | 'expert';
          content?: string;
          created_at?: string;
        };
      };
    };
  };
};
