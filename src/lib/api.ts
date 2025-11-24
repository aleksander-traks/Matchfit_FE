import { supabase } from './supabase';
import { getExpertById } from '../data/expertsData';
import { generateDummyRecommendations } from './recommendations';
import {
  createProfileKey,
  getCachedOverview,
  setCachedOverview,
  getCachedMatches,
  setCachedMatches,
} from './cache';
import { generateClientOverview } from './openai/generateOverview';
import {
  matchExpertsWithStreaming,
  type StreamingMatchCallbacks,
} from './openai/matchExperts';

class ApiClient {
  async saveIntake(data: {
    training_experience: string;
    goals: string[];
    sessions_per_week: string;
    chronic_diseases: string[];
    injuries: string[];
    weight_goal: string;
    overview?: string;
    profileId?: string;
  }) {
    if (data.profileId) {
      const { data: profile, error } = await supabase
        .from('client_profiles')
        .update({
          training_experience: data.training_experience,
          goals: data.goals,
          sessions_per_week: data.sessions_per_week,
          chronic_diseases: data.chronic_diseases,
          injuries: data.injuries,
          weight_goal: data.weight_goal,
          overview: data.overview ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.profileId)
        .select()
        .single();

      if (error) throw error;
      return profile;
    } else {
      const { data: profile, error } = await supabase
        .from('client_profiles')
        .insert({
          user_id: null,
          training_experience: data.training_experience,
          goals: data.goals,
          sessions_per_week: data.sessions_per_week,
          chronic_diseases: data.chronic_diseases,
          injuries: data.injuries,
          weight_goal: data.weight_goal,
          overview: data.overview ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return profile;
    }
  }

  async generateOverview(data: {
    training_experience: string;
    goals: string[];
    sessions_per_week: string;
    chronic_diseases: string[];
    injuries: string[];
    weight_goal: string;
  }) {
    const profileKey = createProfileKey(data);
    const cachedOverview = await getCachedOverview(profileKey);

    if (cachedOverview) {
      return { overview: cachedOverview };
    }

    const overview = await generateClientOverview(data);

    await setCachedOverview(profileKey, overview);

    return { overview };
  }

  async matchExperts(clientProfileId: string, overview: string) {
    console.log('matchExperts called with:', { clientProfileId, overviewLength: overview?.length });

    const { data: experts, error: expertsError } = await supabase
      .from('experts')
      .select('id, overview');

    console.log('Experts from DB:', { count: experts?.length, error: expertsError });

    if (expertsError) throw expertsError;
    if (!experts || experts.length === 0) {
      throw new Error('No experts found in database. Please contact support.');
    }

    const expertsWithOverview = experts
      .filter(e => e.overview)
      .map(e => ({ id: e.id, overview: e.overview! }));

    console.log('Experts with overview:', expertsWithOverview.length);

    if (expertsWithOverview.length === 0) {
      throw new Error('No experts have overview data. Please contact support.');
    }

    const expertIds = expertsWithOverview.map(e => e.id);
    const cachedMatches = await getCachedMatches(overview, expertIds);

    let matches;
    if (cachedMatches && cachedMatches.size === expertIds.length) {
      console.log('Using cached match results');
      matches = expertIds.map(id => cachedMatches.get(id)!);
    } else {
      console.log('Generating fresh matches with OpenAI');
      const { batchCalculateMatchScores } = await import('./openai/matchExperts');
      matches = await batchCalculateMatchScores(overview, expertsWithOverview);

      await setCachedMatches(overview, matches);
    }

    console.log('Match results:', { matchesCount: matches.length });

    const matchResults = matches.map(match => ({
      client_profile_id: clientProfileId,
      expert_id: match.expert_id,
      match_score: match.match_score,
      reason_1: match.reason1,
      reason_2: match.reason2,
    }));

    console.log('Saving match results to DB:', matchResults.length);

    const { error: insertError } = await supabase
      .from('match_results')
      .upsert(matchResults);

    if (insertError) {
      console.error('Error saving match results:', insertError);
      throw insertError;
    }

    const enrichedMatches = matches.map(match => {
      const expertData = getExpertById(match.expert_id);
      return {
        ...match,
        expert: expertData || null,
        reason_1: match.reason1,
        reason_2: match.reason2,
      };
    });

    console.log('Enriched matches:', enrichedMatches);

    return {
      matches: enrichedMatches,
    };
  }

  async selectTrainer(clientProfileId: string, expertId: number) {
    const { data, error } = await supabase
      .from('selected_trainers')
      .upsert({
        client_profile_id: clientProfileId,
        expert_id: expertId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getDashboard(profileId: string) {
    const { data: profile, error: profileError } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', profileId)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) return null;

    const { data: selectedTrainer, error: trainerError } = await supabase
      .from('selected_trainers')
      .select('*')
      .eq('client_profile_id', profile.id)
      .maybeSingle();

    if (trainerError) throw trainerError;

    let enrichedTrainer = null;
    if (selectedTrainer) {
      const expertData = getExpertById(selectedTrainer.expert_id);
      enrichedTrainer = {
        ...selectedTrainer,
        experts: expertData || null,
      };
    }

    const recommendations = generateDummyRecommendations(profile);

    const { data: matches, error: matchesError } = await supabase
      .from('match_results')
      .select('*')
      .eq('client_profile_id', profile.id)
      .order('match_score', { ascending: false })
      .limit(5);

    if (matchesError) throw matchesError;

    const enrichedMatches = (matches || []).map(match => {
      const expertData = getExpertById(match.expert_id);
      return {
        ...match,
        experts: expertData || null,
      };
    });

    return {
      profile,
      selectedTrainer: enrichedTrainer,
      recommendations,
      matches: enrichedMatches,
    };
  }

  async getMessages(clientProfileId: string, expertId: number) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('client_profile_id', clientProfileId)
      .eq('expert_id', expertId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  async sendMessage(clientProfileId: string, expertId: number, content: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        client_profile_id: clientProfileId,
        expert_id: expertId,
        sender: 'client',
        content,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateProfile(profileId: string, updates: any) {
    const { data, error } = await supabase
      .from('client_profiles')
      .update(updates)
      .eq('id', profileId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getClientProfile(profileId: string) {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', profileId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getMatchResults(clientProfileId: string) {
    const { data, error } = await supabase
      .from('match_results')
      .select('*')
      .eq('client_profile_id', clientProfileId)
      .order('match_score', { ascending: false });

    if (error) throw error;

    if (!data) return [];

    const enrichedResults = data.map(match => {
      const expertData = getExpertById(match.expert_id);
      return {
        ...match,
        expert: expertData || null,
      };
    });

    return enrichedResults;
  }

  async matchExpertsWithStreaming(
    clientProfileId: string,
    overview: string,
    callbacks: Omit<StreamingMatchCallbacks, 'onComplete'> & {
      onComplete: (matches: any[]) => void;
    }
  ) {
    const { data: experts, error: expertsError } = await supabase
      .from('experts')
      .select('id, overview');

    if (expertsError) throw expertsError;
    if (!experts || experts.length === 0) {
      throw new Error('No experts found in database.');
    }

    const expertsWithOverview = experts
      .filter(e => e.overview)
      .map(e => ({ id: e.id, overview: e.overview! }));

    const expertIds = expertsWithOverview.map(e => e.id);
    const cachedMatches = await getCachedMatches(overview, expertIds);

    if (cachedMatches && cachedMatches.size === expertIds.length) {
      const matches = expertIds.map(id => cachedMatches.get(id)!);
      const enrichedMatches = matches.map(match => {
        const expertData = getExpertById(match.expert_id);
        return {
          ...match,
          expert: expertData || null,
          reason_1: match.reason1,
          reason_2: match.reason2,
        };
      });

      const matchResults = matches.map(match => ({
        client_profile_id: clientProfileId,
        expert_id: match.expert_id,
        match_score: match.match_score,
        reason_1: match.reason1,
        reason_2: match.reason2,
      }));

      await supabase.from('match_results').upsert(matchResults);

      callbacks.onComplete(enrichedMatches);
      return;
    }

    await matchExpertsWithStreaming(overview, expertsWithOverview, {
      onMatch: (match) => {
        const expertData = getExpertById(match.expert_id);
        const enrichedMatch = {
          ...match,
          expert: expertData || null,
          reason_1: match.reason1,
          reason_2: match.reason2,
        };
        callbacks.onMatch(enrichedMatch);
      },
      onProgress: callbacks.onProgress,
      onError: callbacks.onError,
      onComplete: async (matches) => {
        await setCachedMatches(overview, matches);

        const matchResults = matches.map(match => ({
          client_profile_id: clientProfileId,
          expert_id: match.expert_id,
          match_score: match.match_score,
          reason_1: match.reason1,
          reason_2: match.reason2,
        }));

        await supabase.from('match_results').upsert(matchResults);

        const enrichedMatches = matches.map(match => {
          const expertData = getExpertById(match.expert_id);
          return {
            ...match,
            expert: expertData || null,
            reason_1: match.reason1,
            reason_2: match.reason2,
          };
        });

        callbacks.onComplete(enrichedMatches);
      },
    });
  }
}

export const api = new ApiClient();
