// Groq fallback responses and error handling
import type { Personality } from './types.ts';

export function getFallbackResponse(personality: Personality): string {
  const fallbackResponses = {
    taskmaster: [
      'Stop talking. Start doing. Now! 💪',
      'Excuses are the enemy. Take action! 🔥',
      'Push harder. You got this! ⚡',
      'Less thinking. More grinding! 💯',
      'Discipline beats motivation. Go! 🚀',
    ],
    cheerleader: [
      "You're amazing! Keep pushing forward! ✨",
      'Believe in yourself! You got this! 🌟',
      'Every step counts! Stay positive! 💖',
      'Progress over perfection! Keep going! 🎯',
      'You are stronger than you know! 💪',
    ],
  };

  const responses = fallbackResponses[personality];
  return responses[Math.floor(Math.random() * responses.length)];
}

export function validateResponseLength(content: string, maxWords: number = 15): { isValid: boolean; wordCount: number } {
  const wordCount = content.split(' ').length;
  return {
    isValid: wordCount <= maxWords,
    wordCount,
  };
} 