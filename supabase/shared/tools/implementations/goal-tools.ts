// Refactored Goal Tools - Using extracted handlers
import type { ToolExecution, ToolResult, Platform } from '../types.ts';
import { GoalCoachingService } from './goal-coaching.ts';
import {
  handleGoalCreate,
  handleGoalUpdate,
  handleGoalList,
  handleGoalDelete,
  handleConflictAnalysis,
  handleAmendmentSuggestions
} from './goal-operations.ts';

export class GoalToolImplementation {
  private _coachingService: GoalCoachingService | null = null;

  private get coachingService(): GoalCoachingService {
    if (!this._coachingService) {
      this._coachingService = new GoalCoachingService();
    }
    return this._coachingService;
  }

  static async executeGoalTool(
    toolExecution: ToolExecution,
    userId: string,
    platform: Platform
  ): Promise<ToolResult> {
    const implementation = new GoalToolImplementation();
    const { action } = toolExecution.parameters;
    const startTime = performance.now();

    try {
      let result;

      switch (action) {
        case 'create':
          result = await handleGoalCreate(toolExecution, userId, platform);
          break;
        case 'update':
          result = await handleGoalUpdate(toolExecution, userId, platform);
          break;
        case 'list':
          result = await handleGoalList(toolExecution, userId, platform);
          break;
        case 'delete':
          result = await handleGoalDelete(toolExecution, userId, platform);
          break;
        case 'analyze_conflicts':
          result = await handleConflictAnalysis(toolExecution, userId, platform);
          break;
        case 'suggest_amendments':
          result = await handleAmendmentSuggestions(toolExecution, userId, platform);
          break;
        default:
          throw new Error(`Unknown goal action: ${action}`);
      }

      return {
        tool_name: toolExecution.tool_name,
        success: true,
        data: result,
        execution_time_ms: performance.now() - startTime,
        platform
      };

    } catch (error) {
      console.error(`❌ Goal tool execution failed:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        tool_name: toolExecution.tool_name,
        success: false,
        error: errorMessage,
        execution_time_ms: performance.now() - startTime,
        platform
      };
    }
  }

  static async executeEnhancedCoaching(
    toolExecution: ToolExecution,
    userId: string,
    platform: Platform
  ): Promise<ToolResult> {
    const implementation = new GoalToolImplementation();
    return implementation.handleEnhancedCoaching(toolExecution, userId, platform);
  }

  private async handleEnhancedCoaching(
    toolExecution: ToolExecution,
    userId: string,
    platform: Platform
  ): Promise<ToolResult> {
    const startTime = performance.now();
    const params = toolExecution.parameters;

    try {
      // Get user's current goals for context
      const goalsResult = await handleGoalList(toolExecution, userId, platform);
      const userGoals = goalsResult?.goals || [];

      // Generate expert coaching response
      const coachingResponse = await this.coachingService.generateExpertCoachingResponse(
        params.message,
        params.domain,
        params.depth_level,
        params.coaching_type,
        params.follow_up_context,
        params.specificity_needed,
        params.conversation_progression,
        params.unresolved_needs || [],
        userGoals
      );

      return {
        tool_name: toolExecution.tool_name,
        success: true,
        data: {
          coaching_response: coachingResponse,
          domain: params.domain,
          depth_level: params.depth_level,
          coaching_type: params.coaching_type,
          goals_context: userGoals.length
        },
        execution_time_ms: performance.now() - startTime,
        platform
      };

    } catch (error) {
      console.error('❌ Enhanced coaching execution failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        tool_name: toolExecution.tool_name,
        success: false,
        error: errorMessage,
        execution_time_ms: performance.now() - startTime,
        platform
      };
    }
  }
} 