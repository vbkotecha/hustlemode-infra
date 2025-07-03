// Configuration management for HustleMode.ai Supabase Edge Functions
// Centralized environment variable handling with validation

export interface Config {
  // Supabase Configuration
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  
  // Groq AI Configuration
  GROQ_API_KEY: string;
  GROQ_MODEL: string;
  
  // WhatsApp Business API
  WHATSAPP_TOKEN: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
  WHATSAPP_BUSINESS_ACCOUNT_ID: string;
  WHATSAPP_VERIFY_TOKEN: string;
  WHATSAPP_APP_SECRET: string;
  WHATSAPP_PHONE_NUMBER: string;
  WHATSAPP_TEST_TO_NUMBER: string;
  
  // Memory Service Configuration
  MEMORY_PROVIDER: string;
  
  // Application Settings
  ENVIRONMENT: string;
  APP_DEBUG: boolean;
  
  // Feature Flags
  ENABLE_VECTOR_MEMORY: boolean;
  ENABLE_GOAL_TRACKING: boolean;
  ENABLE_PROGRESS_ANALYTICS: boolean;
}

export function getConfig(): Config {
  return {
    // Supabase
    SUPABASE_URL: Deno.env.get('SUPABASE_URL') || 'https://your-project-ref.supabase.co',
    SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY') || 'your-supabase-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'your-supabase-service-role-key',
    
    // Groq AI
    GROQ_API_KEY: Deno.env.get('GROQ_API_KEY') || 'gsk_your_groq_api_key',
    GROQ_MODEL: Deno.env.get('GROQ_MODEL') || 'meta-llama/llama-4-maverick-17b-128e-instruct',
    
    // WhatsApp Business API
    WHATSAPP_TOKEN: Deno.env.get('WHATSAPP_TOKEN') || 'your_whatsapp_token',
    WHATSAPP_PHONE_NUMBER_ID: Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || 'your_phone_number_id',
    WHATSAPP_BUSINESS_ACCOUNT_ID: Deno.env.get('WHATSAPP_BUSINESS_ACCOUNT_ID') || 'your_business_account_id',
    WHATSAPP_VERIFY_TOKEN: Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'your_verify_token',
    WHATSAPP_APP_SECRET: Deno.env.get('WHATSAPP_APP_SECRET') || 'your_app_secret',
    WHATSAPP_PHONE_NUMBER: Deno.env.get('WHATSAPP_PHONE_NUMBER') || '+1234567890',
    WHATSAPP_TEST_TO_NUMBER: Deno.env.get('WHATSAPP_TEST_TO_NUMBER') || '+1234567890',
    
    // Memory Service
    MEMORY_PROVIDER: Deno.env.get('MEMORY_PROVIDER') || 'postgresql',
    
    // Application
    ENVIRONMENT: Deno.env.get('ENVIRONMENT') || 'development',
    APP_DEBUG: Deno.env.get('APP_DEBUG') === 'true',
    
    // Feature Flags
    ENABLE_VECTOR_MEMORY: Deno.env.get('ENABLE_VECTOR_MEMORY') === 'true',
    ENABLE_GOAL_TRACKING: Deno.env.get('ENABLE_GOAL_TRACKING') !== 'false', // Default true
    ENABLE_PROGRESS_ANALYTICS: Deno.env.get('ENABLE_PROGRESS_ANALYTICS') !== 'false', // Default true
  };
}

// API Endpoints
export const API_ENDPOINTS = {
  GROQ_CHAT: 'https://api.groq.com/openai/v1/chat/completions',
  WHATSAPP_MESSAGES: 'https://graph.facebook.com/v18.0',
} as const;

// Performance Configuration
export const PERFORMANCE = {
  // Groq AI Settings
  GROQ_TIMEOUT_MS: 30000,        // 30 seconds for AI responses
  GROQ_MAX_TOKENS: 100,          // Keep responses ultra-concise (8-12 words)
  GROQ_TEMPERATURE: 0.8,         // Balanced creativity
  
  // Memory Service Settings
  MEMORY_TIMEOUT_MS: 5000,       // 5 seconds for memory operations
  MAX_MEMORY_RESULTS: 10,        // Limit context size
  MEMORY_SEARCH_LIMIT: 5,        // Recent conversation context
  
  // WhatsApp API Settings
  WHATSAPP_TIMEOUT_MS: 10000,    // 10 seconds for message sending
  
  // Database Settings
  DB_TIMEOUT_MS: 5000,           // 5 seconds for database queries
  MAX_CONNECTIONS: 20,           // Connection pool limit
} as const;

// AI Personality Configuration
export const PERSONALITIES = {
  taskmaster: {
    name: 'Taskmaster',
    description: 'David Goggins-style brutal motivation',
    system_prompt: 'You are David Goggins, the ultimate tough love coach. Be BRUTAL, direct, and uncompromising.',
    response_length: '8-12 words',
    temperature: 0.8,
  },
  cheerleader: {
    name: 'Cheerleader', 
    description: 'Positive, enthusiastic support',
    system_prompt: 'You are an enthusiastic, positive coach who celebrates every win.',
    response_length: '8-12 words',
    temperature: 0.7,
  },
} as const;

// Validation function
export function validateConfig(config: Config): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required Supabase config
  if (!config.SUPABASE_URL || config.SUPABASE_URL.includes('your-project-ref')) {
    errors.push('SUPABASE_URL must be configured');
  }
  
  if (!config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_SERVICE_ROLE_KEY.includes('your-supabase')) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY must be configured');
  }
  
  // Required Groq config
  if (!config.GROQ_API_KEY || config.GROQ_API_KEY.includes('your_groq')) {
    errors.push('GROQ_API_KEY must be configured');
  }
  
  // Required WhatsApp config
  if (!config.WHATSAPP_TOKEN || config.WHATSAPP_TOKEN.includes('your_whatsapp')) {
    errors.push('WHATSAPP_TOKEN must be configured');
  }
  
  // Memory provider validation
  if (!['postgresql', 'mem0'].includes(config.MEMORY_PROVIDER)) {
    errors.push('MEMORY_PROVIDER must be either "postgresql" or "mem0"');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Environment check function
export function checkEnvironment(): void {
  const config = getConfig();
  const validation = validateConfig(config);
  
  if (!validation.valid) {
    console.warn('⚠️ Configuration warnings:');
    validation.errors.forEach(error => console.warn(`  - ${error}`));
  }
  
  console.log(`🔧 Environment: ${config.ENVIRONMENT}`);
  console.log(`🤖 AI Model: ${config.GROQ_MODEL}`);
  console.log(`💾 Memory Provider: ${config.MEMORY_PROVIDER}`);
  console.log(`📱 WhatsApp: ${config.WHATSAPP_PHONE_NUMBER}`);
  
  if (config.APP_DEBUG) {
    console.log('🐛 Debug mode enabled');
  }
} 