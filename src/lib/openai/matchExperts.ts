import { openai } from './client';
import { ErrorFactory } from '../errors/errorFactory';

export interface Expert {
  id: number;
  overview: string;
}

export interface MatchResult {
  expert_id: number;
  match_score: number;
  reason1: string;
  reason2: string;
}

export interface ScoreOnlyResult {
  expert_id: number;
  match_score: number;
}

export interface ReasonsOnlyResult {
  expert_id: number;
  reason1: string;
  reason2: string;
}

export interface StreamingMatchCallbacks {
  onMatch: (match: MatchResult) => void;
  onProgress?: (completed: number, total: number) => void;
  onComplete: (matches: MatchResult[]) => void;
  onError: (error: Error) => void;
}

export async function calculateScoreOnly(
  clientOverview: string,
  expert: Expert
): Promise<ScoreOnlyResult> {
  try {
    const prompt = `You are a fitness matchmaking expert. Rate the compatibility between a client and a fitness expert on a scale of 0-100.

Client Profile:
${clientOverview}

Expert Profile:
${expert.overview}

Return only a JSON object with the match score:
{
  "match_score": <number between 0-100>
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a fitness matchmaking expert. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 50,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw ErrorFactory.createOpenAIError(
        'No response from OpenAI',
        'EMPTY_RESPONSE'
      );
    }

    const result = JSON.parse(content);

    return {
      expert_id: expert.id,
      match_score: result.match_score,
    };
  } catch (error: any) {
    console.error(`Error calculating score for expert ${expert.id}:`, error);

    if (error.name === 'SyntaxError') {
      throw ErrorFactory.createOpenAIError(
        'Invalid response format from OpenAI',
        'INVALID_RESPONSE'
      );
    }

    throw ErrorFactory.fromError(error);
  }
}

export async function calculateReasonsOnly(
  clientOverview: string,
  expert: Expert,
  score: number
): Promise<ReasonsOnlyResult> {
  try {
    const prompt = `You are a fitness matchmaking expert. This client and expert have a ${score}% compatibility match. Provide exactly two brief reasons (one sentence each) why they would be a good match.

Client Profile:
${clientOverview}

Expert Profile:
${expert.overview}

Return your response in this exact JSON format:
{
  "reason1": "<first reason>",
  "reason2": "<second reason>"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a fitness matchmaking expert. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 250,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw ErrorFactory.createOpenAIError(
        'No response from OpenAI',
        'EMPTY_RESPONSE'
      );
    }

    const result = JSON.parse(content);

    return {
      expert_id: expert.id,
      reason1: result.reason1,
      reason2: result.reason2,
    };
  } catch (error: any) {
    console.error(`Error calculating reasons for expert ${expert.id}:`, error);

    if (error.name === 'SyntaxError') {
      throw ErrorFactory.createOpenAIError(
        'Invalid response format from OpenAI',
        'INVALID_RESPONSE'
      );
    }

    throw ErrorFactory.fromError(error);
  }
}

export async function calculateMatchScore(
  clientOverview: string,
  expert: Expert
): Promise<MatchResult> {
  try {
    const prompt = `You are a fitness matchmaking expert. Analyze the compatibility between a client and a fitness expert.

Client Profile:
${clientOverview}

Expert Profile:
${expert.overview}

Rate their compatibility on a scale of 0-100 and provide exactly two brief reasons (one sentence each) why they would be a good match.

Return your response in this exact JSON format:
{
  "match_score": <number between 0-100>,
  "reason1": "<first reason>",
  "reason2": "<second reason>"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a fitness matchmaking expert. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw ErrorFactory.createOpenAIError(
        'No response from OpenAI',
        'EMPTY_RESPONSE'
      );
    }

    const result = JSON.parse(content);

    return {
      expert_id: expert.id,
      match_score: result.match_score,
      reason1: result.reason1,
      reason2: result.reason2,
    };
  } catch (error: any) {
    console.error(`Error calculating match for expert ${expert.id}:`, error);

    if (error.name === 'SyntaxError') {
      throw ErrorFactory.createOpenAIError(
        'Invalid response format from OpenAI',
        'INVALID_RESPONSE'
      );
    }

    throw ErrorFactory.fromError(error);
  }
}

export async function batchCalculateMatchScores(
  clientOverview: string,
  experts: Expert[]
): Promise<MatchResult[]> {
  const results: MatchResult[] = [];

  for (const expert of experts) {
    try {
      const match = await calculateMatchScore(clientOverview, expert);
      results.push(match);
    } catch (error) {
      console.error(`Failed to match expert ${expert.id}:`, error);
      results.push({
        expert_id: expert.id,
        match_score: 0,
        reason1: 'Error calculating match score',
        reason2: '',
      });
    }
  }

  results.sort((a, b) => b.match_score - a.match_score);
  return results;
}

export async function matchExpertsWithStreaming(
  clientOverview: string,
  experts: Expert[],
  callbacks: StreamingMatchCallbacks
): Promise<void> {
  const BATCH_SIZE = 3;
  const allMatches: MatchResult[] = [];
  let completedCount = 0;
  const totalCount = experts.length;

  try {
    for (let i = 0; i < experts.length; i += BATCH_SIZE) {
      const batch = experts.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async (expert) => {
        try {
          const match = await calculateMatchScore(clientOverview, expert);
          return match;
        } catch (error) {
          console.error(`Failed to match expert ${expert.id}:`, error);
          return {
            expert_id: expert.id,
            match_score: 0,
            reason1: 'Error calculating match score',
            reason2: '',
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);

      batchResults.forEach((match) => {
        allMatches.push(match);
        callbacks.onMatch(match);
        completedCount++;
        callbacks.onProgress?.(completedCount, totalCount);
      });
    }

    allMatches.sort((a, b) => b.match_score - a.match_score);
    callbacks.onComplete(allMatches);
  } catch (error: any) {
    callbacks.onError(ErrorFactory.fromError(error));
  }
}
