// WhatsApp Platform Adapter
// Formats AI tool results for WhatsApp's 8-12 word constraint

import type { ToolResult, Platform, PlatformResponse } from '../tools/types.ts';
import { WhatsAppFormatters } from './whatsapp-formatters.ts';
import { ResponseConstraints } from './response-constraints.ts';

export class WhatsAppAdapter {
  static formatToolResults(
    toolResults: ToolResult[],
    aiResponse: string,
    personality: 'taskmaster' | 'cheerleader'
  ): PlatformResponse {
    if (toolResults.length === 0) {
      // Allow longer responses for enhanced coaching (up to 50 words)
      const responseText = aiResponse.split(' ').length <= 50 
        ? aiResponse 
        : ResponseConstraints.getFallbackMessage(personality);
      return { text: responseText, metadata: { tools_used: 0 } };
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
    // Use AI response if within enhanced word limit for coaching
    if (aiResponse.split(' ').length <= 50) return aiResponse;

    // Generate tool-specific response
    for (const result of toolResults) {
      if (result.success) {
        const toolResponse = this.generateToolSpecificResponse(result, personality);
        if (toolResponse) return toolResponse;
      }
    }

    return ResponseConstraints.getFallbackMessage(personality);
  }

  private static generateToolSpecificResponse(
    result: ToolResult,
    personality: 'taskmaster' | 'cheerleader'
  ): string | null {
    // Use WhatsAppFormatters for tool-specific formatting
    const formatterResponse = WhatsAppFormatters.formatToolResults([result], '', personality);
    return formatterResponse.text || null;
  }

  // Formatting methods moved to WhatsAppFormatters class

  static async shouldUseFastPath(message: string): Promise<boolean> {
    // ✅ SEMANTIC LLM ANALYSIS - No regex patterns
    const analysisPrompt = `
Analyze if this message requires simple vs complex processing:

Message: "${message}"

Is this a simple greeting/casual message that can be handled with basic AI response, or does it require complex tool processing (goals, preferences, etc.)?

Respond in JSON:
{
  "isSimpleMessage": boolean,
  "messageType": "greeting|casual|question|goal_related|preference|complex",
  "reasoning": "why this message is simple or complex"
}

Simple messages: greetings, casual chat, basic questions
Complex messages: goal management, preference changes, progress tracking`;

    try {
      const { GroqService } = await import('../groq.ts');
      const groqService = new GroqService();
      
      const response = await groqService.getChatCompletion([{
        role: 'user',
        content: analysisPrompt,
        timestamp: new Date().toISOString()
      }], 'taskmaster', 120);

      const analysis = JSON.parse(response.replace(/```json\n?|\n?```/g, ''));
      return analysis.isSimpleMessage;
    } catch (error) {
      console.error('❌ Fast path LLM analysis failed:', error);
      // Conservative fallback - use complex path when unsure
      return false;
    }
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