import { Router } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

router.post('/intake', async (req, res, next) => {
  try {
    const {
      profileId,
      userId,
      training_experience,
      goals,
      sessions_per_week,
      chronic_diseases,
      injuries,
      weight_goal,
      age,
      gender,
      living_area,
      monthly_budget,
      availability,
      cooperation,
      overview,
    } = req.body;

    const profileData = {
      user_id: userId || null,
      training_experience,
      goals,
      sessions_per_week: parseInt(sessions_per_week),
      chronic_diseases: chronic_diseases || [],
      injuries: injuries || [],
      weight_goal,
      age: age ? parseInt(age) : null,
      gender,
      living_area,
      monthly_budget,
      availability,
      cooperation,
      overview,
      updated_at: new Date().toISOString(),
    };

    if (profileId) {
      const { data, error } = await supabase
        .from('client_profiles')
        .update(profileData)
        .eq('id', profileId)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Failed to update profile' });
      }

      return res.json(data);
    } else {
      const { data, error } = await supabase.from('client_profiles').insert([profileData]).select().single();

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Failed to create profile' });
      }

      return res.json(data);
    }
  } catch (error) {
    next(error);
  }
});


router.post('/select-trainer', async (req, res, next) => {
  try {
    const { clientProfileId, expertId } = req.body;

    if (!clientProfileId || !expertId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: existing, error: existingError } = await supabase
      .from('selected_trainers')
      .select('*')
      .eq('client_profile_id', clientProfileId)
      .maybeSingle();

    if (existingError) {
      console.error('Database error:', existingError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (existing) {
      const { data, error } = await supabase
        .from('selected_trainers')
        .update({ expert_id: expertId, updated_at: new Date().toISOString() })
        .eq('client_profile_id', clientProfileId)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Failed to update selected trainer' });
      }

      return res.json(data);
    } else {
      const { data, error } = await supabase
        .from('selected_trainers')
        .insert([{ client_profile_id: clientProfileId, expert_id: expertId }])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Failed to select trainer' });
      }

      return res.json(data);
    }
  } catch (error) {
    next(error);
  }
});

router.put('/profile', async (req, res, next) => {
  try {
    const { profileId, ...updates } = req.body;

    if (!profileId) {
      return res.status(400).json({ error: 'Profile ID is required' });
    }

    const { data, error } = await supabase
      .from('client_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
