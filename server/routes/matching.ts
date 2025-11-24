import express from 'express';
import { expertsData } from '../../src/data/expertsData';
import {
  generateClientOverview,
  streamClientOverview,
  calculateMatchScore,
  batchCalculateMatchScores,
  type ClientIntakeData,
} from '../services/openai';
import {
  generateCacheKey,
  generateOverviewHash,
  getCachedOverview,
  setCachedOverview,
  getCachedMatches,
  setCachedMatch,
  setCachedMatches,
} from '../services/cache';
import { createSSEResponse, streamWithRetry } from '../services/streaming';

const router = express.Router();

router.post('/generate-overview', async (req, res) => {
  try {
    const clientData: ClientIntakeData = req.body;
    const cacheKey = generateCacheKey(clientData);

    const cached = await getCachedOverview(cacheKey);
    if (cached) {
      return res.json({ overview: cached, cached: true });
    }

    const overview = await generateClientOverview(clientData);

    await setCachedOverview(cacheKey, clientData, overview);

    res.json({ overview, cached: false });
  } catch (error: any) {
    console.error('Error generating overview:', error);
    res.status(500).json({ error: error.message || 'Failed to generate overview' });
  }
});

router.post('/generate-overview-stream', async (req, res) => {
  const stream = createSSEResponse(res);

  try {
    const clientData: ClientIntakeData = req.body;
    const cacheKey = generateCacheKey(clientData);

    const cached = await getCachedOverview(cacheKey);
    if (cached) {
      stream.sendEvent('overview-complete', { overview: cached, cached: true });
      stream.close();
      return;
    }

    let fullOverview = '';

    for await (const token of streamClientOverview(clientData)) {
      fullOverview += token;
      if (!stream.sendEvent('overview-token', { token })) {
        break;
      }
    }

    await setCachedOverview(cacheKey, clientData, fullOverview);

    stream.sendEvent('overview-complete', { overview: fullOverview, cached: false });
    stream.close();
  } catch (error: any) {
    console.error('Error streaming overview:', error);
    stream.sendError(error.message || 'Failed to generate overview');
    stream.close();
  }
});

router.post('/match-experts', async (req, res) => {
  try {
    const { overview } = req.body;

    if (!overview) {
      return res.status(400).json({ error: 'Overview is required' });
    }

    const overviewHash = generateOverviewHash(overview);

    const cached = await getCachedMatches(overviewHash);
    if (cached) {
      return res.json({ matches: cached, cached: true });
    }

    const matches = await batchCalculateMatchScores(overview, expertsData);

    await setCachedMatches(overviewHash, matches);

    res.json({ matches, cached: false });
  } catch (error: any) {
    console.error('Error matching experts:', error);
    res.status(500).json({ error: error.message || 'Failed to match experts' });
  }
});

router.post('/match-experts-stream', async (req, res) => {
  const stream = createSSEResponse(res);

  try {
    const { overview, forceRefresh = false } = req.body;

    if (!overview) {
      stream.sendError('Overview is required');
      stream.close();
      return;
    }

    const overviewHash = generateOverviewHash(overview);

    if (!forceRefresh) {
      const cached = await getCachedMatches(overviewHash);
      if (cached) {
        for (const match of cached) {
          stream.sendEvent('match-score', match);
        }
        stream.sendEvent('matching-complete', { cached: true });
        stream.close();
        return;
      }
    }

    const totalExperts = expertsData.length;
    stream.sendEvent('matching-start', { total: totalExperts });

    for (let i = 0; i < expertsData.length; i++) {
      const expert = expertsData[i];

      stream.sendEvent('matching-progress', {
        current: i + 1,
        total: totalExperts,
        expertId: expert.id,
      });

      try {
        const match = await streamWithRetry(() => calculateMatchScore(overview, expert));

        await setCachedMatch(overviewHash, match);

        if (!stream.sendEvent('match-score', match)) {
          break;
        }
      } catch (error: any) {
        console.error(`Error matching expert ${expert.id}:`, error);
        stream.sendEvent('match-error', {
          expertId: expert.id,
          error: 'Failed to calculate match',
        });
      }
    }

    stream.sendEvent('matching-complete', { cached: false });
    stream.close();
  } catch (error: any) {
    console.error('Error streaming expert matches:', error);
    stream.sendError(error.message || 'Failed to match experts');
    stream.close();
  }
});

router.post('/warm-cache', async (req, res) => {
  try {
    const { clientData } = req.body;

    if (!clientData) {
      return res.status(400).json({ error: 'Client data is required' });
    }

    const cacheKey = generateCacheKey(clientData);
    let overview = await getCachedOverview(cacheKey);

    if (!overview) {
      overview = await generateClientOverview(clientData);
      await setCachedOverview(cacheKey, clientData, overview);
    }

    const overviewHash = generateOverviewHash(overview);
    const cachedMatches = await getCachedMatches(overviewHash);

    if (!cachedMatches) {
      setTimeout(async () => {
        try {
          const matches = await batchCalculateMatchScores(overview!, expertsData);
          await setCachedMatches(overviewHash, matches);
        } catch (error) {
          console.error('Error warming cache:', error);
        }
      }, 0);
    }

    res.json({ success: true, overview, cached: !!cachedMatches });
  } catch (error: any) {
    console.error('Error warming cache:', error);
    res.status(500).json({ error: error.message || 'Failed to warm cache' });
  }
});

export default router;
