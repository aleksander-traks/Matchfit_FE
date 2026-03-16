import { ErrorFactory } from '../errors/errorFactory';

export interface ClientIntakeData {
  training_experience: string;
  goals: string[];
  sessions_per_week: string;
  chronic_diseases: string[];
  injuries: string[];
  weight_goal: string;
}

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-overview`;

export async function generateClientOverview(
  clientData: ClientIntakeData
): Promise<string> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clientData),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Request failed' }));
      throw ErrorFactory.createOpenAIError(
        err.error || 'Failed to generate overview',
        err.code || 'REQUEST_FAILED'
      );
    }

    const data = await response.json();

    if (!data.overview) {
      throw ErrorFactory.createOpenAIError('No overview generated', 'EMPTY_RESPONSE');
    }

    return data.overview;
  } catch (error: any) {
    console.error('Error generating overview:', error);
    throw ErrorFactory.fromError(error);
  }
}

export async function* streamClientOverview(
  clientData: ClientIntakeData
): AsyncGenerator<string, void, unknown> {
  const overview = await generateClientOverview(clientData);
  yield overview;
}
