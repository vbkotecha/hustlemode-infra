// AI Tool Integration Service
// Main orchestrator for AI + tool execution

import { GroqService } from './groq.ts';
import { executeTool } from './tools/executor.ts';
import { MessageAnalyzer } from './ai-tools/message-analyzer.ts';
import { ContextBuilder } from './ai-tools/context-builder.ts';
import type { ToolExecution, ToolResult, Platform, Personality } from './tools/types.ts';

export class AIToolService {
  private groqService: GroqService;

  constructor() {
    this.groqService = new GroqService();
  }

  async generateToolAwareResponse(
    message: string,
    userId: string,
    platform: Platform,
    personality: Personality = 'taskmaster',
    conversationContext?: string
  ): Promise<{
    response: string;
    toolsUsed: ToolResult[];
    processingTime: number;
  }> {
    const startTime = performance.now();
    
    try {
      // Analyze if message requires tool usage
      const toolAnalysis = await MessageAnalyzer.analyzeMessageForTools(message, userId, platform);
      
      let toolResults: ToolResult[] = [];
      let contextualInfo = '';
      
      // Execute tools if needed
      if (toolAnalysis.requiresTools) {
        console.log(`🔧 Executing ${toolAnalysis.tools.length} tools for: ${message}`);
        toolResults = await this.executeTools(toolAnalysis.tools);
        contextualInfo = ContextBuilder.buildToolContext(toolResults);
      }
      
      // Generate AI response with tool context
      const messages = ContextBuilder.buildMessages(message, conversationContext, contextualInfo, personality);
      const aiResponse = await this.groqService.getChatCompletion(messages, personality);
      
      const processingTime = performance.now() - startTime;
      console.log(`⚡ AI + Tools completed in ${processingTime.toFixed(1)}ms`);
      
      return {
        response: aiResponse,
        toolsUsed: toolResults,
        processingTime
      };
    } catch (error) {
      console.error('❌ AI Tool service error:', error);
      const fallbackResponse = await this.groqService.getChatCompletion(
        [{ role: 'user', content: message, timestamp: new Date().toISOString() }],
        personality
      );
      
      return {
        response: fallbackResponse,
        toolsUsed: [],
        processingTime: performance.now() - startTime
      };
    }
  }



  private async executeTools(toolExecutions: ToolExecution[]): Promise<ToolResult[]> {
    const results = await Promise.all(
      toolExecutions.map(execution => executeTool(execution))
    );
    return results;
  }
} 