// Configuration Constants - Extracted from config.ts
export const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
export const WHATSAPP_BASE_URL = 'https://graph.facebook.com/v18.0';
export const GROQ_MODEL = 'meta-llama/llama-4-maverick-17b-128e-instruct';

export const PERFORMANCE = {
  GROQ_TIMEOUT_MS: 30000,
  GROQ_MAX_TOKENS: 300,
  GROQ_TEMPERATURE: 0.8,
  MEMORY_TIMEOUT_MS: 5000,
  MAX_MEMORY_RESULTS: 10,
  WHATSAPP_TIMEOUT_MS: 8000,
  DB_TIMEOUT_MS: 5000,
} as const;

export const SYSTEM_PROMPT_VERSION = 'v2.0.0';
export const SYSTEM_PROMPT_FILE = 'system-prompts/v2.0.0.md';

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