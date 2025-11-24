export interface Expert {
  id: number;
  name: string;
  image: string;
  specialization: string;
  certifications: string;
  years_of_experience: number | string;
  client_reviews: string;
  client_ratings: number;
  monthly_budget: string;
  availability: string;
  cooperation: string;
  overview: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExpertWithMatchStatus extends Expert {
  matchStatus: 'pending' | 'calculating-score' | 'score-complete' | 'calculating-reasons' | 'complete';
  match_score?: number;
  reason1?: string;
  reason2?: string;
  scoreLoadingProgress?: number;
  reasonsLoading?: boolean;
}

import { supabase } from '../lib/supabase';

export async function getExpertById(id: number): Promise<Expert | null> {
  const { data, error } = await supabase
    .from('experts')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching expert:', error);
    return null;
  }

  return data;
}

export async function getAllExperts(): Promise<Expert[]> {
  const { data, error } = await supabase
    .from('experts')
    .select('*')
    .order('id');

  if (error) {
    console.error('Error fetching experts:', error);
    return [];
  }

  return data || [];
}
