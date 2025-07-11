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

  static buildContextualMessage(
    userMessage: string,
    accountabilityContext: any,
    personality: 'taskmaster' | 'cheerleader'
  ): any[] {
    const systemPrompt = this.buildSystemPrompt(accountabilityContext, personality);
    
    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage, timestamp: new Date().toISOString() }
    ];
  }

  private static buildSystemPrompt(context: any, personality: 'taskmaster' | 'cheerleader'): string {
    const goalContext = this.formatGoalContext(context);
    const personalityTraits = this.getPersonalityTraits(personality);
    
    return `${personalityTraits}

USER STATUS:
${goalContext}

RESPONSE RULES:
- Keep responses under 15 words
- Have normal, friendly conversations like a regular person
- For casual conversation, respond naturally without mentioning goals at all
- Only reference USER STATUS when user specifically asks about goals
- ${personality === 'taskmaster' ? 'Be direct but friendly when goals come up' : 'Be encouraging when goals come up'}
- If conflicts detected, acknowledge them and suggest action

CONVERSATION CONTEXT:
- Act like a normal friend having a conversation
- Only bring up goals when user explicitly asks about them
- Don't force motivation or accountability into casual chat
- Sound human, not like a bot obsessed with goals

CONFLICT AWARENESS:
- If USER STATUS shows goal conflicts, address them directly
- Suggest prioritization or amendments when conflicts exist
- Encourage goal optimization over goal abandonment`;
  }

  private static getPersonalityTraits(personality: 'taskmaster' | 'cheerleader'): string {
    if (personality === 'taskmaster') {
      return `You are HustleMode, a helpful friend who happens to help with goals when asked.
CRITICAL: Have normal conversations. Only use goal data from USER STATUS when goals are specifically discussed.`;
    } else {
      return `You are HustleMode, a supportive friend who helps with goals when needed.
CRITICAL: Have normal conversations. Only use goal data from USER STATUS when goals are specifically discussed.`;
    }
  }

  private static formatGoalContext(context: any): string {
    console.log('🎯 Formatting context:', JSON.stringify(context, null, 2));
    
    // Handle goals with potential conflicts (new conversational approach)
    if (context.has_potential_conflicts && context.conversational_message) {
      const action = context.goal_created ? 'created' : context.goal_updated ? 'updated' : 'processed';
      return `Goal ${action} with note: ${context.conversational_message}`;
    }
    
    // Handle goal deletion with helpful info
    if (context.deleted_goal) {
      const goalTitle = context.deleted_goal.title || 'Goal';
      const timeFreed = context.time_freed || 0;
      return timeFreed > 0 
        ? `"${goalTitle}" deleted successfully. Freed up ${timeFreed} hours daily for other activities.`
        : `"${goalTitle}" deleted successfully. More focus available for remaining goals.`;
    }
    
    // Handle conflict analysis results
    if (context.conflict_pairs !== undefined) {
      return this.formatConflictAnalysisContext(context);
    }
    
    // Handle amendment suggestions
    if (context.amendments && context.amendments.length > 0) {
      return this.formatAmendmentContext(context);
    }
    
    // Handle goal conflicts in creation/update (legacy approach)
    if (context.conflicts && context.conflicts.length > 0 && !context.has_potential_conflicts) {
      return this.formatGoalConflictContext(context);
    }
    
    // Standard goal context
    if (context.goals !== undefined) {
      console.log('✅ Found goals array with length:', context.goals.length);
      
      if (context.goals.length === 0) {
        return 'No active goals found. User should create some goals first';
      }
      
      const goalTitles = context.goals.map((g: any) => g.title || g.goal_title || 'Untitled Goal').join(', ');
      return `User has ${context.goals.length} active goals: ${goalTitles}`;
    }
    
    if (context.goal) {
      const goalAction = context.goal_created ? 'created' : context.goal_updated ? 'updated' : 'processed';
      return `Goal "${context.goal.title}" ${goalAction} successfully`;
    }
    
    return 'No goal data available';
  }

  private static formatConflictAnalysisContext(context: any): string {
    const { total_goals, conflict_pairs, summary, recommendations } = context;
    
    if (conflict_pairs === 0) {
      return `${total_goals} goals analyzed - NO CONFLICTS detected. Goals are well-aligned.`;
    }
    
    const conflictTypes = [];
    if (summary.time_conflicts > 0) conflictTypes.push(`${summary.time_conflicts} time conflicts`);
    if (summary.resource_conflicts > 0) conflictTypes.push(`${summary.resource_conflicts} resource conflicts`);
    if (summary.capacity_conflicts > 0) conflictTypes.push(`${summary.capacity_conflicts} capacity conflicts`);
    if (summary.priority_conflicts > 0) conflictTypes.push(`${summary.priority_conflicts} priority conflicts`);
    
    const conflictSummary = conflictTypes.join(', ');
    const topRecommendation = recommendations && recommendations.length > 0 ? recommendations[0] : 'Review and prioritize goals';
    
    return `${total_goals} goals with ${conflict_pairs} CONFLICTS: ${conflictSummary}. Key recommendation: ${topRecommendation}`;
  }

  private static formatAmendmentContext(context: any): string {
    const { goals_analyzed, goals_with_conflicts, amendments } = context;
    
    if (goals_with_conflicts === 0) {
      return `${goals_analyzed} goals analyzed - NO AMENDMENTS needed. Goals are optimized.`;
    }
    
    const totalSuggestions = amendments.reduce((sum: number, amendment: any) => sum + amendment.suggestions.length, 0);
    const improvementTypes = amendments.flatMap((a: any) => a.suggestions.map((s: any) => s.type));
    const uniqueTypes = [...new Set(improvementTypes)];
    
    return `${goals_with_conflicts} of ${goals_analyzed} goals need improvement. ${totalSuggestions} suggestions ready: ${uniqueTypes.join(', ')}`;
  }

  private static formatGoalConflictContext(context: any): string {
    const { conflicts, goal_created, goal_updated, message } = context;
    const action = goal_created === false ? 'creation' : goal_updated === false ? 'update' : 'operation';
    
    const conflictDetails = conflicts.map((conflict: any) => {
      const conflictingGoal = conflict.conflicting_goal?.title || 'existing goal';
      const conflictTypes = conflict.conflict_types?.map((ct: any) => ct.type).join(', ') || 'general';
      return `conflicts with "${conflictingGoal}" (${conflictTypes})`;
    }).join('; ');
    
    return `Goal ${action} BLOCKED due to conflicts: ${conflictDetails}. ${message || 'Resolution needed.'}`;
  }

  private static formatGoalContext(result: ToolResult): string {
    const data = result.data;
    console.log('🎯 Formatting goal context with data:', JSON.stringify(data, null, 2));
    
    // Handle goals with potential conflicts (new conversational approach)
    if (data?.has_potential_conflicts && data?.conversational_message) {
      const action = data.goal_created ? 'created' : data.goal_updated ? 'updated' : 'processed';
      return `Goal ${action} with note: ${data.conversational_message}`;
    }
    
    // Handle goal deletion with helpful info
    if (data?.deleted_goal) {
      const goalTitle = data.deleted_goal.title || 'Goal';
      const timeFreed = data.time_freed || 0;
      return timeFreed > 0 
        ? `"${goalTitle}" deleted successfully. Freed up ${timeFreed} hours daily for other activities.`
        : `"${goalTitle}" deleted successfully. More focus available for remaining goals.`;
    }
    
    // Handle conflict detection responses (legacy)
    if (data?.conflicts && data.conflicts.length > 0 && !data?.has_potential_conflicts) {
      return this.formatGoalConflictContext(data);
    }
    
    // Handle amendment suggestions
    if (data?.amendments && data.amendments.length > 0) {
      return this.formatAmendmentContext(data);
    }
    
    // Handle conflict analysis results
    if (data?.conflict_pairs !== undefined) {
      return this.formatConflictAnalysisContext(data);
    }
    
    // DEBUG MODE: Return debug info if available
    if (data?.debug_info) {
      return `DEBUG: User ${data.debug_info.user_id} - UserCheck: ${JSON.stringify(data.debug_info.user_check?.data || data.debug_info.user_check?.error)} - Goals: ${JSON.stringify(data.debug_info.all_goals?.data)} - RPC: ${JSON.stringify(data.debug_info.rpc_result?.data)}`;
    }
    
    if (data?.goals !== undefined) {
      console.log('✅ Found goals array with length:', data.goals.length);
      console.log('📋 Goals data:', JSON.stringify(data.goals, null, 2));
      
      if (data.goals.length === 0) {
        console.log('📋 Goals array is empty - returning explicit message');
        return 'No active goals found. User should create some goals first';
      }
      
      // Handle RPC function results which use goal_id instead of id and different structure
      const goalTitles = data.goals.map((g: any) => {
        // RPC function returns goal_id, title, goal_type etc
        return g.title || g.goal_title || 'Untitled Goal';
      }).join(', ');
      
      const context = `User has ${data.goals.length} active goals: ${goalTitles}`;
      console.log('🎯 Goal list context:', context);
      return context;
    }
    if (data?.goal) {
      const goalAction = data.goal_created ? 'created' : data.goal_updated ? 'updated' : 'processed';
      const context = `Goal "${data.goal.title}" ${goalAction} successfully`;
      console.log('🎯 Single goal context:', context);
      return context;
    }
    console.log('⚠️ No goal data found, using fallback');
    console.log('⚠️ Full result data:', JSON.stringify(result, null, 2));
    return 'Goal operation completed but no data returned';
  }

  private static formatProgressContext(result: ToolResult): string {
    const data = result.data;
    if (data?.overall_completion_rate !== undefined) {
      return `Overall progress: ${data.overall_completion_rate.toFixed(0)}%, ${data.goals_on_track} goals on track, ${data.goals_behind} behind`;
    }
    return 'Progress data retrieved';
  }
} 