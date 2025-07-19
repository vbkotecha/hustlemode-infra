// Response Constraints - Extracted from whatsapp-formatters.ts
export class ResponseConstraints {
  static enforcePersonalityConstraints(
    response: string, 
    personality: 'taskmaster' | 'cheerleader'
  ): string {
    // Enforce 8-12 word limit
    const words = response.trim().split(/\s+/);
    if (words.length > 12) {
      return words.slice(0, 12).join(' ') + '!';
    }
    
    // Add personality emoji if missing
    const emoji = personality === 'taskmaster' ? '💪' : '✨';
    if (!response.includes(emoji)) {
      return `${response} ${emoji}`;
    }
    
    return response;
  }

  static addPersonalityFlair(response: string, emoji: string): string {
    return response.includes(emoji) ? response : `${response} ${emoji}`;
  }

  static isUrgentResult(result: any): boolean {
    return result?.data?.urgent === true || 
           result?.data?.priority === 'high' ||
           result?.tool_name === 'manage_goal';
  }

  static getFallbackMessage(personality: 'taskmaster' | 'cheerleader'): string {
    if (personality === 'taskmaster') {
      return 'Keep pushing forward! No excuses! 💪';
    } else {
      return 'You\'re doing amazing! Keep going! ✨';
    }
  }

  static validateWordCount(response: string, maxWords: number = 12): boolean {
    const words = response.trim().split(/\s+/);
    return words.length <= maxWords;
  }

  static truncateToWordLimit(response: string, maxWords: number = 12): string {
    const words = response.trim().split(/\s+/);
    if (words.length <= maxWords) return response;
    
    return words.slice(0, maxWords).join(' ') + '!';
  }
} 