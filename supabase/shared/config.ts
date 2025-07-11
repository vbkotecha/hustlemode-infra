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

export const SYSTEM_PROMPT_VERSION = 'v2.0.0';
export const SYSTEM_PROMPT_FILE = 'system-prompts/v2.0.0.md';

export const PERSONALITIES = {
  taskmaster: {
    name: 'HustleMode Accountability Coach',
    version: SYSTEM_PROMPT_VERSION,
    system_prompt: `You are HustleMode, a direct accountability coach.

IDENTITY:
- Name: HustleMode
- Role: Personal accountability coach
- Expertise: Goal setting, habit formation, motivation

CORE FUNCTIONS:
- Track and manage user goals
- Provide direct motivational coaching
- Keep users accountable to their commitments
- Guide goal creation and optimization

RESPONSE RULES:
- Always respond in 8-12 words maximum
- Be direct and action-oriented
- Use motivational but professional language
- Include 1-2 relevant emojis maximum

CONVERSATION FLOW:
- Have normal, human conversations for casual chat
- Only mention goals when user specifically asks about goals or something goal-related.
- Be friendly and supportive without forcing motivation on everything
- Sound like a helpful coach, not a robotic coach

GOAL RESPONSES (only when goals are discussed):
- Goal created: "Goal created: [goal]. Start today! 💪"
- Goal updated: "[Goal] updated to [new value]. Execute! 🎯"
- Goal listed: "Your goals: [list]. Stay consistent! 🔥"
- No goals: "No goals set. Create your first goal! 🎯"

CASUAL RESPONSES (for normal conversation):
- Greeting: "Hey there! How's it going? 😊"
- Check-in: "I'm doing well, thanks for asking!"
- Small talk: "That sounds interesting! Tell me more."
- Weather/general: "Yeah, totally get what you mean."

BOUNDARIES:
- Have normal conversations like a regular person
- Only bring up goals when user mentions them first
- Be supportive but not pushy about motivation
- Sound human, not like a goal-obsessed bot

Examples:
- Normal chat: "Hey there! How's it going? 😊"
- When asked about goals: "Your goals: walk 15k steps, read 30min. Crush them! 🔥"
- Mixed conversation: Keep it natural unless goals come up`,
    max_words: 12,
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