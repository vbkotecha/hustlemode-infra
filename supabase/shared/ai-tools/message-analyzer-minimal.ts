// Minimal MessageAnalyzer - Step 4: Add Tool Creation
import { Platform, ToolExecution } from '../tools/types.ts';
import { IntentAnalyzer, EnhancedIntentAnalysis } from './intent-analyzer.ts';
import { GoalParameterExtractor } from './goal-parameter-extractor.ts';

export class MessageAnalyzerMinimal {
  private _intentAnalyzer: IntentAnalyzer | null = null;
  private _goalExtractor: GoalParameterExtractor | null = null;

  private get intentAnalyzer(): IntentAnalyzer {
    if (!this._intentAnalyzer) {
      this._intentAnalyzer = new IntentAnalyzer();
    }
    return this._intentAnalyzer;
  }

  private get goalExtractor(): GoalParameterExtractor {
    if (!this._goalExtractor) {
      this._goalExtractor = new GoalParameterExtractor();
    }
    return this._goalExtractor;
  }
  
  static async analyzeMessageForTools(
    message: string, 
    userId: string, 
    platform: Platform,
    conversationContext?: string
  ): Promise<{ requiresTools: boolean; tools: ToolExecution[] }> {
    
    console.log('🧪 Step 4: Testing Tool Creation functionality');
    
    const analyzer = new MessageAnalyzerMinimal();
    
    try {
      // Step 1: Intent analysis
      const intentAnalysis = await analyzer.intentAnalyzer.analyzeMessageIntentEnhanced(
        message, 
        conversationContext
      );
      
      console.log('🧠 Intent Analysis Result:', {
        requiresGoalManagement: intentAnalysis.requiresGoalManagement,
        domain: intentAnalysis.domain,
        goalAction: intentAnalysis.goalAction
      });

      const tools: ToolExecution[] = [];

      // Step 2: Create goal management tool if needed
      if (intentAnalysis.requiresGoalManagement) {
        const goalTool = await analyzer.createGoalToolExecution(
          message, userId, platform, intentAnalysis
        );
        if (goalTool) {
          tools.push(goalTool);
          console.log('🔧 Goal tool created:', goalTool.tool_name);
        }
      }

      // Step 3: Create enhanced coaching tool for complex requests
      if (analyzer.needsEnhancedCoaching(intentAnalysis)) {
        const coachingTool = await analyzer.createEnhancedCoachingTool(
          message, userId, platform, intentAnalysis
        );
        if (coachingTool) {
          tools.push(coachingTool);
          console.log('🔧 Coaching tool created:', coachingTool.tool_name);
        }
      }
      
      console.log(`🔧 Total tools created: ${tools.length}`);
      
      return {
        requiresTools: tools.length > 0,
        tools: tools
      };
      
    } catch (error) {
      console.error('❌ Tool creation error:', error);
      return {
        requiresTools: false,
        tools: []
      };
    }
  }

  private async createGoalToolExecution(
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

  private async createEnhancedCoachingTool(
    message: string,
    userId: string,
    platform: Platform,
    intentAnalysis: EnhancedIntentAnalysis
  ): Promise<ToolExecution | null> {
    return {
      tool_name: 'enhanced_coaching',
      parameters: {
        message,
        domain: intentAnalysis.domain,
        coaching_type: intentAnalysis.coaching_type,
        intent_analysis: intentAnalysis
      },
      user_id: userId,
      platform
    };
  }

  private needsEnhancedCoaching(intentAnalysis: EnhancedIntentAnalysis): boolean {
    // Enhanced coaching for complex domains or detailed requests
    return intentAnalysis.domain !== 'general' || 
           intentAnalysis.coaching_type === 'detailed_strategy' ||
           intentAnalysis.coaching_type === 'domain_expertise';
  }
} 