// Refactored WhatsApp Formatters - Using extracted modules
import type { ToolResult } from '../tools/types.ts';
import { GoalResponseFormatters } from './goal-response-formatters.ts';
import { ResponseConstraints } from './response-constraints.ts';

export interface WhatsAppResponse {
  text: string;
  format?: 'plain' | 'structured';
  urgent?: boolean;
}

export class WhatsAppFormatters {
  static formatToolResults(
    toolResults: ToolResult[],
    fallbackResponse: string,
    personality: 'taskmaster' | 'cheerleader'
  ): WhatsAppResponse {
    if (!toolResults || toolResults.length === 0) {
      return { text: fallbackResponse };
    }

    // Process the most relevant tool result
    const primaryResult = this.findPrimaryResult(toolResults);
    const formattedResponse = this.formatSingleResult(primaryResult, personality);
    
    return {
      text: formattedResponse,
      format: 'plain',
      urgent: ResponseConstraints.isUrgentResult(primaryResult)
    };
  }

  static formatPlainResponse(
    response: string,
    personality: 'taskmaster' | 'cheerleader'
  ): WhatsAppResponse {
    // Ensure response follows personality constraints
    const constrainedResponse = ResponseConstraints.enforcePersonalityConstraints(response, personality);
    
    return {
      text: constrainedResponse,
      format: 'plain'
    };
  }

  static formatConversationalResponse(
    response: string,
    context: any,
    personality: 'taskmaster' | 'cheerleader'
  ): WhatsAppResponse {
    // Add contextual emojis based on personality
    const emoji = personality === 'taskmaster' ? '💪' : '✨';
    const enhancedResponse = ResponseConstraints.addPersonalityFlair(response, emoji);
    
    return {
      text: enhancedResponse,
      format: 'plain'
    };
  }

  private static findPrimaryResult(toolResults: ToolResult[]): ToolResult {
    // Prioritize goal operations, then progress, then preferences
    const priorities = ['manage_goal', 'enhanced_coaching', 'get_progress', 'update_preferences'];
    
    for (const priority of priorities) {
      const result = toolResults.find(r => r.tool_name === priority && r.success);
      if (result) return result;
    }
    
    // Return first successful result as fallback
    return toolResults.find(r => r.success) || toolResults[0];
  }

  private static formatSingleResult(result: ToolResult, personality: 'taskmaster' | 'cheerleader'): string {
    if (!result) return ResponseConstraints.getFallbackMessage(personality);
    
    if (!result.success) {
      return this.formatErrorResponse(result, personality);
    }

    switch (result.tool_name) {
      case 'manage_goal':
        return GoalResponseFormatters.formatGoalResponse(result.data, personality);
      
      case 'enhanced_coaching':
        return this.formatCoachingResponse(result.data, personality);
      
      case 'get_progress':
        return this.formatProgressResponse(result.data, personality);
      
      case 'update_preferences':
        return this.formatPreferencesResponse(result.data, personality);
      
      default:
        return ResponseConstraints.getFallbackMessage(personality);
    }
  }

  private static formatCoachingResponse(data: any, personality: 'taskmaster' | 'cheerleader'): string {
    if (data?.coaching_response) {
      const response = data.coaching_response;
      const emoji = personality === 'taskmaster' ? '💪' : '✨';
      return `${response} ${emoji}`;
    }
    
    return ResponseConstraints.getFallbackMessage(personality);
  }

  private static formatProgressResponse(data: any, personality: 'taskmaster' | 'cheerleader'): string {
    if (data?.overall_completion_rate !== undefined) {
      const rate = Math.round(data.overall_completion_rate);
      
      if (personality === 'taskmaster') {
        return `${rate}% complete. Push harder! 💪`;
      } else {
        return `Amazing ${rate}% progress! Keep shining! ✨`;
      }
    }
    
    return ResponseConstraints.getFallbackMessage(personality);
  }

  private static formatPreferencesResponse(data: any, personality: 'taskmaster' | 'cheerleader'): string {
    if (data?.default_personality) {
      const newPersonality = data.default_personality;
      
      if (personality === 'taskmaster') {
        return `Personality: ${newPersonality}. Let's dominate! 💪`;
      } else {
        return `Personality: ${newPersonality}! Love the change! ✨`;
      }
    }
    
    return ResponseConstraints.getFallbackMessage(personality);
  }

  private static formatErrorResponse(result: ToolResult, personality: 'taskmaster' | 'cheerleader'): string {
    if (personality === 'taskmaster') {
      return 'System error. But accountability never stops! 💪';
    } else {
      return 'System hiccup! But you\'re still amazing! ✨';
    }
  }
} 