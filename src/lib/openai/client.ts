import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('VITE_OPENAI_API_KEY is not defined in environment variables');
}

export const openai = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true,
  timeout: 90000,
  maxRetries: 2,
});
