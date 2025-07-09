// Goal Management Tool Implementation
import type { ToolExecution, ToolResult, Goal } from '../types.ts';
import { createToolResult, createErrorResult } from '../utils.ts';
import { 
  createGoalInDB, 
  updateGoalInDB, 
  getActiveGoalsFromDB, 
  getGoalFromDB, 
  deleteGoalFromDB, 
  completeGoalInDB 
} from './goal-db-operations.ts';

export async function executeGoalTool(execution: ToolExecution): Promise<ToolResult> {
  const { action, goal_id, title, description, goal_type, frequency, target_value } = execution.parameters;
  
  try {
    switch (action) {
      case 'create':
        return await createGoal(execution, { title, description, goal_type, frequency, target_value });
      case 'update':
        return await updateGoal(execution, goal_id, { title, description, frequency, target_value });
      case 'list':
        return await listGoals(execution);
      case 'get':
        return await getGoal(execution, goal_id);
      case 'delete':
        return await deleteGoal(execution, goal_id);
      case 'complete':
        return await completeGoal(execution, goal_id);
      default:
        throw new Error(`Unknown goal action: ${action}`);
    }
  } catch (error) {
    return createErrorResult(execution, error.message);
  }
}

async function createGoal(execution: ToolExecution, goalData: any): Promise<ToolResult> {
  const { data, error } = await createGoalInDB(execution, goalData);
  if (error) throw error;
  return createToolResult(execution, { goal: data }, `Goal "${goalData.title}" created successfully`);
}

async function updateGoal(execution: ToolExecution, goalId: string, updates: any): Promise<ToolResult> {
  const { data, error } = await updateGoalInDB(execution, goalId, updates);
  if (error) throw error;
  return createToolResult(execution, { goal: data }, 'Goal updated successfully');
}

async function listGoals(execution: ToolExecution): Promise<ToolResult> {
  const { data, error } = await getActiveGoalsFromDB(execution);
  if (error) throw error;
  return createToolResult(execution, { goals: data || [], count: data?.length || 0 });
}

async function getGoal(execution: ToolExecution, goalId: string): Promise<ToolResult> {
  const { data, error } = await getGoalFromDB(execution, goalId);
  if (error) throw error;
  return createToolResult(execution, { goal: data });
}

async function deleteGoal(execution: ToolExecution, goalId: string): Promise<ToolResult> {
  const { error } = await deleteGoalFromDB(execution, goalId);
  if (error) throw error;
  return createToolResult(execution, {}, 'Goal deleted successfully');
}

async function completeGoal(execution: ToolExecution, goalId: string): Promise<ToolResult> {
  const { error } = await completeGoalInDB(execution, goalId);
  if (error) throw error;
  return createToolResult(execution, {}, 'Goal completed successfully');
} 