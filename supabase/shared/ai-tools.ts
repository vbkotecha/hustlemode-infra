// AI Tool Integration Service
// Main orchestrator for AI + tool execution with session-aware accountability context

import { GroqService } from './groq.ts';
import { executeTool } from './tools/executor.ts';
import { MessageAnalyzer } from './ai-tools/message-analyzer.ts';
import { SessionContextBuilder } from './ai-tools/session-context.ts';
import type { ToolExecution, ToolResult, Platform, Personality } from './tools/types.ts';

export class AIToolService {
  private groqService: GroqService;
  private contextBuilder: SessionContextBuilder;

  constructor() {
    this.groqService = new GroqService();
    this.contextBuilder = new SessionContextBuilder();
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
      console.log(`🎯 Starting session-aware AI processing for user ${userId}`);
      
      // STEP 1: Always build current accountability context first
      const accountabilityContext = await this.contextBuilder.buildAccountabilityContext(
        userId, 
        conversationContext
      );
      
      // STEP 2: Check if message requires tool execution (goal management)
      const toolAnalysis = await MessageAnalyzer.analyzeMessageForTools(message, userId, platform);
      
      let toolResults: ToolResult[] = [];
      
      // STEP 3: Execute tools only for explicit goal management
      if (toolAnalysis.requiresTools) {
        console.log(`🔧 Executing ${toolAnalysis.tools.length} tools for goal management`);
        toolResults = await this.executeTools(toolAnalysis.tools);
        
        // Rebuild context after tool execution to get fresh data
        if (toolResults.some(r => r.success && r.tool_name === 'manage_goal')) {
          console.log('🔄 Rebuilding context after goal changes');
          const updatedContext = await this.contextBuilder.buildAccountabilityContext(
            userId, 
            conversationContext
          );
          
          // Use updated context for AI response
          const messages = this.contextBuilder.buildContextualMessage(message, updatedContext, personality);
          const aiResponse = await this.groqService.getChatCompletion(messages, personality);
          
          return {
            response: aiResponse,
            toolsUsed: toolResults,
            processingTime: performance.now() - startTime
          };
        }
      }
      
      // STEP 4: Generate AI response with current accountability context
      // This ensures consistent goal awareness regardless of conversation memory
      const messages = this.contextBuilder.buildContextualMessage(message, accountabilityContext, personality);
      const aiResponse = await this.groqService.getChatCompletion(messages, personality);
      
      const processingTime = performance.now() - startTime;
      console.log(`⚡ Session-aware AI completed in ${processingTime.toFixed(1)}ms`);
      console.log(`🎯 Used accountability context: ${accountabilityContext.goalCount} goals`);
      
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