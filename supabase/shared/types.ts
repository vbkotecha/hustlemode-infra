// Core Application Types for HustleMode.ai
// Supabase Edge Functions + Groq + Llama 4 Architecture

export interface User {
  id: string;
  phone_number: string;
  email?: string;
  name?: string;
  timezone: string;
  status: 'active' | 'inactive' | 'banned';
  created_at: string;
  last_active: string;
}

export interface UserPreferences {
  user_id: string;
  default_personality: Personality;
  groq_temperature: number;
  check_in_frequency: 'daily' | 'weekly' | 'custom';
  reminder_enabled: boolean;
  weekend_check_ins: boolean;
  ai_memory_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type Personality = 'taskmaster' | 'cheerleader';

export interface ChatRequest {
  user_id: string;
  message: string;
  personality?: Personality;
  platform?: 'whatsapp' | 'sms' | 'telegram';
  context?: {
    conversation_history?: ConversationMessage[];
    goal_summary?: string;
    behavioral_insights?: Record<string, any>;
  };
}

export interface ChatResponse {
  response: string;
  personality: Personality;
  memories_found: number;
  tools_used: number;
  processing_time_ms: number;
  success: boolean;
  groq_request_id?: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  personality?: Personality;
  timestamp: string;
}

export interface WhatsAppWebhookData {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text: {
            body: string;
          };
          type: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export interface GroqChatCompletion {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface MemoryResult {
  memory: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface PersonalityConfig {
  name: string;
  description: string;
  max_words: string;
  style: string;
  system_prompt: string;
  temperature: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export class DatabaseError extends Error {
  code?: string;
  severity?: string;
  detail?: string;
  
  constructor(message: string, code?: string, severity?: string, detail?: string) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.severity = severity;
    this.detail = detail;
  }
}

export interface ValidationError extends Error {
  field?: string;
  value?: any;
}

// Environment Configuration
export interface EdgeFunctionConfig {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  GROQ_API_KEY: string;
  MEM0_API_KEY: string;
  WHATSAPP_TOKEN: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
  WHATSAPP_VERIFY_TOKEN: string;
  ENVIRONMENT: 'development' | 'staging' | 'production';
} 