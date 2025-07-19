// Refactored Goal Conflict Detection - Using extracted analyzers
import type { ToolExecution } from '../types.ts';
import { getSupabaseClient } from '../../database/client.ts';
import { 
  detectDuplicateActivity, 
  estimateGoalTimeRequirement, 
  detectTimeOverload, 
  detectResourceContradiction 
} from './conflict-analyzers.ts';

export async function detectGoalConflicts(execution: ToolExecution, goalData: any, excludeGoalId?: string): Promise<any[]> {
  const db = getSupabaseClient();
  
  try {
    const { data: existingGoals, error } = await db
      .from('user_goals')
      .select('*')
      .eq('user_id', execution.user_id)
      .eq('status', 'active');

    if (error) {
      console.error('❌ Failed to fetch goals for conflict detection:', error);
      return [];
    }

    const otherGoals = excludeGoalId 
      ? existingGoals.filter((g: any) => g.id !== excludeGoalId)
      : existingGoals;

    const conflicts: any[] = [];

    for (const existingGoal of otherGoals) {
      const goalConflicts = await analyzeGoalPairConflicts(goalData, existingGoal);
      if (goalConflicts.length > 0) {
        conflicts.push({
          conflicting_goal: existingGoal,
          conflict_types: goalConflicts
        });
      }
    }

    return conflicts;
  } catch (error) {
    console.error('❌ Goal conflict detection failed:', error);
    return [];
  }
}

export async function analyzeGoalPairConflicts(goal1: any, goal2: any): Promise<any[]> {
  const conflicts: any[] = [];

  // Check for duplicate activities using LLM semantic analysis
  const isDuplicate = await detectDuplicateActivity(goal1, goal2);
  if (isDuplicate) {
    conflicts.push({
      type: 'duplicate_activity',
      severity: 'high',
      description: 'Goals appear to target the same or very similar activities',
      conversational: 'These goals seem to overlap significantly in their activities.'
    });
  }

  // Check for time overload using LLM-based time estimation
  const timeOverload = await detectTimeOverload(goal1, goal2);
  if (timeOverload) {
    conflicts.push({
      type: 'time_overload',
      severity: 'medium',
      description: `Combined goals require ${timeOverload.totalHours.toFixed(1)} hours daily`,
      conversational: `These goals together might require ${timeOverload.totalHours.toFixed(1)} hours per day. That could be overwhelming.`
    });
  }

  // Check for resource contradictions using semantic analysis
  const resourceConflict = await detectResourceContradiction(goal1, goal2);
  if (resourceConflict) {
    conflicts.push({
      type: 'resource_contradiction',
      severity: 'medium',
      description: resourceConflict.reason,
      conversational: resourceConflict.reason
    });
  }

  // Check for lifestyle contradictions
  const lifestyleConflict = await detectLifestyleContradiction(goal1, goal2);
  if (lifestyleConflict) {
    conflicts.push({
      type: 'lifestyle_contradiction',
      severity: 'medium',
      description: lifestyleConflict.reason,
      conversational: lifestyleConflict.conversational
    });
  }

  return conflicts;
}

async function detectLifestyleContradiction(goal1: any, goal2: any): Promise<{ reason: string; conversational: string } | null> {
  if (!goal1?.title || !goal2?.title) return null;

  // ✅ SEMANTIC LLM ANALYSIS - No keyword arrays
  const analysisPrompt = `
Analyze if these goals have lifestyle contradictions:

Goal 1: "${goal1.title}" (${goal1.description || 'no description'})
Goal 2: "${goal2.title}" (${goal2.description || 'no description'})

Check for lifestyle conflicts:
- Social vs solitary preferences (group activities vs individual activities)
- Time preferences (morning person vs night person activities)
- Energy patterns (high energy vs low energy activities)
- Location preferences (home vs outdoor vs gym vs office)
- Personality contradictions (competitive vs meditative)

Respond in JSON:
{
  "hasContradiction": boolean,
  "contradictionType": "social_preference|time_preference|energy_pattern|location|personality|none",
  "reason": "specific explanation of the contradiction",
  "conversational": "user-friendly explanation with question",
  "severity": "low|medium|high"
}

Use semantic understanding, not keyword matching.`;

  try {
    const { GroqService } = await import('../../groq.ts');
    const groqService = new GroqService();
    
    const response = await groqService.getChatCompletion([{
      role: 'user',
      content: analysisPrompt,
      timestamp: new Date().toISOString()
    }], 'taskmaster', 200);

    const analysis = JSON.parse(response.replace(/```json\n?|\n?```/g, ''));
    
    if (analysis.hasContradiction && analysis.severity !== 'low') {
      return {
        reason: analysis.reason,
        conversational: analysis.conversational
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Lifestyle contradiction LLM analysis failed:', error);
    return null;
  }
} 