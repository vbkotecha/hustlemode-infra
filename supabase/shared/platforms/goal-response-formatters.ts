// Goal Response Formatters - Extracted from whatsapp-formatters.ts
export class GoalResponseFormatters {
  static formatGoalResponse(data: any, personality: 'taskmaster' | 'cheerleader'): string {
    if (!data) return this.getFallbackResponse(personality);

    // Handle goal creation
    if (data.goal_created) {
      const goal = data.goal || data;
      const title = goal.title || 'New goal';
      
      if (personality === 'taskmaster') {
        return `Goal "${title}" created. Now execute daily! 💪`;
      } else {
        return `Amazing! "${title}" goal created! You've got this! ✨`;
      }
    }

    // Handle goal updates
    if (data.goal_updated) {
      const goal = data.goal || data;
      const title = goal.title || 'Goal';
      
      if (personality === 'taskmaster') {
        return `"${title}" updated. Stop talking, start doing! 🔥`;
      } else {
        return `"${title}" updated perfectly! Keep crushing it! 🌟`;
      }
    }

    // Handle goal deletion
    if (data.goal_deleted || data.deleted) {
      if (personality === 'taskmaster') {
        return 'Goal deleted. Focus on what matters! ⚡';
      } else {
        return 'Goal removed! Space for new dreams! 🚀';
      }
    }

    // Handle goal listing
    if (data.goals && Array.isArray(data.goals)) {
      const count = data.goals.length;
      const goalTitles = data.goals.slice(0, 3).map((g: any) => g.title).join(', ');
      
      if (count === 0) {
        if (personality === 'taskmaster') {
          return 'No goals set. Create one NOW! 💪';
        } else {
          return 'Ready to set your first goal? Let\'s go! ✨';
        }
      }

      if (personality === 'taskmaster') {
        return `${count} goals: ${goalTitles}. Execute them! 🎯`;
      } else {
        return `${count} amazing goals: ${goalTitles}! You rock! 🌟`;
      }
    }

    // Handle conflicts with potential resolution
    if (data.has_potential_conflicts && data.conversational_message) {
      if (personality === 'taskmaster') {
        return `Goal set with note: ${data.conversational_message} 💪`;
      } else {
        return `Goal created! Note: ${data.conversational_message} ✨`;
      }
    }

    return this.getFallbackResponse(personality);
  }

  static formatConflictResponse(data: any, personality: 'taskmaster' | 'cheerleader'): string {
    if (!data || !data.conflicts) return this.getFallbackResponse(personality);

    const conflictCount = data.conflicts.length;
    
    if (conflictCount === 0) {
      if (personality === 'taskmaster') {
        return 'No conflicts found. Execute your plan! 💪';
      } else {
        return 'All goals aligned perfectly! Amazing planning! ✨';
      }
    }

    const firstConflict = data.conflicts[0];
    const conflictType = firstConflict.type || 'scheduling';
    
    if (personality === 'taskmaster') {
      return `${conflictCount} conflicts detected. Priority: ${conflictType}. Fix it! ⚡`;
    } else {
      return `${conflictCount} conflicts found. Let's prioritize ${conflictType}! 🎯`;
    }
  }

  static formatAmendmentResponse(data: any, personality: 'taskmaster' | 'cheerleader'): string {
    if (!data || !data.suggestions) return this.getFallbackResponse(personality);

    const suggestionCount = data.suggestions.length;
    
    if (suggestionCount === 0) {
      if (personality === 'taskmaster') {
        return 'Goals optimized. Execute the plan! 💪';
      } else {
        return 'Goals are perfect! Keep going strong! ✨';
      }
    }

    const firstSuggestion = data.suggestions[0];
    const suggestionType = firstSuggestion.type || 'optimization';
    
    if (personality === 'taskmaster') {
      return `${suggestionCount} improvements: ${suggestionType}. Apply now! ⚡`;
    } else {
      return `${suggestionCount} great suggestions: ${suggestionType}! Let's optimize! 🚀`;
    }
  }

  private static getFallbackResponse(personality: 'taskmaster' | 'cheerleader'): string {
    if (personality === 'taskmaster') {
      return 'Goal operation complete. Keep pushing!';
    } else {
      return 'Goal updated successfully! You\'re amazing!';
    }
  }
} 