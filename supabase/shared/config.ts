// Configuration management for HustleMode.ai Supabase Edge Functions
export interface Config {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  GROQ_API_KEY: string;
  GROQ_MODEL: string;
  WHATSAPP_TOKEN: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
  WHATSAPP_VERIFY_TOKEN: string;
  MEMORY_PROVIDER: string;
  ENVIRONMENT: string;
  APP_DEBUG: boolean;
}

export function getConfig(): Config {
  return {
    SUPABASE_URL: Deno.env.get('SUPABASE_URL') || 'https://your-project-ref.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'your-service-role-key',
    GROQ_API_KEY: Deno.env.get('GROQ_API_KEY') || 'gsk_your_groq_api_key',
    GROQ_MODEL: Deno.env.get('GROQ_MODEL') || 'meta-llama/llama-4-maverick-17b-128e-instruct',
    WHATSAPP_TOKEN: Deno.env.get('WHATSAPP_TOKEN') || 'your_whatsapp_token',
    WHATSAPP_PHONE_NUMBER_ID: Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || 'your_phone_number_id',
    WHATSAPP_VERIFY_TOKEN: Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'your_verify_token',
    MEMORY_PROVIDER: Deno.env.get('MEMORY_PROVIDER') || 'postgresql',
    ENVIRONMENT: Deno.env.get('ENVIRONMENT') || 'development',
    APP_DEBUG: Deno.env.get('APP_DEBUG') === 'true',
  };
}

export const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
export const WHATSAPP_BASE_URL = 'https://graph.facebook.com/v18.0';
export const GROQ_MODEL = 'meta-llama/llama-4-maverick-17b-128e-instruct';

export const PERFORMANCE = {
  GROQ_TIMEOUT_MS: 30000,
  GROQ_MAX_TOKENS: 100,
  GROQ_TEMPERATURE: 0.8,
  MEMORY_TIMEOUT_MS: 5000,
  MAX_MEMORY_RESULTS: 10,
  WHATSAPP_TIMEOUT_MS: 10000,
  DB_TIMEOUT_MS: 5000,
} as const;

export const PERSONALITIES = {
  taskmaster: {
    name: 'Taskmaster',
    system_prompt: 'You are David Goggins, the ultimate tough love coach. When users set goals, CREATE them immediately then push them to be even better. Be direct and demanding, but always EXECUTE first, improve second.',
    max_words: 12,
    temperature: 0.8,
  },
  cheerleader: {
    name: 'Cheerleader', 
    system_prompt: 'You are an enthusiastic, positive coach who celebrates every win.',
    max_words: 12,
    temperature: 0.7,
  },
} as const;

export const VALIDATION = {
  MIN_MESSAGE_LENGTH: 1,
  MAX_MESSAGE_LENGTH: 4000,
  MAX_USER_ID_LENGTH: 100,
  PHONE_NUMBER_REGEX: /^\+\d{10,15}$/,
  PERSONALITY_OPTIONS: ['taskmaster', 'cheerleader'] as const,
};

export const RESPONSE_TEMPLATES = {
  SYSTEM_ERROR: 'System temporarily unavailable. Please try again.',
  RATE_LIMITED: 'Too many requests. Please wait and try again.',
  VALIDATION_ERROR: 'Invalid input provided.',
}; 