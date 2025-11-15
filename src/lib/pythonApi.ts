const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL || 'https://matchfit-be.onrender.com';

export interface GenerateOverviewRequest {
  training_experience: string;
  goals: string[];
  sessions_per_week: string;
  chronic_diseases: string[];
  injuries: string[];
  weight_goal: string;
}

export interface GenerateOverviewResponse {
  overview: string;
}

export interface MatchExpertsRequest {
  client_overview: string;
  experts: Array<{
    id: number;
    overview: string;
  }>;
}

export interface MatchExpertsResponse {
  matches: Array<{
    expert_id: number;
    match_score: number;
    reason1: string;
    reason2: string;
  }>;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = 90000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. The AI service might be starting up. Please try again in a moment.');
    }
    throw error;
  }
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  initialDelay: number = 2000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (i < maxRetries) {
        const delay = initialDelay * Math.pow(2, i);
        console.log(`Retry attempt ${i + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

class PythonApiClient {
  async generateOverview(data: GenerateOverviewRequest): Promise<GenerateOverviewResponse> {
    try {
      return await retryWithBackoff(async () => {
        const response = await fetchWithTimeout(
          `${PYTHON_API_URL}/generate-overview`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            mode: 'cors',
          },
          90000
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server returned ${response.status}: ${errorText}`);
        }

        return response.json();
      });
    } catch (error: any) {
      console.error('Error generating overview:', error);

      if (error.message.includes('timeout')) {
        throw new Error('The AI service is taking longer than expected. This can happen when the service is starting up. Please try again.');
      }

      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to the AI service. Please check your internet connection and try again.');
      }

      throw new Error(error.message || 'Failed to generate overview. Please try again.');
    }
  }

  async matchExperts(data: MatchExpertsRequest): Promise<MatchExpertsResponse> {
    console.log('Matching experts with data:', {
      clientOverviewLength: data.client_overview?.length,
      expertsCount: data.experts?.length
    });

    try {
      return await retryWithBackoff(async () => {
        console.log('Sending match request to:', `${PYTHON_API_URL}/match-experts`);

        const response = await fetchWithTimeout(
          `${PYTHON_API_URL}/match-experts`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            mode: 'cors',
          },
          90000
        );

        console.log('Match response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Match error response:', errorText);
          throw new Error(`Server returned ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log('Match result:', { matchesCount: result.matches?.length });
        return result;
      });
    } catch (error: any) {
      console.error('Error matching experts:', error);

      if (error.message.includes('timeout')) {
        throw new Error('The AI service is taking longer than expected. This can happen when the service is starting up. Please try again.');
      }

      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to the AI service. Please check your internet connection and try again.');
      }

      throw new Error(error.message || 'Failed to match experts. Please try again.');
    }
  }
}

export const pythonApi = new PythonApiClient();
