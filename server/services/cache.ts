import crypto from 'crypto';
import { supabase } from '../config/supabase';
import type { ClientIntakeData, MatchResult } from './openai';

export function generateCacheKey(data: ClientIntakeData): string {
  const normalized = {
    training_experience: data.training_experience,
    goals: data.goals.sort(),
    sessions_per_week: data.sessions_per_week,
    chronic_diseases: data.chronic_diseases.sort(),
    injuries: data.injuries.sort(),
    weight_goal: data.weight_goal,
  };

  const str = JSON.stringify(normalized);
  return crypto.createHash('md5').update(str).digest('hex');
}

export function generateOverviewHash(overview: string): string {
  return crypto.createHash('md5').update(overview.trim()).digest('hex');
}

export async function getCachedOverview(cacheKey: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('overview_cache')
      .select('overview_text')
      .eq('cache_key', cacheKey)
      .maybeSingle();

    if (error) {
      console.error('Error fetching cached overview:', error);
      return null;
    }

    return data?.overview_text || null;
  } catch (error) {
    console.error('Error in getCachedOverview:', error);
    return null;
  }
}

export async function setCachedOverview(
  cacheKey: string,
  clientData: ClientIntakeData,
  overviewText: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('overview_cache')
      .upsert({
        cache_key: cacheKey,
        client_data: clientData,
        overview_text: overviewText,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'cache_key',
      });

    if (error) {
      console.error('Error caching overview:', error);
    }
  } catch (error) {
    console.error('Error in setCachedOverview:', error);
  }
}

export async function getCachedMatches(overviewHash: string): Promise<MatchResult[] | null> {
  try {
    const { data, error } = await supabase
      .from('match_cache')
      .select('expert_id, match_score, reason_1, reason_2')
      .eq('overview_hash', overviewHash)
      .order('match_score', { ascending: false });

    if (error) {
      console.error('Error fetching cached matches:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data.map(item => ({
      expert_id: item.expert_id,
      match_score: Number(item.match_score),
      reason_1: item.reason_1 || '',
      reason_2: item.reason_2 || '',
    }));
  } catch (error) {
    console.error('Error in getCachedMatches:', error);
    return null;
  }
}

export async function setCachedMatch(
  overviewHash: string,
  matchResult: MatchResult
): Promise<void> {
  try {
    const { error } = await supabase
      .from('match_cache')
      .upsert({
        overview_hash: overviewHash,
        expert_id: matchResult.expert_id,
        match_score: matchResult.match_score,
        reason_1: matchResult.reason_1,
        reason_2: matchResult.reason_2,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'overview_hash,expert_id',
      });

    if (error) {
      console.error('Error caching match:', error);
    }
  } catch (error) {
    console.error('Error in setCachedMatch:', error);
  }
}

export async function setCachedMatches(
  overviewHash: string,
  matches: MatchResult[]
): Promise<void> {
  try {
    const records = matches.map(match => ({
      overview_hash: overviewHash,
      expert_id: match.expert_id,
      match_score: match.match_score,
      reason_1: match.reason_1,
      reason_2: match.reason_2,
      created_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('match_cache')
      .upsert(records, {
        onConflict: 'overview_hash,expert_id',
      });

    if (error) {
      console.error('Error caching matches:', error);
    }
  } catch (error) {
    console.error('Error in setCachedMatches:', error);
  }
}

export async function invalidateMatchCache(overviewHash: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('match_cache')
      .delete()
      .eq('overview_hash', overviewHash);

    if (error) {
      console.error('Error invalidating match cache:', error);
    }
  } catch (error) {
    console.error('Error in invalidateMatchCache:', error);
  }
}

export async function cleanupOldCache(daysOld: number = 7): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { error: overviewError } = await supabase
      .from('overview_cache')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    const { error: matchError } = await supabase
      .from('match_cache')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (overviewError) {
      console.error('Error cleaning overview cache:', overviewError);
    }
    if (matchError) {
      console.error('Error cleaning match cache:', matchError);
    }
  } catch (error) {
    console.error('Error in cleanupOldCache:', error);
  }
}
