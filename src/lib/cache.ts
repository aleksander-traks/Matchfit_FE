import { supabase } from './supabase';

async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function createProfileKey(data: {
  training_experience: string;
  goals: string[];
  sessions_per_week: string;
  chronic_diseases: string[];
  injuries: string[];
  weight_goal: string;
}): string {
  const normalized = {
    training_experience: data.training_experience.toLowerCase().trim(),
    goals: [...data.goals].sort().map(g => g.toLowerCase().trim()),
    sessions_per_week: data.sessions_per_week.toLowerCase().trim(),
    chronic_diseases: [...(data.chronic_diseases || [])].sort().map(c => c.toLowerCase().trim()),
    injuries: [...(data.injuries || [])].sort().map(i => i.toLowerCase().trim()),
    weight_goal: data.weight_goal.toLowerCase().trim(),
  };

  return JSON.stringify(normalized);
}

export async function getCachedOverview(profileKey: string): Promise<string | null> {
  try {
    const hash = await generateHash(profileKey);

    const { data, error } = await supabase
      .from('overview_cache')
      .select('overview, id')
      .eq('profile_hash', hash)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .maybeSingle();

    if (error) {
      console.error('Error fetching cached overview:', error);
      return null;
    }

    if (data) {
      await supabase
        .from('overview_cache')
        .update({
          hit_count: supabase.sql`hit_count + 1`,
          last_accessed_at: new Date().toISOString(),
        })
        .eq('id', data.id);

      console.log('Cache hit: returning cached overview');
      return data.overview;
    }

    console.log('Cache miss: no cached overview found');
    return null;
  } catch (error) {
    console.error('Error in getCachedOverview:', error);
    return null;
  }
}

export async function setCachedOverview(profileKey: string, overview: string): Promise<void> {
  try {
    const hash = await generateHash(profileKey);

    await supabase
      .from('overview_cache')
      .upsert({
        profile_hash: hash,
        overview,
        hit_count: 0,
        created_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
      }, {
        onConflict: 'profile_hash'
      });

    console.log('Overview cached successfully');
  } catch (error) {
    console.error('Error caching overview:', error);
  }
}

export async function getCachedMatches(overview: string, expertIds: number[]): Promise<Map<number, any> | null> {
  try {
    const hash = await generateHash(overview);

    const { data, error } = await supabase
      .from('match_cache')
      .select('*')
      .eq('overview_hash', hash)
      .in('expert_id', expertIds)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('Error fetching cached matches:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.log('Cache miss: no cached matches found');
      return null;
    }

    if (data.length === expertIds.length) {
      console.log(`Cache hit: found ${data.length} cached matches`);
      const matchMap = new Map();
      data.forEach(match => {
        matchMap.set(match.expert_id, {
          expert_id: match.expert_id,
          match_score: match.match_score,
          reason1: match.reason_1,
          reason2: match.reason_2,
        });
      });
      return matchMap;
    }

    console.log(`Partial cache hit: found ${data.length}/${expertIds.length} matches`);
    return null;
  } catch (error) {
    console.error('Error in getCachedMatches:', error);
    return null;
  }
}

export async function setCachedMatches(overview: string, matches: Array<{
  expert_id: number;
  match_score: number;
  reason1: string;
  reason2: string;
}>): Promise<void> {
  try {
    const hash = await generateHash(overview);

    const cacheEntries = matches.map(match => ({
      overview_hash: hash,
      expert_id: match.expert_id,
      match_score: match.match_score,
      reason_1: match.reason1,
      reason_2: match.reason2,
      created_at: new Date().toISOString(),
    }));

    await supabase
      .from('match_cache')
      .upsert(cacheEntries, {
        onConflict: 'overview_hash,expert_id'
      });

    console.log(`Cached ${matches.length} match results`);
  } catch (error) {
    console.error('Error caching matches:', error);
  }
}
