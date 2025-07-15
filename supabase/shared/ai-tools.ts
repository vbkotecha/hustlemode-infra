// AI Tool Integration Service
// Main orchestrator for AI + tool execution with session-aware accountability context

import { GroqService } from './groq.ts';
import { executeTool } from './tools/executor.ts';
import { MessageAnalyzer } from './ai-tools/message-analyzer.ts';
import { getSupabaseClient } from './database/index.ts';
import type { ToolExecution, ToolResult, Platform, Personality, ConversationMessage } from './tools/types.ts';

export class AIToolService {
  private groqService: GroqService;
  private db = getSupabaseClient();

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
      console.log(`🎯 Starting enhanced AI processing for user ${userId}`);
      
      // STEP 1: Get user goals for context
      const { data: goals } = await this.db
        .from('user_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');
      
      // STEP 2: Check if message requires tool execution
      const toolAnalysis = await MessageAnalyzer.analyzeMessageForTools(
        message, 
        userId, 
        platform, 
        conversationContext
      );
      
      let toolResults: ToolResult[] = [];
      
      // STEP 3: Execute tools if needed
      if (toolAnalysis.requiresTools) {
        console.log(`🔧 Executing ${toolAnalysis.tools.length} tools`);
        toolResults = await this.executeTools(toolAnalysis.tools);
      }
      
      // STEP 4: Build enhanced context message with fresh tool results
      let latestGoals = goals || [];
      
      // Use fresh goal data from tool results if available
      if (toolResults.length > 0) {
        const goalToolResult = toolResults.find(r => r.tool_name === 'manage_goal' && r.success);
        if (goalToolResult?.data?.goals) {
          latestGoals = goalToolResult.data.goals;
          console.log(`🔄 Using fresh goal data from tools: ${latestGoals.length} goals`);
        }
      }
      
      const messages = this.buildEnhancedMessage(message, latestGoals, conversationContext, personality);
      const aiResponse = await this.groqService.getChatCompletion(messages, personality);
      
      const processingTime = performance.now() - startTime;
      console.log(`⚡ Enhanced AI completed in ${processingTime.toFixed(1)}ms`);
      
      return {
        response: aiResponse,
        toolsUsed: toolResults,
        processingTime
      };
    } catch (error) {
      console.error('❌ AI Tool service error:', error);
      
      // Simple fallback without complex analysis
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

  private buildEnhancedMessage(
    message: string, 
    goals: any[], 
    conversationContext: string = '', 
    personality: Personality
  ): ConversationMessage[] {
    
    const goalContext = goals.length > 0 
      ? `Current active goals (${goals.length}): ${goals.map(g => g.title).join(', ')}`
      : 'No active goals set';
    
    const contextualPrompt = `You are an expert accountability coach. 

Current user context:
${goalContext}

${conversationContext ? `Recent conversation: ${conversationContext}` : ''}

Provide expert coaching based on the user's message. Use domain expertise (fitness, learning, productivity, etc.) and give specific, actionable advice. Be concise but comprehensive.`;

    return [
      { role: 'system', content: contextualPrompt, timestamp: new Date().toISOString() },
      { role: 'user', content: message, timestamp: new Date().toISOString() }
    ];
  }

  private async executeTools(toolExecutions: ToolExecution[]): Promise<ToolResult[]> {
    const results = await Promise.all(
      toolExecutions.map(execution => executeTool(execution))
    );
    return results;
  }
} 