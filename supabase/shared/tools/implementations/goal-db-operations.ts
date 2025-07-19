// Refactored Goal Database Operations - Using extracted utilities
import type { ToolExecution } from '../types.ts';
import { executeGoalQuery, validateGoalData, formatGoalResponse } from './db-operations.ts';

export async function createGoalInDB(execution: ToolExecution, goalData: any) {
  console.log('🎯 Creating goal in database:', goalData);

  // Validate goal data
  const validation = validateGoalData(goalData);
  if (!validation.isValid) {
    throw new Error(`Invalid goal data: ${validation.errors.join(', ')}`);
  }

  // Set default values
  const goalToCreate = {
    title: goalData.title,
    description: goalData.description || null,
    goal_type: goalData.goal_type || 'general',
    frequency: goalData.frequency || null,
    target_value: goalData.target_value || null,
    duration_minutes: goalData.duration_minutes || null,
    status: 'active',
    progress_percentage: 0,
    current_value: 0
  };

  try {
    const result = await executeGoalQuery(execution, 'insert', goalToCreate);
    return formatGoalResponse('create', result);
  } catch (error) {
    console.error('❌ Goal creation failed:', error);
    return formatGoalResponse('create', null, error);
  }
}

export async function updateGoalInDB(execution: ToolExecution, goalId: string, updates: any) {
  console.log('🎯 Updating goal in database:', goalId, updates);

  // Validate update data
  if (updates.title || updates.description || updates.goal_type) {
    const validation = validateGoalData(updates);
    if (!validation.isValid) {
      throw new Error(`Invalid update data: ${validation.errors.join(', ')}`);
    }
  }

  try {
    const result = await executeGoalQuery(execution, 'update', { id: goalId, ...updates });
    return formatGoalResponse('update', result);
  } catch (error) {
    console.error('❌ Goal update failed:', error);
    return formatGoalResponse('update', null, error);
  }
}

export async function getActiveGoalsFromDB(execution: ToolExecution) {
  console.log('📋 Fetching active goals from database');

  try {
    const result = await executeGoalQuery(execution, 'select_active');
    return formatGoalResponse('list', result);
  } catch (error) {
    console.error('❌ Failed to fetch goals:', error);
    return formatGoalResponse('list', null, error);
  }
}

export async function getGoalFromDB(execution: ToolExecution, goalId: string) {
  try {
    const result = await executeGoalQuery(execution, 'select_single', { id: goalId });
    return formatGoalResponse('get', result);
  } catch (error) {
    console.error('❌ Failed to fetch goal:', error);
    return formatGoalResponse('get', null, error);
  }
}

export async function deleteGoalFromDB(execution: ToolExecution, goalId: string) {
  try {
    const result = await executeGoalQuery(execution, 'delete', { id: goalId });
    return formatGoalResponse('delete', result);
  } catch (error) {
    console.error('❌ Goal deletion failed:', error);
    return formatGoalResponse('delete', null, error);
  }
}

export async function completeGoalInDB(execution: ToolExecution, goalId: string) {
  try {
    const result = await executeGoalQuery(execution, 'complete', { id: goalId });
    return formatGoalResponse('complete', result);
  } catch (error) {
    console.error('❌ Goal completion failed:', error);
    return formatGoalResponse('complete', null, error);
  }
} 