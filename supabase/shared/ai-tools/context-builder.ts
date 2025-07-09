// Context Builder for AI Tool Results
// Formats tool execution results into AI-readable context

import type { ToolResult, ConversationMessage, Personality } from '../tools/types.ts';

export class ContextBuilder {
  static buildToolContext(toolResults: ToolResult[]): string {
    console.log('🔧 ContextBuilder.buildToolContext called with:', JSON.stringify(toolResults, null, 2));
    
    if (toolResults.length === 0) {
      console.log('⚠️ No tool results to process');
      return '';
    }
    
    const contextParts = toolResults.map(result => {
      console.log(`🔧 Processing tool result: ${result.tool_name}, success: ${result.success}`);
      
      if (!result.success) return `Tool ${result.tool_name} failed: ${result.error}`;
      
      switch (result.tool_name) {
        case 'manage_goal':
          const goalContext = this.formatGoalContext(result);
          console.log('🎯 Goal context formatted:', goalContext);
          return goalContext;
        case 'get_progress':
          return this.formatProgressContext(result);
        default:
          return `Tool ${result.tool_name} executed successfully`;
      }
    });
    
    const finalContext = `Context from tools: ${contextParts.join('. ')}.`;
    console.log('🔧 Final tool context:', finalContext);
    return finalContext;
  }

  static buildMessages(
    message: string,
    conversationContext: string = '',
    toolContext: string = '',
    personality: Personality
  ): ConversationMessage[] {
    console.log('📝 Building AI messages with:');
    console.log('  - User message:', message);
    console.log('  - Conversation context:', conversationContext);
    console.log('  - Tool context:', toolContext);
    console.log('  - Personality:', personality);
    
    const contextualMessage = [
      conversationContext,
      toolContext,
      `User message: "${message}"`
    ].filter(Boolean).join('\n\n');
    
    console.log('📝 Final contextual message sent to AI:', contextualMessage);
    
    return [{
      role: 'user',
      content: contextualMessage,
      timestamp: new Date().toISOString()
    }];
  }

  private static formatGoalContext(result: ToolResult): string {
    const data = result.data;
    console.log('🎯 Formatting goal context with data:', JSON.stringify(data, null, 2));
    
    if (data?.goals) {
      const goalTitles = data.goals.map((g: any) => g.title).join(', ');
      const context = `User has ${data.goals.length} active goals: ${goalTitles}`;
      console.log('🎯 Goal list context:', context);
      return context;
    }
    if (data?.goal) {
      const context = `Goal "${data.goal.title}" ${data.message?.toLowerCase() || 'processed'}`;
      console.log('🎯 Single goal context:', context);
      return context;
    }
    console.log('⚠️ No goal data found, using fallback');
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