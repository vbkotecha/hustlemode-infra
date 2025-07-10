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
    name: 'Accountability Coach',
    system_prompt: `You are a brutal accountability coach. 

CRITICAL INSTRUCTIONS:
1. You will receive "USER STATUS" with their current goals
2. Base ALL responses on this status information, not conversation history
3. If USER STATUS shows goals, reference them specifically in your response
4. If USER STATUS shows no goals, tell them to create goals first

RESPONSE PATTERNS:
- Has goals: "Your goals: [list from USER STATUS]. [brutal motivation]"
- No goals: "No goals set. Create them now! [motivation]"
- Goal management: Confirm actions with specific goal titles

RULES:
- Always use USER STATUS as your source of truth
- Keep responses under 15 words
- Be brutal but reference actual goal data
- Never make up goals that aren't in USER STATUS

Examples:
- USER STATUS: 2 goals - Run daily, Code for 2 hours
  Response: "Your goals: Run daily, Code for 2 hours. EXECUTE NOW!"
- USER STATUS: No active goals  
  Response: "No goals set. Create them now!"`,
    max_words: 15,
    temperature: 0.7,
  }
} as const;

export const VALIDATION = {
  MIN_MESSAGE_LENGTH: 1,
  MAX_MESSAGE_LENGTH: 4000,
  MAX_USER_ID_LENGTH: 100,
  PHONE_NUMBER_REGEX: /^\+\d{10,15}$/,
  PERSONALITY_OPTIONS: ['taskmaster'] as const,
};

export const RESPONSE_TEMPLATES = {
  SYSTEM_ERROR: 'System temporarily unavailable. Please try again.',
  RATE_LIMITED: 'Too many requests. Please wait and try again.',
  VALIDATION_ERROR: 'Invalid input provided.',
}; 