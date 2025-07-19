// Prompt Building Utilities - Extracted from llm-prompts.ts
export class PromptBuilders {
  static buildGoalJudgePrompt(
    message: string,
    availableGoals: any[],
    action: string
  ): string {
    const goalsList = availableGoals.length > 0 
      ? availableGoals.map(g => `- ${g.title} (ID: ${g.id})`).join('\n')
      : 'No goals available';

    return `You are a goal management expert. Analyze this message and determine which goal the user is referring to.

USER MESSAGE: "${message}"
REQUESTED ACTION: ${action}

AVAILABLE GOALS:
${goalsList}

ANALYSIS REQUIREMENTS:
1. Identify which specific goal the user is referencing
2. Consider partial matches, synonyms, and context clues
3. If creating a new goal, extract the goal details
4. If updating/deleting, match to existing goals

Respond in JSON format:
{
  "goal_identified": boolean,
  "goal_id": "string or null",
  "goal_title": "string for new goals",
  "confidence": number (0-100),
  "reasoning": "explanation of your analysis"
}`;
  }

  static buildGoalExtractionPrompt(
    message: string,
    action: string
  ): string {
    return `Extract goal information from this user message for ${action} action.

USER MESSAGE: "${message}"
ACTION: ${action}

EXTRACT:
- Title: Clear, specific goal title
- Description: What the user wants to achieve
- Goal Type: fitness, learning, productivity, financial, creative, health, or general
- Target Value: Specific number if mentioned (steps, minutes, etc.)
- Frequency: How often (daily, weekly, etc.)
- Duration: Time commitment per session

Respond in JSON format:
{
  "title": "extracted goal title",
  "description": "what user wants to achieve",
  "goal_type": "category",
  "target_value": number or null,
  "frequency": "daily/weekly/monthly",
  "duration_minutes": number or null
}`;
  }

  static buildConflictAnalysisPrompt(
    newGoal: any,
    existingGoals: any[]
  ): string {
    const goalsList = existingGoals.map(g => 
      `- ${g.title} (${g.goal_type}, ${g.frequency || 'unknown frequency'})`
    ).join('\n');

    return `Analyze potential conflicts between this new goal and existing goals.

NEW GOAL:
- Title: ${newGoal.title}
- Type: ${newGoal.goal_type}
- Frequency: ${newGoal.frequency || 'not specified'}
- Duration: ${newGoal.duration_minutes || 'not specified'} minutes

EXISTING GOALS:
${goalsList}

ANALYZE FOR:
1. Time conflicts (overlapping schedules)
2. Resource conflicts (same equipment/space)
3. Energy conflicts (too demanding together)
4. Lifestyle conflicts (contradictory habits)
5. Duplicate goals (same objective)

Respond in JSON format:
{
  "has_conflicts": boolean,
  "conflict_types": ["time", "resource", "energy", "lifestyle", "duplicate"],
  "severity": "low|medium|high",
  "recommendations": ["suggestion1", "suggestion2"],
  "reasoning": "detailed explanation"
}`;
  }

  static buildAmendmentPrompt(
    goals: any[],
    conflictType: string
  ): string {
    const goalsList = goals.map(g => 
      `- ${g.title} (${g.goal_type})`
    ).join('\n');

    return `Suggest improvements for these conflicting goals.

CONFLICTING GOALS:
${goalsList}

CONFLICT TYPE: ${conflictType}

PROVIDE SUGGESTIONS FOR:
1. Frequency adjustments
2. Scope reductions
3. Goal consolidation
4. Resource optimization
5. Timing improvements

Respond in JSON format:
{
  "suggestions": [
    {
      "type": "frequency_adjustment|scope_reduction|consolidation|optimization",
      "goal_id": "which goal to modify",
      "description": "what to change",
      "reasoning": "why this helps"
    }
  ],
  "priority": "high|medium|low"
}`;
  }
} 