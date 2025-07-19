// Goal Analysis and Amendment Functions
import type { ToolExecution, ToolResult } from '../types.ts';
import { createToolResult } from '../utils.ts';
import { getActiveGoalsFromDB } from './goal-db-operations.ts';
import { detectGoalConflicts, analyzeGoalPairConflicts } from './goal-conflict-detection.ts';

export async function analyzeGoalConflicts(execution: ToolExecution): Promise<ToolResult> {
  const { data: goals, error } = await getActiveGoalsFromDB(execution);
  if (error) throw error;
  
  const allConflicts = [];
  const conflictSummary = {
    time_conflicts: 0,
    resource_conflicts: 0,
    capacity_conflicts: 0,
    priority_conflicts: 0
  };
  
  // Analyze each goal against all others for conflicts
  for (let i = 0; i < goals.length; i++) {
    for (let j = i + 1; j < goals.length; j++) {
      const conflicts = analyzeGoalPairConflicts(goals[i], goals[j]);
      if (conflicts.length > 0) {
        allConflicts.push({
          goal1: goals[i],
          goal2: goals[j],
          conflicts
        });
        
        // Update conflict summary
        conflicts.forEach(conflict => {
          if (conflict.type === 'time') conflictSummary.time_conflicts++;
          if (conflict.type === 'resource') conflictSummary.resource_conflicts++;
          if (conflict.type === 'capacity') conflictSummary.capacity_conflicts++;
          if (conflict.type === 'priority') conflictSummary.priority_conflicts++;
        });
      }
    }
  }
  
  return createToolResult(execution, {
    total_goals: goals.length,
    conflict_pairs: allConflicts.length,
    conflicts: allConflicts,
    summary: conflictSummary,
    recommendations: generateConflictRecommendations(allConflicts)
  }, `Found ${allConflicts.length} goal conflicts requiring attention.`);
}

export async function suggestGoalAmendments(execution: ToolExecution, goalId?: string): Promise<ToolResult> {
  const { data: goals, error } = await getActiveGoalsFromDB(execution);
  if (error) throw error;
  
  let targetGoals = goals;
  if (goalId) {
    targetGoals = goals.filter((g: any) => g.id === goalId);
    if (targetGoals.length === 0) {
      throw new Error('Goal not found');
    }
  }
  
  const amendments = [];
  
  for (const goal of targetGoals) {
    const conflicts = await detectGoalConflicts(execution, goal, goal.id);
    if (conflicts.length > 0) {
      const suggestions = generateAmendmentSuggestions(goal, conflicts);
      amendments.push({
        goal,
        conflicts,
        suggestions
      });
    }
  }
  
  return createToolResult(execution, {
    goals_analyzed: targetGoals.length,
    goals_with_conflicts: amendments.length,
    amendments
  }, `Generated amendments for ${amendments.length} conflicting goals.`);
}

function generateConflictRecommendations(conflicts: any[]): string[] {
  const recommendations = [];
  
  if (conflicts.length === 0) {
    recommendations.push('No conflicts detected - your goals are well-aligned!');
    return recommendations;
  }
  
  if (conflicts.length > 3) {
    recommendations.push('Consider focusing on 2-3 primary goals and treating others as secondary');
  }
  
  return recommendations;
}

function generateAmendmentSuggestions(goal: any, conflicts: any[]): any[] {
  const suggestions = [];
  
  for (const conflict of conflicts) {
    const conflictTypes = conflict.conflict_types || [conflict];
    
    for (const conflictType of conflictTypes) {
      switch (conflictType.type) {
        case 'duplicate':
          suggestions.push({
            type: 'goal_consolidation',
            description: 'Consider combining similar goals',
            reason: 'Improves focus and reduces goal fragmentation'
          });
          break;
          
        case 'time_overload':
          suggestions.push({
            type: 'scope_reduction',
            description: 'Reduce goal scope to manage capacity',
            reason: 'Maintains progress while preventing burnout'
          });
          break;
      }
    }
  }
  
  return suggestions;
} 