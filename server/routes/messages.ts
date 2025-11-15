import { Router } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { clientProfileId, expertId, limit = 50, offset = 0 } = req.query;

    if (!clientProfileId || !expertId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('client_profile_id', clientProfileId as string)
      .eq('expert_id', parseInt(expertId as string))
      .order('created_at', { ascending: true })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    if (messagesError) {
      console.error('Database error:', messagesError);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }

    res.json(messages);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { clientProfileId, expertId, sender, content } = req.body;

    if (!clientProfileId || !expertId || !sender || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (sender !== 'client' && sender !== 'expert') {
      return res.status(400).json({ error: 'Invalid sender value' });
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          client_profile_id: clientProfileId,
          expert_id: expertId,
          sender,
          content,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
