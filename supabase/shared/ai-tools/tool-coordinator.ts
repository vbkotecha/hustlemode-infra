// Tool Coordinator - Handles tool creation logic
import { Platform, ToolExecution } from '../tools/types.ts';
import { EnhancedIntentAnalysis } from './intent-analyzer.ts';
import { ToolCreators } from './tool-creators.ts';

export class ToolCoordinator {
  private _toolCreators: ToolCreators | null = null;

  private get toolCreators(): ToolCreators {
    if (!this._toolCreators) {
      this._toolCreators = new ToolCreators();
    }
    return this._toolCreators;
  }

  async createTools(
    message: string,
    userId: string,
    platform: Platform,
    intentAnalysis: EnhancedIntentAnalysis
  ): Promise<ToolExecution[]> {
    const tools: ToolExecution[] = [];

    if (intentAnalysis.requiresGoalManagement) {
      const goalTool = await this.toolCreators.createGoalToolExecutionEnhanced(
        message, userId, platform, intentAnalysis
      );
      if (goalTool) tools.push(goalTool);
    }

    if (this.needsEnhancedCoaching(intentAnalysis)) {
      const coachingTool = this.toolCreators.createEnhancedCoachingTool(
        message, userId, platform, intentAnalysis
      );
      tools.push(coachingTool);
    }

    if (intentAnalysis.requiresPreferenceChange) {
      const prefTool = await this.toolCreators.createPreferenceToolExecutionLLM(
        message, userId, platform
      );
      if (prefTool) tools.push(prefTool);
    }

    return tools;
  }

  private needsEnhancedCoaching(intentAnalysis: EnhancedIntentAnalysis): boolean {
    return intentAnalysis.depth_level !== 'surface' ||
           intentAnalysis.coaching_type === 'strategic' ||
           intentAnalysis.coaching_type === 'troubleshooting' ||
           intentAnalysis.unresolved_needs.length > 0;
  }
} 