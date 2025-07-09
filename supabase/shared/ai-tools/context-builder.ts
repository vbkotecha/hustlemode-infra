// Context Builder for AI Tool Results
// Formats tool execution results into AI-readable context

import type { ToolResult, ConversationMessage, Personality } from '../tools/types.ts';

export class ContextBuilder {
  static buildToolContext(toolResults: ToolResult[]): string {
    if (toolResults.length === 0) return '';
    
    const contextParts = toolResults.map(result => {
      if (!result.success) return `Tool ${result.tool_name} failed: ${result.error}`;
      
      switch (result.tool_name) {
        case 'manage_goal':
          return this.formatGoalContext(result);
        case 'get_progress':
          return this.formatProgressContext(result);
        default:
          return `Tool ${result.tool_name} executed successfully`;
      }
    });
    
    return `Context from tools: ${contextParts.join('. ')}.`;
  }

  static buildMessages(
    message: string,
    conversationContext: string = '',
    toolContext: string = '',
    personality: Personality
  ): ConversationMessage[] {
    const contextualMessage = [
      conversationContext,
      toolContext,
      `User message: "${message}"`
    ].filter(Boolean).join('\n\n');
    
    return [{
      role: 'user',
      content: contextualMessage,
      timestamp: new Date().toISOString()
    }];
  }

  private static formatGoalContext(result: ToolResult): string {
    const data = result.data;
    if (data?.goals) {
      return `User has ${data.goals.length} active goals: ${data.goals.map((g: any) => g.title).join(', ')}`;
    }
    if (data?.goal) {
      return `Goal "${data.goal.title}" ${data.message?.toLowerCase() || 'processed'}`;
    }
    return 'Goal operation completed';
  }

  private static formatProgressContext(result: ToolResult): string {
    const data = result.data;
    if (data?.overall_completion_rate !== undefined) {
      return `Overall progress: ${data.overall_completion_rate.toFixed(0)}%, ${data.goals_on_track} goals on track, ${data.goals_behind} behind`;
    }
    return 'Progress data retrieved';
  }
} 