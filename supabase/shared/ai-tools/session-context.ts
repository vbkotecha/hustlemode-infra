// Refactored Session Context - Using extracted modules
import { ConversationStateAnalyzer, ConversationState } from './conversation-state.ts';
import { AccountabilityBuilder } from './accountability-builder.ts';
import type { ConversationMessage } from '../tools/types.ts';

export interface AccountabilityContext {
  currentGoals: any[];
  goalCount: number;
  recentActivity: string;
  conversationContext: string;
  // Enhanced conversation intelligence
  conversationState: ConversationState;
  unresolvedNeeds: string[];
  conversationProgression: 'start' | 'continue' | 'deep_dive' | 'switching_topics' | 'wrapping_up';
}

export class SessionContextBuilder {
  private stateAnalyzer = new ConversationStateAnalyzer();
  private accountabilityBuilder = new AccountabilityBuilder();

  async buildAccountabilityContext(
    userId: string, 
    conversationMemory?: string,
    currentMessage?: string
  ): Promise<AccountabilityContext> {
    try {
      // Get user's current active goals
      const goals = await this.accountabilityBuilder.fetchUserGoals(userId);
      
      if (!conversationMemory || !currentMessage) {
        return this.buildEmptyContext(conversationMemory);
      }

      // Analyze conversation state using extracted module
      const conversationState = await this.stateAnalyzer.analyzeConversationState(
        conversationMemory,
        currentMessage,
        goals
      );

      // Identify unresolved needs
      const unresolvedNeeds = await this.stateAnalyzer.identifyUnresolvedNeeds(
        conversationMemory,
        currentMessage,
        conversationState
      );

      // Determine conversation progression
      const conversationProgression = await this.stateAnalyzer.determineConversationProgression(
        conversationMemory,
        currentMessage,
        conversationState
      );

      const activitySummary = this.accountabilityBuilder.buildActivitySummary(goals);

      return {
        currentGoals: goals,
        goalCount: goals.length,
        recentActivity: activitySummary,
        conversationContext: conversationMemory.slice(-500), // Keep recent context
        conversationState,
        unresolvedNeeds,
        conversationProgression
      };

    } catch (error) {
      console.error('❌ Failed to build accountability context:', error);
      return this.buildEmptyContext(conversationMemory);
    }
  }

  buildContextualMessage(
    message: string,
    context: AccountabilityContext,
    personality: 'taskmaster' | 'cheerleader'
  ): ConversationMessage[] {
    const conversationIntelligence = this.accountabilityBuilder.formatConversationIntelligence(
      context.conversationState,
      context.unresolvedNeeds,
      context.conversationProgression
    );
    
    const accountabilityInfo = this.accountabilityBuilder.formatAccountabilityInfo(
      context.goalCount,
      context.currentGoals,
      context.recentActivity
    );

    const systemPrompt = `You are a ${personality} accountability coach. 

${conversationIntelligence}

${accountabilityInfo}

Respond in exactly 8-12 words: ultra-concise, actionable coaching that drives immediate action.`;

    return [
      {
        role: 'system',
        content: systemPrompt,
        timestamp: new Date().toISOString()
      },
      {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      }
    ];
  }

  private buildEmptyContext(conversationMemory?: string): AccountabilityContext {
    return {
      currentGoals: [],
      goalCount: 0,
      recentActivity: 'No recent activity',
      conversationContext: conversationMemory?.slice(-500) || '',
      conversationState: {
        currentTopic: 'general',
        depthLevel: 'surface',
        lastCoachingType: 'informational',
        pendingFollowUp: false,
        lastDomain: 'general',
        conversationTurns: 1,
        needsDeepDive: false
      },
      unresolvedNeeds: [],
      conversationProgression: 'start'
    };
  }
} 