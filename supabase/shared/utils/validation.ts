// Validation utilities - Extracted from utils.ts
import type { Personality } from '../types.ts';
import { VALIDATION } from '../config.ts';

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

export function normalizePersonality(personality?: string): Personality {
  if (!personality) return 'taskmaster';
  
  const normalized = personality.toLowerCase();
  return VALIDATION.PERSONALITY_OPTIONS.includes(normalized as Personality)
    ? (normalized as Personality)
    : 'taskmaster';
} 