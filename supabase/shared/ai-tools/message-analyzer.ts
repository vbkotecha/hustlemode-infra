// Refactored Message Analyzer - Using extracted modules
import { Platform, ToolExecution } from '../tools/types.ts';
import { IntentAnalyzer, EnhancedIntentAnalysis } from './intent-analyzer.ts';
import { ToolCoordinator } from './tool-coordinator.ts';
import { FallbackAnalyzer } from './fallback-analyzer.ts';

export type { EnhancedIntentAnalysis } from './intent-analyzer.ts';

export class MessageAnalyzer {
  private _intentAnalyzer: IntentAnalyzer | null = null;
  private _toolCoordinator: ToolCoordinator | null = null;
  private _fallbackAnalyzer: FallbackAnalyzer | null = null;

  private get intentAnalyzer(): IntentAnalyzer {
    if (!this._intentAnalyzer) {
      this._intentAnalyzer = new IntentAnalyzer();
    }
    return this._intentAnalyzer;
  }

  private get toolCoordinator(): ToolCoordinator {
    if (!this._toolCoordinator) {
      this._toolCoordinator = new ToolCoordinator();
    }
    return this._toolCoordinator;
  }

  private get fallbackAnalyzer(): FallbackAnalyzer {
    if (!this._fallbackAnalyzer) {
      this._fallbackAnalyzer = new FallbackAnalyzer();
    }
    return this._fallbackAnalyzer;
  }

  static async analyzeMessageForTools(
    message: string, 
    userId: string, 
    platform: Platform,
    conversationContext?: string
  ): Promise<{ requiresTools: boolean; tools: ToolExecution[] }> {
    const analyzer = new MessageAnalyzer();
    
    try {
      const intentAnalysis = await analyzer.intentAnalyzer.analyzeMessageIntentEnhanced(
        message, conversationContext
      );

      console.log('🧠 Intent Analysis:', {
        requiresGoalManagement: intentAnalysis.requiresGoalManagement,
        domain: intentAnalysis.domain,
        coaching_type: intentAnalysis.coaching_type,
        reasoning: intentAnalysis.reasoning
      });

      const tools = await analyzer.toolCoordinator.createTools(
        message, userId, platform, intentAnalysis
      );
      return { requiresTools: tools.length > 0, tools };

    } catch (error) {
      console.error('❌ Enhanced message analysis failed:', error);
      return analyzer.fallbackAnalyzer.analyzeMessageForTools(message, userId, platform);
    }
  }
} 