import OpenAI from 'openai';
import type { Expert } from '../../src/data/expertsData';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ClientIntakeData {
  training_experience: string;
  goals: string[];
  sessions_per_week: string;
  chronic_diseases: string[];
  injuries: string[];
  weight_goal: string;
}

export interface MatchResult {
  expert_id: number;
  match_score: number;
  reason_1: string;
  reason_2: string;
}

export async function generateClientOverview(data: ClientIntakeData): Promise<string> {
  const prompt = `Generate a concise professional client profile (100-150 words) based on the following information:

Training Experience: ${data.training_experience}
Goals: ${data.goals.join(', ')}
Sessions Per Week: ${data.sessions_per_week}
Chronic Diseases: ${data.chronic_diseases.length > 0 ? data.chronic_diseases.join(', ') : 'None'}
Injuries: ${data.injuries.length > 0 ? data.injuries.join(', ') : 'None'}
Weight Goal: ${data.weight_goal}

Create a clear, professional summary that highlights the client's fitness level, primary goals, any health considerations, and training capacity. Focus on what would be relevant for matching with healthcare professionals.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a healthcare matching assistant. Generate concise, professional client profiles for matching with healthcare providers and fitness trainers.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 250,
  });

  return response.choices[0]?.message?.content?.trim() || '';
}

export async function* streamClientOverview(data: ClientIntakeData): AsyncGenerator<string> {
  const prompt = `Generate a concise professional client profile (100-150 words) based on the following information:

Training Experience: ${data.training_experience}
Goals: ${data.goals.join(', ')}
Sessions Per Week: ${data.sessions_per_week}
Chronic Diseases: ${data.chronic_diseases.length > 0 ? data.chronic_diseases.join(', ') : 'None'}
Injuries: ${data.injuries.length > 0 ? data.injuries.join(', ') : 'None'}
Weight Goal: ${data.weight_goal}

Create a clear, professional summary that highlights the client's fitness level, primary goals, any health considerations, and training capacity. Focus on what would be relevant for matching with healthcare professionals.`;

  const stream = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a healthcare matching assistant. Generate concise, professional client profiles for matching with healthcare providers and fitness trainers.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 250,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

export async function calculateMatchScore(
  clientOverview: string,
  expert: Expert
): Promise<MatchResult> {
  const prompt = `You are an expert matching algorithm. Score the compatibility between a client and a healthcare professional.

CLIENT PROFILE:
${clientOverview}

EXPERT PROFILE:
Specialization: ${expert.specialization}
Experience: ${expert.years_of_experience} years
Certifications: ${expert.certifications}
Overview: ${expert.overview}

Analyze the match and respond with ONLY a JSON object in this exact format (no additional text):
{
  "score": <number between 0-100>,
  "reason_1": "<one sentence explaining the primary reason for this match score>",
  "reason_2": "<one sentence explaining the secondary reason for this match score>"
}

Consider:
- Alignment between client goals and expert specialization
- Expert's experience with similar client profiles
- Relevant certifications for the client's needs
- Any health considerations that require specific expertise`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a healthcare matching algorithm. Respond ONLY with valid JSON, no additional text.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
    max_tokens: 200,
  });

  const content = response.choices[0]?.message?.content?.trim() || '{}';

  try {
    const parsed = JSON.parse(content);
    return {
      expert_id: expert.id,
      match_score: Math.min(100, Math.max(0, parsed.score || 0)),
      reason_1: parsed.reason_1 || 'Match analysis pending',
      reason_2: parsed.reason_2 || 'Additional analysis pending',
    };
  } catch (error) {
    console.error('Failed to parse OpenAI response:', content);
    return {
      expert_id: expert.id,
      match_score: 50,
      reason_1: 'Match analysis in progress',
      reason_2: 'Detailed reasoning will be available shortly',
    };
  }
}

export async function batchCalculateMatchScores(
  clientOverview: string,
  experts: Expert[]
): Promise<MatchResult[]> {
  const promises = experts.map((expert) =>
    calculateMatchScore(clientOverview, expert)
      .catch((error) => {
        console.error(`Error calculating match for expert ${expert.id}:`, error);
        return {
          expert_id: expert.id,
          match_score: 0,
          reason_1: 'Error occurred during matching',
          reason_2: 'Please try again later',
        };
      })
  );

  return await Promise.all(promises);
}
