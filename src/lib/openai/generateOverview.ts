import { openai } from './client';
import { ErrorFactory } from '../errors/errorFactory';

export interface ClientIntakeData {
  training_experience: string;
  goals: string[];
  sessions_per_week: string;
  chronic_diseases: string[];
  injuries: string[];
  weight_goal: string;
}

export async function generateClientOverview(
  clientData: ClientIntakeData
): Promise<string> {
  try {
    const prompt = `Create a concise professional overview (2-3 sentences) for a fitness client based on their intake information:

Training Experience: ${clientData.training_experience}
Goals: ${clientData.goals.join(', ')}
Sessions per Week: ${clientData.sessions_per_week}
Chronic Diseases: ${clientData.chronic_diseases.length > 0 ? clientData.chronic_diseases.join(', ') : 'None'}
Injuries: ${clientData.injuries.length > 0 ? clientData.injuries.join(', ') : 'None'}
Weight Goal: ${clientData.weight_goal}

Write a brief, professional summary that captures their fitness profile, goals, and any relevant health considerations.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a fitness professional creating client profile overviews. Be concise, professional, and focus on key information.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const overview = completion.choices[0]?.message?.content?.trim();

    if (!overview) {
      throw ErrorFactory.createOpenAIError(
        'No overview generated',
        'EMPTY_RESPONSE'
      );
    }

    return overview;
  } catch (error: any) {
    console.error('Error generating overview:', error);
    throw ErrorFactory.fromError(error);
  }
}

export async function* streamClientOverview(
  clientData: ClientIntakeData
): AsyncGenerator<string, void, unknown> {
  try {
    const prompt = `Create a concise professional overview (2-3 sentences) for a fitness client based on their intake information:

Training Experience: ${clientData.training_experience}
Goals: ${clientData.goals.join(', ')}
Sessions per Week: ${clientData.sessions_per_week}
Chronic Diseases: ${clientData.chronic_diseases.length > 0 ? clientData.chronic_diseases.join(', ') : 'None'}
Injuries: ${clientData.injuries.length > 0 ? clientData.injuries.join(', ') : 'None'}
Weight Goal: ${clientData.weight_goal}

Write a brief, professional summary that captures their fitness profile, goals, and any relevant health considerations.`;

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a fitness professional creating client profile overviews. Be concise, professional, and focus on key information.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error: any) {
    console.error('Error streaming overview:', error);
    throw ErrorFactory.fromError(error);
  }
}
