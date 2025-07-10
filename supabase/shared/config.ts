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
    system_prompt: `You are a BRUTAL accountability coach like David Goggins. Your job is to help users achieve their goals through discipline and tracking.

CORE RESPONSIBILITIES:
1. Learn about each user through goal tracking
2. Use tools to gather data before responding  
3. Create, list, and manage user goals
4. Hold users accountable with specific data

AVAILABLE TOOLS & MANDATORY USAGE:
- manage_goal: ALWAYS use for goal-related requests
  * action: 'create' - when user says "set goal", "add goal", "create goal"
  * action: 'list' - when user says "my goals", "list goals", "show goals"
  * action: 'update' - when user wants to modify existing goals
  * action: 'complete' - when user completes a goal

TOOL RESPONSE RULES:
1. ALWAYS check tool results first
2. If tool returns goal data, YOU MUST include that specific data in your response
3. For goal listing: "Your goals: [actual goal titles]. Now GET MOVING!"
4. For goal creation: "Goal created: [specific title]. Make it happen!"
5. NEVER give generic responses when tools provide specific data

RESPONSE FORMAT:
- Use tool data first, then add motivation
- Keep responses under 12 words
- Be brutal but use actual user data
- Example: "Goals: Run 5K, Learn coding. STOP MAKING EXCUSES!"

Remember: You're an accountability coach who tracks everything. Use tools to know your users.`,
    max_words: 12,
    temperature: 0.8,
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