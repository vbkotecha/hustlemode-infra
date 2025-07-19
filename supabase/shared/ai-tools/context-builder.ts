// Refactored Context Builder - Using extracted formatters
import type { ToolResult, ConversationMessage, Personality } from '../tools/types.ts';
import { ContextFormatters } from './context-formatters.ts';

export class ContextBuilder {
  static buildToolContext(toolResults: ToolResult[]): string {
    if (!toolResults || toolResults.length === 0) {
      return '';
    }

    const contextLines: string[] = [];

    toolResults.forEach(result => {
      if (!result.success) {
        contextLines.push(`❌ ${result.tool_name} failed: ${result.error || 'Unknown error'}`);
        return;
      }

      const formatted = this.formatToolResult(result);
      if (formatted) {
        contextLines.push(formatted);
      }
    });

    return contextLines.length > 0 ? 
      `TOOL RESULTS:\n${contextLines.join('\n')}\n` : 
      '';
  }

  static buildMessages(
    message: string,
    conversationContext: string = '',
    toolContext: string = '',
    personality: Personality
  ): ConversationMessage[] {
    const systemPrompt = this.buildSystemPrompt(toolContext, conversationContext, personality);

    return [
      {
        role: 'system',
        content: systemPrompt,
        timestamp: new Date().toISOString()
      },
      {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      }
    ];
  }

  static buildContextualMessage(
    userMessage: string,
    accountabilityContext: any,
    personality: 'taskmaster' | 'cheerleader'
  ): ConversationMessage[] {
    const context = this.buildContextFromAccountability(accountabilityContext);
    const systemPrompt = this.buildSystemPrompt('', context, personality);

    return [
      {
        role: 'system',
        content: systemPrompt,
        timestamp: new Date().toISOString()
      },
      {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
      }
    ];
  }

  private static formatToolResult(result: ToolResult): string {
    switch (result.tool_name) {
      case 'manage_goal':
        return ContextFormatters.formatGoalContext(result);
      case 'get_progress':
        return ContextFormatters.formatProgressContext(result);
      case 'update_preferences':
        return ContextFormatters.formatPreferencesContext(result);
      case 'enhanced_coaching':
        return ContextFormatters.formatEnhancedCoachingContext(result);
      default:
        return `${result.tool_name}: ${JSON.stringify(result.data)}`;
    }
  }

  private static buildSystemPrompt(
    toolContext: string,
    conversationContext: string,
    personality: Personality
  ): string {
    const personalityTraits = this.getPersonalityTraits(personality);
    
    return `You are a ${personality} accountability coach. ${personalityTraits}

${toolContext}${conversationContext}

Respond in exactly 8-12 words: ultra-concise, actionable coaching that drives immediate action.`;
  }

  private static buildContextFromAccountability(accountabilityContext: any): string {
    if (!accountabilityContext) return '';

    const parts = [];
    
    if (accountabilityContext.currentGoals?.length > 0) {
      const goalSummary = accountabilityContext.currentGoals
        .map((g: any) => g.title)
        .slice(0, 3)
        .join(', ');
      parts.push(`GOALS: ${goalSummary}`);
    }

    if (accountabilityContext.recentActivity) {
      parts.push(`ACTIVITY: ${accountabilityContext.recentActivity}`);
    }

    return parts.length > 0 ? parts.join('\n') + '\n' : '';
  }

  private static getPersonalityTraits(personality: Personality): string {
    const traits = {
      taskmaster: 'You are direct, tough, and demand excellence. No excuses, just results.',
      cheerleader: 'You are positive, encouraging, and celebrate every win. You inspire and motivate.'
    };
    
    return traits[personality] || traits.taskmaster;
  }
} 