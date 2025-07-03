import type { ApiResponse, ValidationError, Personality } from './types.ts';
import { VALIDATION, RESPONSE_TEMPLATES } from './config.ts';

// Response Helpers
export function createSuccessResponse<T>(data: T): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function createErrorResponse(error: string, status: number = 400): Response {
  const response: ApiResponse = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };
  
  return new Response(JSON.stringify(response), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// CORS Headers for Edge Functions
export function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
    'Access-Control-Max-Age': '86400',
  };
}

// Handle OPTIONS requests for CORS
export function handleCors(): Response {
  return new Response(null, {
    status: 200,
    headers: getCorsHeaders(),
  });
}

// Validation Functions
export function validateChatRequest(body: any): { isValid: boolean; error?: string } {
  if (!body) {
    return { isValid: false, error: 'Request body is required' };
  }

  if (!body.user_id || typeof body.user_id !== 'string') {
    return { isValid: false, error: 'user_id is required and must be a string' };
  }

  if (body.user_id.length > VALIDATION.MAX_USER_ID_LENGTH) {
    return { isValid: false, error: 'user_id is too long' };
  }

  if (!body.message || typeof body.message !== 'string') {
    return { isValid: false, error: 'message is required and must be a string' };
  }

  if (body.message.length < VALIDATION.MIN_MESSAGE_LENGTH) {
    return { isValid: false, error: 'message is too short' };
  }

  if (body.message.length > VALIDATION.MAX_MESSAGE_LENGTH) {
    return { isValid: false, error: 'message is too long' };
  }

  if (body.personality && !VALIDATION.PERSONALITY_OPTIONS.includes(body.personality)) {
    return { isValid: false, error: 'invalid personality option' };
  }

  return { isValid: true };
}

export function validatePhoneNumber(phoneNumber: string): boolean {
  return VALIDATION.PHONE_NUMBER_REGEX.test(phoneNumber);
}

export function sanitizeMessage(message: string): string {
  return message
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .substring(0, VALIDATION.MAX_MESSAGE_LENGTH);
}

// Personality Helpers
export function normalizePersonality(personality?: string): Personality {
  if (!personality) return 'taskmaster';
  
  const normalized = personality.toLowerCase();
  return VALIDATION.PERSONALITY_OPTIONS.includes(normalized as Personality)
    ? (normalized as Personality)
    : 'taskmaster';
}

// Rate Limiting (Simple in-memory implementation for Edge Functions)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const current = rateLimitMap.get(identifier);

  if (!current || now > current.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (current.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  current.count++;
  rateLimitMap.set(identifier, current);
  
  return { allowed: true, remaining: maxRequests - current.count };
}

// Error Handling
export function handleError(error: unknown, context: string): Response {
  console.error(`❌ ${context}:`, error);
  
  if (error instanceof ValidationError) {
    return createErrorResponse(`Validation error: ${error.message}`, 400);
  }
  
  if (error instanceof Error) {
    return createErrorResponse(error.message, 500);
  }
  
  return createErrorResponse(RESPONSE_TEMPLATES.SYSTEM_ERROR, 500);
}

// Performance Monitoring
export function measureTime<T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  
  return operation().then(
    result => ({
      result,
      duration: Date.now() - start,
    })
  );
}

// Logging Helpers
export function logRequest(method: string, url: string, body?: any): void {
  console.log(`📥 ${method} ${url}`, body ? `Body: ${JSON.stringify(body).substring(0, 200)}...` : '');
}

export function logResponse(status: number, duration: number, details?: string): void {
  const emoji = status < 400 ? '✅' : '❌';
  console.log(`${emoji} Response ${status} (${duration}ms)${details ? ` - ${details}` : ''}`);
}

// Text Processing
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

export function truncateResponse(response: string, maxWords: number = 12): string {
  const words = response.trim().split(/\s+/);
  
  if (words.length <= maxWords) {
    return response;
  }
  
  return words.slice(0, maxWords).join(' ') + '...';
}

// Environment Helpers
export function isDevelopment(): boolean {
  return Deno.env.get('ENVIRONMENT') === 'development';
}

export function isProduction(): boolean {
  return Deno.env.get('ENVIRONMENT') === 'production';
}

// Cleanup for rate limiting (run periodically)
export function cleanupRateLimit(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitMap) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
} 