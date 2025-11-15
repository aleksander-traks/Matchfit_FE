import { Router } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { profileId } = req.query;

    if (!profileId) {
      return res.status(400).json({ error: 'profileId is required' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', profileId as string)
      .maybeSingle();

    if (profileError) {
      console.error('Database error:', profileError);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    if (!profile) {
      return res.json({
        profile: null,
        selectedTrainer: null,
        matches: [],
        recommendations: [],
        recentMessages: [],
      });
    }

    const { data: selectedTrainer, error: trainerError } = await supabase
      .from('selected_trainers')
      .select(
        `
        *,
        experts (*)
      `
      )
      .eq('client_profile_id', profile.id)
      .maybeSingle();

    if (trainerError) {
      console.error('Database error:', trainerError);
    }

    const { data: matches, error: matchesError } = await supabase
      .from('match_results')
      .select(
        `
        *,
        experts (*)
      `
      )
      .eq('client_profile_id', profile.id)
      .order('match_score', { ascending: false })
      .limit(5);

    if (matchesError) {
      console.error('Database error:', matchesError);
    }

    let recentMessages = [];
    if (selectedTrainer) {
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('client_profile_id', profile.id)
        .eq('expert_id', selectedTrainer.expert_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!messagesError && messages) {
        recentMessages = messages.reverse();
      }
    }

    const recommendations = generateRecommendations(profile);

    res.json({
      profile,
      selectedTrainer: selectedTrainer || null,
      matches: matches || [],
      recommendations,
      recentMessages,
    });
  } catch (error) {
    next(error);
  }
});

function generateRecommendations(profile: any): string[] {
  const recommendations: string[] = [];
  const goals = profile.goals || [];
  const sessionsPerWeek = profile.sessions_per_week || 0;

  if (goals.includes('Less Pain') || goals.includes('Move Easier')) {
    recommendations.push(
      'Focus on low-impact exercises and mobility work to reduce pain and improve movement quality.'
    );
  }

  if (goals.includes('Get Stronger')) {
    recommendations.push(
      'Progressive resistance training with proper form will help you build strength safely and effectively.'
    );
  }

  if (goals.includes('More Stamina')) {
    recommendations.push(
      'Gradually increase your cardiovascular training duration and intensity to build endurance over time.'
    );
  }

  if (sessionsPerWeek >= 4) {
    recommendations.push(
      'With 4+ sessions per week, ensure you include rest days and vary your training intensity to prevent overtraining.'
    );
  } else if (sessionsPerWeek <= 2) {
    recommendations.push(
      'To maximize results, consider increasing your training frequency as you build consistency and confidence.'
    );
  }

  if (goals.includes('Healthy Weight')) {
    recommendations.push(
      'Combine regular exercise with mindful nutrition habits for sustainable weight management results.'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('Stay consistent with your training and communicate regularly with your trainer.');
  }

  return recommendations;
}

export default router;
