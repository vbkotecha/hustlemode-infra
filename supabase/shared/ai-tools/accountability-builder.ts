// Accountability Context Builder - Extracted from session-context.ts
import { getSupabaseClient } from '../database/client.ts';

interface Goal {
  id: string;
  title: string;
  goal_type: string;
  status: string;
  days_active: number;
}

export class AccountabilityBuilder {
  private _db: any = null;

  private get db() {
    if (!this._db) {
      this._db = getSupabaseClient();
    }
    return this._db;
  }

  async fetchUserGoals(userId: string): Promise<Goal[]> {
    try {
      const { data, error } = await this.db
        .from('user_goals')
        .select('id, title, goal_type, status, created_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ Failed to fetch user goals:', error);
        return [];
      }

      return (data || []).map(goal => ({
        ...goal,
        days_active: Math.ceil((Date.now() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24))
      }));
    } catch (error) {
      console.error('❌ Database error fetching goals:', error);
      return [];
    }
  }

  buildActivitySummary(goals: Goal[]): string {
    if (goals.length === 0) return 'No active goals';
    
    const recentGoals = goals.filter(g => g.days_active <= 7);
    const ongoingGoals = goals.filter(g => g.days_active > 7);
    
    if (recentGoals.length > 0) {
      return `${recentGoals.length} new goals started, ${ongoingGoals.length} ongoing`;
    }
    
    return `${goals.length} active goals, focus on consistency`;
  }

  formatAccountabilityInfo(goalCount: number, goals: Goal[], activitySummary: string): string {
    if (goalCount === 0) {
      return 'ACCOUNTABILITY: No active goals. Focus on goal setting and action planning.';
    }

    return `
ACCOUNTABILITY CONTEXT:
- Active Goals: ${goalCount} goals
- Goal Summary: ${goals.map(g => g.title).join(', ')}
- Recent Activity: ${activitySummary}`;
  }

  formatConversationIntelligence(conversationState: any, unresolvedNeeds: string[], conversationProgression: string): string {
    return `
CONVERSATION INTELLIGENCE:
- Current Topic: ${conversationState.currentTopic}
- Depth Level: ${conversationState.depthLevel}
- Coaching Type: ${conversationState.lastCoachingType}
- Domain: ${conversationState.lastDomain}
- Conversation Turns: ${conversationState.conversationTurns}
- Progression: ${conversationProgression}
- Unresolved Needs: ${unresolvedNeeds.join(', ') || 'None'}
- Needs Deep Dive: ${conversationState.needsDeepDive ? 'Yes' : 'No'}`;
  }
} 