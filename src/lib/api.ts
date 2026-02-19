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
    age?: string;
    gender?: string;
    living_area?: string[];
    monthly_budget?: string[];
    availability?: string[];
    cooperation?: string[];
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
          age: data.age ? parseInt(data.age) : null,
          gender: data.gender || null,
          living_area: data.living_area || null,
          monthly_budget: data.monthly_budget || null,
          availability: data.availability || null,
          cooperation: data.cooperation || null,
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
          age: data.age ? parseInt(data.age) : null,
          gender: data.gender || null,
          living_area: data.living_area || null,
          monthly_budget: data.monthly_budget || null,
          availability: data.availability || null,
          cooperation: data.cooperation || null,
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

    const enrichedMatches = await Promise.all(
      matches.map(async (match) => {
        const expertData = await getExpertById(match.expert_id);
        return {
          ...match,
          expert: expertData || null,
          reason_1: match.reason1,
          reason_2: match.reason2,
        };
      })
    );

    console.log('Enriched matches:', enrichedMatches);

    return {
      matches: enrichedMatches,
    };
  }

  async selectTrainer(clientProfileId: string, expertId: number) {
    await supabase
      .from('selected_trainers')
      .delete()
      .eq('client_profile_id', clientProfileId);

    const { data, error } = await supabase
      .from('selected_trainers')
      .insert({
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
      const expertData = await getExpertById(selectedTrainer.expert_id);
      enrichedTrainer = {
        ...selectedTrainer,
        experts: expertData || null,
      };
    }

    const recommendations = generateDummyRecommendations(profile);

    console.log('📊 Dashboard: Fetching matches for profile:', profile.id);
    console.log('📊 Dashboard: Selected trainer to exclude:', selectedTrainer?.expert_id);

    let matchesQuery = supabase
      .from('match_results')
      .select('*')
      .eq('client_profile_id', profile.id)
      .order('match_score', { ascending: false });

    if (selectedTrainer) {
      matchesQuery = matchesQuery.neq('expert_id', selectedTrainer.expert_id);
    }

    const { data: matches, error: matchesError } = await matchesQuery.limit(5);

    if (matchesError) {
      console.error('❌ Dashboard: Error fetching matches:', matchesError);
      throw matchesError;
    }

    console.log('📊 Dashboard: Raw matches from DB:', {
      count: matches?.length || 0,
      expertIds: matches?.map(m => m.expert_id) || []
    });

    const enrichedMatches = await Promise.all(
      (matches || []).map(async (match) => {
        const expertData = await getExpertById(match.expert_id);
        return {
          ...match,
          experts: expertData || null,
        };
      })
    );

    const uniqueMatches = [];
    const seenExpertIds = new Set();

    for (const match of enrichedMatches) {
      if (match.experts && !seenExpertIds.has(match.expert_id)) {
        seenExpertIds.add(match.expert_id);
        uniqueMatches.push(match);
      }
    }

    console.log('📊 Dashboard: Unique matches after dedup:', {
      count: uniqueMatches.length,
      expertIds: uniqueMatches.map(m => m.expert_id)
    });

    return {
      profile,
      selectedTrainer: enrichedTrainer,
      recommendations,
      matches: uniqueMatches,
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

  async sendMessage(clientProfileId: string, expertId: number, content: string, email?: string) {
    if (email) {
      await this.updateClientEmail(clientProfileId, email);
    }

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

  async updateClientEmail(profileId: string, email: string) {
    const { data, error } = await supabase
      .from('client_profiles')
      .update({
        email,
        email_consent: true,
        email_consent_date: new Date().toISOString(),
      })
      .eq('id', profileId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async scheduleIntroCall(data: {
    clientProfileId: string;
    expertId: number;
    email: string;
    preferredDate?: string;
    preferredTime?: string;
    notes?: string;
  }) {
    const { data: introCall, error } = await supabase
      .from('intro_calls')
      .insert({
        client_profile_id: data.clientProfileId,
        expert_id: data.expertId,
        email: data.email,
        preferred_date: data.preferredDate || null,
        preferred_time: data.preferredTime || null,
        notes: data.notes || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    await this.updateClientEmail(data.clientProfileId, data.email);

    return introCall;
  }

  async getAllExperts() {
    const { data: experts, error } = await supabase
      .from('experts')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    if (!experts) return [];

    const expertIds = experts.map(e => e.id);

    const { data: selectedTrainers } = await supabase
      .from('selected_trainers')
      .select('expert_id')
      .in('expert_id', expertIds);

    const { data: matchResults } = await supabase
      .from('match_results')
      .select('expert_id')
      .in('expert_id', expertIds);

    const { data: introCalls } = await supabase
      .from('intro_calls')
      .select('expert_id')
      .in('expert_id', expertIds);

    const selectedMap = new Map<number, number>();
    (selectedTrainers || []).forEach(st => {
      selectedMap.set(st.expert_id, (selectedMap.get(st.expert_id) || 0) + 1);
    });

    const matchMap = new Map<number, number>();
    (matchResults || []).forEach(mr => {
      matchMap.set(mr.expert_id, (matchMap.get(mr.expert_id) || 0) + 1);
    });

    const introMap = new Map<number, number>();
    (introCalls || []).forEach(ic => {
      introMap.set(ic.expert_id, (introMap.get(ic.expert_id) || 0) + 1);
    });

    return experts.map(e => ({
      ...e,
      selected_count: selectedMap.get(e.id) ?? 0,
      matched_count: matchMap.get(e.id) ?? 0,
      intro_call_count: introMap.get(e.id) ?? 0,
    }));
  }

  async getAllClientProfiles() {
    const { data: profiles, error } = await supabase
      .from('client_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!profiles) return [];

    const profileIds = profiles.map(p => p.id);

    const { data: selectedTrainers } = await supabase
      .from('selected_trainers')
      .select('client_profile_id, expert_id')
      .in('client_profile_id', profileIds);

    const { data: matchCounts } = await supabase
      .from('match_results')
      .select('client_profile_id')
      .in('client_profile_id', profileIds);

    const trainerMap = new Map<string, number>();
    (selectedTrainers || []).forEach(st => trainerMap.set(st.client_profile_id, st.expert_id));

    const countMap = new Map<string, number>();
    (matchCounts || []).forEach(m => {
      countMap.set(m.client_profile_id, (countMap.get(m.client_profile_id) || 0) + 1);
    });

    return profiles.map(p => ({
      ...p,
      selected_expert_id: trainerMap.get(p.id) ?? null,
      match_count: countMap.get(p.id) ?? 0,
    }));
  }

  async getAdminUserDetail(profileId: string) {
    const { data: profile, error: profileError } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', profileId)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) return null;

    const { data: matchResults } = await supabase
      .from('match_results')
      .select('*')
      .eq('client_profile_id', profileId)
      .order('match_score', { ascending: false });

    const { data: selectedTrainer } = await supabase
      .from('selected_trainers')
      .select('*')
      .eq('client_profile_id', profileId)
      .maybeSingle();

    const { data: introCalls } = await supabase
      .from('intro_calls')
      .select('*')
      .eq('client_profile_id', profileId)
      .order('created_at', { ascending: false });

    const enrichedMatches = await Promise.all(
      (matchResults || []).map(async (match) => {
        const expertData = await getExpertById(match.expert_id);
        return { ...match, expert: expertData || null };
      })
    );

    let enrichedSelectedTrainer = null;
    if (selectedTrainer) {
      const expertData = await getExpertById(selectedTrainer.expert_id);
      enrichedSelectedTrainer = { ...selectedTrainer, expert: expertData || null };
    }

    const enrichedIntroCalls = await Promise.all(
      (introCalls || []).map(async (call) => {
        const expertData = await getExpertById(call.expert_id);
        return { ...call, expert: expertData || null };
      })
    );

    return {
      profile,
      matches: enrichedMatches,
      selectedTrainer: enrichedSelectedTrainer,
      introCalls: enrichedIntroCalls,
    };
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

  async sendExpertMessage(clientProfileId: string, expertId: number, content: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        client_profile_id: clientProfileId,
        expert_id: expertId,
        sender: 'expert',
        content,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async markMessagesAsRead(clientProfileId: string, expertId: number) {
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('client_profile_id', clientProfileId)
      .eq('expert_id', expertId)
      .eq('sender', 'client')
      .is('read_at', null);

    if (error) throw error;
  }

  async getExpertConversations(expertId: number) {
    const { data, error } = await supabase
      .from('messages')
      .select('client_profile_id, created_at, content, sender')
      .eq('expert_id', expertId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    const conversationMap = new Map<string, { lastMessage: string; lastTime: string; unreadCount: number; lastSender: string }>();
    for (const msg of data) {
      if (!conversationMap.has(msg.client_profile_id)) {
        conversationMap.set(msg.client_profile_id, {
          lastMessage: msg.content,
          lastTime: msg.created_at,
          unreadCount: 0,
          lastSender: msg.sender,
        });
      }
    }

    const { data: unreadData } = await supabase
      .from('messages')
      .select('client_profile_id')
      .eq('expert_id', expertId)
      .eq('sender', 'client')
      .is('read_at', null);

    const unreadMap = new Map<string, number>();
    (unreadData || []).forEach(row => {
      unreadMap.set(row.client_profile_id, (unreadMap.get(row.client_profile_id) || 0) + 1);
    });

    const profileIds = Array.from(conversationMap.keys());
    const profiles: any[] = [];
    for (const profileId of profileIds) {
      const { data: profile } = await supabase
        .from('client_profiles')
        .select('id, email, goals, training_experience, created_at')
        .eq('id', profileId)
        .maybeSingle();
      if (profile) profiles.push(profile);
    }

    return profileIds.map(profileId => {
      const conv = conversationMap.get(profileId)!;
      const profile = profiles.find(p => p.id === profileId);
      return {
        clientProfileId: profileId,
        lastMessage: conv.lastMessage,
        lastTime: conv.lastTime,
        lastSender: conv.lastSender,
        unreadCount: unreadMap.get(profileId) || 0,
        clientEmail: profile?.email || null,
        clientGoals: profile?.goals || [],
        clientTrainingExperience: profile?.training_experience || null,
      };
    });
  }

  async getExpertByToken(token: string) {
    const { data: tokenRow, error: tokenError } = await supabase
      .from('expert_access_tokens')
      .select('expert_id')
      .eq('token', token)
      .maybeSingle();

    if (tokenError || !tokenRow) return null;

    await supabase
      .from('expert_access_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('token', token);

    const { data: expert, error: expertError } = await supabase
      .from('experts')
      .select('*')
      .eq('id', tokenRow.expert_id)
      .maybeSingle();

    if (expertError || !expert) return null;
    return expert;
  }

  async getMatchResults(clientProfileId: string) {
    const { data, error } = await supabase
      .from('match_results')
      .select('*')
      .eq('client_profile_id', clientProfileId)
      .order('match_score', { ascending: false });

    if (error) throw error;

    if (!data) return [];

    const enrichedResults = await Promise.all(
      data.map(async (match) => {
        const expertData = await getExpertById(match.expert_id);
        return {
          ...match,
          expert: expertData || null,
        };
      })
    );

    return enrichedResults;
  }

  async saveMatchResults(matchResults: Array<{
    client_profile_id: string;
    expert_id: number;
    match_score: number;
    reason_1: string;
    reason_2: string;
  }>) {
    console.log('💾 Saving match results:', {
      count: matchResults.length,
      clientProfileId: matchResults[0]?.client_profile_id,
      expertIds: matchResults.map(m => m.expert_id)
    });

    const { data, error } = await supabase
      .from('match_results')
      .upsert(matchResults, {
        onConflict: 'client_profile_id,expert_id'
      })
      .select();

    if (error) {
      console.error('❌ Error saving match results:', error);
      throw error;
    }

    console.log('✅ Successfully saved match results:', data?.length, 'records');
    return { success: true };
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
      const enrichedMatches = await Promise.all(
        matches.map(async (match) => {
          const expertData = await getExpertById(match.expert_id);
          return {
            ...match,
            expert: expertData || null,
            reason_1: match.reason1,
            reason_2: match.reason2,
          };
        })
      );

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
      onMatch: async (match) => {
        const expertData = await getExpertById(match.expert_id);
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

        const enrichedMatches = await Promise.all(
          matches.map(async (match) => {
            const expertData = await getExpertById(match.expert_id);
            return {
              ...match,
              expert: expertData || null,
              reason_1: match.reason1,
              reason_2: match.reason2,
            };
          })
        );

        callbacks.onComplete(enrichedMatches);
      },
    });
  }

  async submitFeedback(data: {
    page: string;
    rating: number;
    message?: string;
    clientProfileId?: string;
  }): Promise<void> {
    const { error } = await supabase.from('feedback').insert({
      page: data.page,
      rating: data.rating,
      message: data.message || '',
      client_profile_id: data.clientProfileId || null,
    });

    if (error) throw error;
  }
}

export const api = new ApiClient();
