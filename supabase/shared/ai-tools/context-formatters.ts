// Context Formatters - Extracted from context-builder.ts
import type { ToolResult } from '../tools/types.ts';

export class ContextFormatters {
  static formatGoalContext(result: ToolResult): string {
    const data = result.data;
    
    if (!data) return '';

    if (data.goals && Array.isArray(data.goals)) {
      const goals = data.goals.slice(0, 5); // Limit to 5 goals
      return goals.map((goal: any) => 
        `• ${goal.title} (${goal.status || 'active'}, ${goal.progress_percentage || 0}% complete)`
      ).join('\n');
    }

    if (data.goal) {
      const goal = data.goal;
      return `Goal: ${goal.title} - ${goal.status || 'active'} (${goal.progress_percentage || 0}% complete)`;
    }

    if (data.goal_created || data.goal_updated) {
      return `Goal operation successful: ${JSON.stringify(data)}`;
    }

    return `Goal data: ${JSON.stringify(data)}`;
  }

  static formatProgressContext(result: ToolResult): string {
    const data = result.data;
    
    if (!data) return '';

    if (data.goals && Array.isArray(data.goals)) {
      return data.goals.map((goal: any) => {
        const progress = goal.progress_percentage || 0;
        const days = goal.days_active || 0;
        return `• ${goal.title}: ${progress}% complete (${days} days active)`;
      }).join('\n');
    }

    if (data.progress_percentage !== undefined) {
      return `Progress: ${data.progress_percentage}% complete`;
    }

    return `Progress data: ${JSON.stringify(data)}`;
  }

  static formatConflictAnalysisContext(result: ToolResult): string {
    const data = result.data;
    
    if (!data || !data.conflicts) return '';

    const conflicts = data.conflicts.slice(0, 3); // Limit to 3 conflicts
    return conflicts.map((conflict: any) => 
      `⚠️ ${conflict.type}: ${conflict.description}`
    ).join('\n');
  }

  static formatAmendmentContext(result: ToolResult): string {
    const data = result.data;
    
    if (!data || !data.suggestions) return '';

    const suggestions = data.suggestions.slice(0, 3); // Limit to 3 suggestions
    return suggestions.map((suggestion: any) => 
      `💡 ${suggestion.type}: ${suggestion.description}`
    ).join('\n');
  }

  static formatPreferencesContext(result: ToolResult): string {
    const data = result.data;
    
    if (!data) return '';

    const updates = [];
    if (data.default_personality) updates.push(`Personality: ${data.default_personality}`);
    if (data.accountability_level) updates.push(`Accountability: ${data.accountability_level}`);
    
    return updates.length > 0 ? 
      `Preferences updated: ${updates.join(', ')}` : 
      'Preferences updated successfully';
  }

  static formatEnhancedCoachingContext(result: ToolResult): string {
    const data = result.data;
    
    if (!data || !data.coaching_response) return '';

    return `Expert coaching: ${data.coaching_response} (${data.domain} - ${data.coaching_type})`;
  }
} 