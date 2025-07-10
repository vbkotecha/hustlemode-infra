// Message Analysis for AI Tool Detection
import type { ToolExecution, Platform } from '../tools/types.ts';

export class MessageAnalyzer {
  static async analyzeMessageForTools(
    message: string, 
    userId: string, 
    platform: Platform
  ): Promise<{ requiresTools: boolean; tools: ToolExecution[] }> {
    const tools: ToolExecution[] = [];
    const lowerMessage = message.toLowerCase();
    
    if (this.isGoalCommand(lowerMessage)) {
      tools.push(this.createGoalToolExecution(message, userId, platform));
    }
    
    if (this.isProgressInquiry(lowerMessage)) {
      tools.push({ tool_name: 'get_progress', parameters: { time_period: 'week' }, user_id: userId, platform });
    }
    
    if (this.isPreferenceChange(lowerMessage)) {
      tools.push(this.createPreferenceToolExecution(message, userId, platform));
    }
    
    return { requiresTools: tools.length > 0, tools };
  }

  private static isGoalCommand(message: string): boolean {
    const goalKeywords = ['set goal', 'add goal', 'create goal', 'my goals', 'list goals', 'complete goal'];
    return goalKeywords.some(keyword => message.includes(keyword));
  }

  private static isProgressInquiry(message: string): boolean {
    const progressKeywords = ['progress', 'how am i doing', 'goals status', 'check in', 'update'];
    return progressKeywords.some(keyword => message.includes(keyword));
  }

  private static isPreferenceChange(message: string): boolean {
    const prefKeywords = ['accountability level', 'check-in frequency', 'coaching style'];
    return prefKeywords.some(keyword => message.includes(keyword));
  }

  private static createGoalToolExecution(message: string, userId: string, platform: Platform): ToolExecution {
    const lower = message.toLowerCase();
    
    if (lower.includes('my goals') || lower.includes('list goals') || lower.includes('debug my goals')) {
      const isDebug = lower.includes('debug');
      return { 
        tool_name: 'manage_goal', 
        parameters: { 
          action: 'list',
          debug: isDebug 
        }, 
        user_id: userId, 
        platform 
      };
    }
    
    if (lower.includes('set goal') || lower.includes('add goal')) {
      const title = this.extractGoalTitle(message);
      return { tool_name: 'manage_goal', parameters: { action: 'create', title, goal_type: 'habit' }, user_id: userId, platform };
    }
    
    return { tool_name: 'manage_goal', parameters: { action: 'list' }, user_id: userId, platform };
  }

  private static extractGoalTitle(message: string): string {
    const match = message.match(/(?:set|add|create)\s+goal[:\s]+(.+)/i);
    return match ? match[1].trim() : 'New Goal';
  }

  private static createPreferenceToolExecution(message: string, userId: string, platform: Platform): ToolExecution {
    return { tool_name: 'update_preferences', parameters: {}, user_id: userId, platform };
  }
} 