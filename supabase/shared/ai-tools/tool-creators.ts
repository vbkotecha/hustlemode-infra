// Tool Creation Logic - Extracted from message-analyzer.ts
import { Platform, ToolExecution } from '../tools/types.ts';
import { EnhancedIntentAnalysis } from './intent-analyzer.ts';
import { GoalParameterExtractor } from './goal-parameter-extractor.ts';
import { PreferenceAnalyzer } from './preference-analyzer.ts';

export class ToolCreators {
  private _goalExtractor: GoalParameterExtractor | null = null;
  private _preferenceAnalyzer: PreferenceAnalyzer | null = null;

  private get goalExtractor(): GoalParameterExtractor {
    if (!this._goalExtractor) {
      this._goalExtractor = new GoalParameterExtractor();
    }
    return this._goalExtractor;
  }

  private get preferenceAnalyzer(): PreferenceAnalyzer {
    if (!this._preferenceAnalyzer) {
      this._preferenceAnalyzer = new PreferenceAnalyzer();
    }
    return this._preferenceAnalyzer;
  }

  async createGoalToolExecutionEnhanced(
    message: string, 
    userId: string, 
    platform: Platform,
    intentAnalysis: EnhancedIntentAnalysis
  ): Promise<ToolExecution | null> {
    const action = intentAnalysis.goalAction || 'list';
    
    if (action === 'none') return null;

    const parameters = await this.goalExtractor.extractGoalParametersEnhanced(
      message, action, intentAnalysis
    );

    return {
      tool_name: 'manage_goal',
      parameters: { action, ...parameters },
      user_id: userId,
      platform
    };
  }

  createEnhancedCoachingTool(
    message: string,
    userId: string,
    platform: Platform,
    intentAnalysis: EnhancedIntentAnalysis
  ): ToolExecution {
    return {
      tool_name: 'enhanced_coaching',
      parameters: {
        message,
        domain: intentAnalysis.domain,
        depth_level: intentAnalysis.depth_level,
        coaching_type: intentAnalysis.coaching_type,
        follow_up_context: intentAnalysis.follow_up_context,
        specificity_needed: intentAnalysis.specificity_needed,
        conversation_progression: intentAnalysis.conversation_progression,
        unresolved_needs: intentAnalysis.unresolved_needs
      },
      user_id: userId,
      platform
    };
  }

  async createPreferenceToolExecutionLLM(
    message: string, 
    userId: string, 
    platform: Platform
  ): Promise<ToolExecution | null> {
    return this.preferenceAnalyzer.createPreferenceToolExecutionLLM(message, userId, platform);
  }
} 