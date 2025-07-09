// WhatsApp Platform Adapter
// Formats AI tool results for WhatsApp's 8-12 word constraint

import type { ToolResult, Platform, PlatformResponse } from '../tools/types.ts';
import { WhatsAppFormatters } from './whatsapp-formatters.ts';

export class WhatsAppAdapter {
  static formatToolResults(
    toolResults: ToolResult[],
    aiResponse: string,
    personality: 'taskmaster' | 'cheerleader'
  ): PlatformResponse {
    if (toolResults.length === 0) {
      return { text: aiResponse, metadata: { tools_used: 0 } };
    }

    const enhancedResponse = this.enhanceResponseWithToolContext(aiResponse, toolResults, personality);

    return {
      text: enhancedResponse,
      metadata: {
        tools_used: toolResults.length,
        tool_names: toolResults.map(r => r.tool_name),
        success_rate: toolResults.filter(r => r.success).length / toolResults.length
      }
    };
  }

  private static enhanceResponseWithToolContext(
    aiResponse: string,
    toolResults: ToolResult[],
    personality: 'taskmaster' | 'cheerleader'
  ): string {
    // Use AI response if within word limit
    if (aiResponse.split(' ').length <= 12) return aiResponse;

    // Generate tool-specific response
    for (const result of toolResults) {
      if (result.success) {
        const toolResponse = this.generateToolSpecificResponse(result, personality);
        if (toolResponse) return toolResponse;
      }
    }

    return WhatsAppFormatters.getFallbackResponse(personality);
  }

  private static generateToolSpecificResponse(
    result: ToolResult,
    personality: 'taskmaster' | 'cheerleader'
  ): string | null {
    return WhatsAppFormatters.generateToolResponse(result.tool_name, result.data, personality);
  }

  // Formatting methods moved to WhatsAppFormatters class

  static shouldUseFastPath(message: string): boolean {
    // Simple messages that don't need tool processing
    const simplePatterns = [
      /^(hi|hey|hello|yo)$/i,
      /^(thanks|thank you)$/i,
      /^(ok|okay|got it)$/i,
      /^(yes|no|yeah|nah)$/i
    ];
    
    return simplePatterns.some(pattern => pattern.test(message.trim()));
  }

  static extractPlatformMetadata(message: string): Record<string, any> {
    return {
      platform: 'whatsapp',
      message_length: message.length,
      word_count: message.split(' ').length,
      timestamp: new Date().toISOString()
    };
  }
} 