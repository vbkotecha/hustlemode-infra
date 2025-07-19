// Refactored LLM Prompts - Using extracted prompt builders
import { PromptBuilders } from './prompt-builders.ts';

export class LLMPrompts {
  static buildGoalJudgePrompt(
    message: string,
    availableGoals: any[],
    action: string
  ): string {
    return PromptBuilders.buildGoalJudgePrompt(message, availableGoals, action);
  }

  static buildGoalExtractionPrompt(
    message: string,
    action: string
  ): string {
    return PromptBuilders.buildGoalExtractionPrompt(message, action);
  }

  static buildConflictAnalysisPrompt(
    newGoal: any,
    existingGoals: any[]
  ): string {
    return PromptBuilders.buildConflictAnalysisPrompt(newGoal, existingGoals);
  }

  static buildAmendmentPrompt(
    goals: any[],
    conflictType: string
  ): string {
    return PromptBuilders.buildAmendmentPrompt(goals, conflictType);
  }

  static buildProgressAnalysisPrompt(
    goals: any[],
    timeframe: string = '7 days'
  ): string {
    const goalsList = goals.map(g => 
      `- ${g.title} (${g.status}, ${g.days_active || 0} days active)`
    ).join('\n');

    return `Analyze progress for these goals over the last ${timeframe}.

GOALS:
${goalsList}

ANALYZE:
1. Which goals are on track
2. Which goals are behind schedule
3. Overall completion rate
4. Recommendations for improvement

Respond in JSON format:
{
  "overall_completion_rate": number (0-100),
  "goals_on_track": number,
  "goals_behind": number,
  "recommendations": ["suggestion1", "suggestion2"]
}`;
  }
} 