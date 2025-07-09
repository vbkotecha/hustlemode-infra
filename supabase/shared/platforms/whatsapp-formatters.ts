// WhatsApp Response Formatters
// Personality-appropriate responses for 8-12 word WhatsApp constraint

export class WhatsAppFormatters {
  static formatGoalResponse(data: any, personality: 'taskmaster' | 'cheerleader'): string {
    console.log('🎯 WhatsApp formatGoalResponse called with data:', JSON.stringify(data, null, 2));
    
    if (data?.goals) {
      const count = data.goals.length;
      console.log(`📋 Formatting ${count} goals for WhatsApp`);
      
      if (count === 0) {
        return personality === 'taskmaster' ? 'No goals yet. Set one NOW! 🎯' : 'Time to set your first goal! 🌟';
      }
      
      // Show actual goal titles
      const goalTitles = data.goals.map((g: any) => g.title || 'Untitled goal').slice(0, 2); // Max 2 for space
      const titlesList = goalTitles.join(', ');
      
      if (personality === 'taskmaster') {
        return count === 1 
          ? `Goal: ${titlesList}. Now execute! 💪`
          : `${count} goals: ${titlesList}. Execute all! 🔥`;
      } else {
        return count === 1
          ? `Goal: ${titlesList}. You've got this! ✨`
          : `${count} goals: ${titlesList}. Amazing! 🎉`;
      }
    }

    if (data?.goal && data?.message) {
      const action = data.message.includes('created') ? 'created' : 'updated';
      const goalTitle = data.goal.title || 'Goal';
      return personality === 'taskmaster'
        ? `${goalTitle} ${action}. No excuses! 🔥`
        : `${goalTitle} ${action}! Ready to crush it! ✨`;
    }

    console.log('⚠️ Using fallback goal response - no proper data structure');
    return personality === 'taskmaster' ? 'Goal handled. Stay focused! 💯' : 'Goal updated! Keep going strong! 🚀';
  }

  static formatProgressResponse(data: any, personality: 'taskmaster' | 'cheerleader'): string {
    let rate = 0;
    
    if (data?.overall_completion_rate !== undefined) {
      rate = Math.round(data.overall_completion_rate);
    } else if (data?.goal?.progress_percentage) {
      rate = Math.round(data.goal.progress_percentage);
    }
    
    if (rate > 0) {
      const emoji = rate >= 80 ? '📈' : rate >= 50 ? '💪' : '🔥';
      const action = personality === 'taskmaster' 
        ? (rate >= 80 ? 'Don\'t get comfortable!' : rate >= 50 ? 'Push harder!' : 'Time to WORK!')
        : (rate >= 80 ? 'You\'re crushing it!' : rate >= 50 ? 'Momentum building!' : 'Every step counts!');
      return `${rate}% progress. ${action} ${emoji}`;
    }

    return personality === 'taskmaster'
      ? 'Progress checked. Don\'t stop now! 🚀'
      : 'Progress looking good! Keep it up! ⭐';
  }

  static formatPreferenceResponse(data: any, personality: 'taskmaster' | 'cheerleader'): string {
    return personality === 'taskmaster'
      ? 'Settings updated. Time to perform! 💥'
      : 'Settings updated! Ready for success! 🎉';
  }

  static getFallbackResponse(personality: 'taskmaster' | 'cheerleader'): string {
    console.log('⚠️ Using fallback response - this should not happen if tools are working');
    return personality === 'taskmaster' 
      ? 'Action taken. Keep pushing forward! 💪'
      : 'Done! You\'re making great progress! ✨';
  }

  static generateToolResponse(
    toolName: string,
    data: any,
    personality: 'taskmaster' | 'cheerleader'
  ): string | null {
    console.log(`🔧 generateToolResponse: ${toolName} with data:`, JSON.stringify(data, null, 2));
    
    switch (toolName) {
      case 'manage_goal':
        return this.formatGoalResponse(data, personality);
      case 'get_progress':
        return this.formatProgressResponse(data, personality);
      case 'update_preferences':
        return this.formatPreferenceResponse(data, personality);
      default:
        console.log(`⚠️ Unknown tool name: ${toolName}`);
        return null;
    }
  }
} 