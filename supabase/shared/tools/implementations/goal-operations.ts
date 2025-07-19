// Goal Operation Handlers - Extracted from goal-tools.ts
import type { ToolExecution, ToolResult, Platform } from '../types.ts';
import {
  createGoalInDB,
  updateGoalInDB,
  getActiveGoalsFromDB,
  deleteGoalFromDB
} from './goal-db-operations.ts';
import { analyzeGoalConflicts, suggestGoalAmendments } from './goal-analysis.ts';

export async function handleGoalCreate(
  toolExecution: ToolExecution,
  userId: string,
  platform: Platform
): Promise<any> {
  const { action, ...params } = toolExecution.parameters;
  return await createGoalInDB(toolExecution, params);
}

export async function handleGoalUpdate(
  toolExecution: ToolExecution,
  userId: string,
  platform: Platform
): Promise<any> {
  const { goalReference, ...updates } = toolExecution.parameters;

  // Get user's goals to find the one to update
  const activeGoals = await getActiveGoalsFromDB(toolExecution);
  if (!activeGoals || activeGoals.goals?.length === 0) {
    return { message: 'No active goals found to update', updated: false };
  }

  // For now, update the first goal (could be enhanced with better matching)
  const goalToUpdate = activeGoals.goals[0];
  const updateResult = await updateGoalInDB(toolExecution, goalToUpdate.id, updates);

  return {
    message: 'Goal updated successfully',
    updated: true,
    goal: updateResult
  };
}

export async function handleGoalList(
  toolExecution: ToolExecution,
  userId: string,
  platform: Platform
): Promise<any> {
  return await getActiveGoalsFromDB(toolExecution);
}

export async function handleGoalDelete(
  toolExecution: ToolExecution,
  userId: string,
  platform: Platform
): Promise<any> {
  const { goalReference } = toolExecution.parameters;

  // Get user's goals to find the one to delete
  const activeGoals = await getActiveGoalsFromDB(toolExecution);
  if (!activeGoals || activeGoals.goals?.length === 0) {
    return { message: 'No active goals found to delete', deleted: false };
  }

  // For now, delete the first goal (could be enhanced with better matching)
  const goalToDelete = activeGoals.goals[0];
  await deleteGoalFromDB(toolExecution, goalToDelete.id);

  return {
    message: 'Goal deleted successfully',
    deleted: true,
    goalId: goalToDelete.id
  };
}

export async function handleConflictAnalysis(
  toolExecution: ToolExecution,
  userId: string,
  platform: Platform
): Promise<any> {
  return await analyzeGoalConflicts(toolExecution);
}

export async function handleAmendmentSuggestions(
  toolExecution: ToolExecution,
  userId: string,
  platform: Platform
): Promise<any> {
  return await suggestGoalAmendments(toolExecution);
} 