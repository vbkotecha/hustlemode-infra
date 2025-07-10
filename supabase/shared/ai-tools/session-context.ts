// Session Context Builder - Always loads current user state for accountability coaching
import { getSupabaseClient } from '../database/index.ts';
import type { ConversationMessage, Personality } from '../tools/types.ts';

export interface AccountabilityContext {
  currentGoals: Goal[];
  goalCount: number;
  recentActivity: string;
  conversationContext: string;
}

interface Goal {
  id: string;
  title: string;
  goal_type: string;
  status: string;
  days_active: number;
}

export class SessionContextBuilder {
  private db = getSupabaseClient();

  async buildAccountabilityContext(userId: string, conversationMemory?: string): Promise<AccountabilityContext> {
    console.log(`🎯 Building accountability context for user ${userId}`);
    
    try {
      // Always load current goals fresh from database
      const { data: goals, error } = await this.db.rpc('get_user_active_goals', { 
        p_user_id: userId 
      });
      
      if (error) {
        console.error('❌ Failed to load goals:', error);
        return this.buildEmptyContext(conversationMemory);
      }
      
      const currentGoals = goals || [];
      console.log(`📋 Loaded ${currentGoals.length} active goals`);
      
      return {
        currentGoals,
        goalCount: currentGoals.length,
        recentActivity: this.buildActivitySummary(currentGoals),
        conversationContext: conversationMemory || ''
      };
    } catch (error) {
      console.error('❌ Context building error:', error);
      return this.buildEmptyContext(conversationMemory);
    }
  }

  buildContextualMessage(
    message: string,
    context: AccountabilityContext,
    personality: Personality
  ): ConversationMessage[] {
    console.log('📝 Building contextual message with accountability data');
    
    // Build accountability-aware prompt
    const accountabilityInfo = this.formatAccountabilityInfo(context);
    const contextualContent = [
      accountabilityInfo,
      context.conversationContext,
      `User message: "${message}"`
    ].filter(Boolean).join('\n\n');
    
    console.log('🎯 Accountability context:', accountabilityInfo);
    
    return [{
      role: 'user',
      content: contextualContent,
      timestamp: new Date().toISOString()
    }];
  }

  private formatAccountabilityInfo(context: AccountabilityContext): string {
    if (context.goalCount === 0) {
      return 'USER STATUS: No active goals set. User needs to create goals first.';
    }
    
    const goalTitles = context.currentGoals.map(g => g.title).join(', ');
    return `USER STATUS: ${context.goalCount} active goals - ${goalTitles}. Provide accountability based on these current goals.`;
  }

  private buildActivitySummary(goals: Goal[]): string {
    if (goals.length === 0) return 'No active goals';
    
    const avgDays = Math.round(goals.reduce((sum, g) => sum + g.days_active, 0) / goals.length);
    return `${goals.length} goals, average ${avgDays} days active`;
  }

  private buildEmptyContext(conversationMemory?: string): AccountabilityContext {
    return {
      currentGoals: [],
      goalCount: 0,
      recentActivity: 'No goals set',
      conversationContext: conversationMemory || ''
    };
  }
} 