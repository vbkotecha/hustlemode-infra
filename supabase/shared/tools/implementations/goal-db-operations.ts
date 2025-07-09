// Goal Database Operations
import { getSupabaseClient } from '../../database/index.ts';
import type { ToolExecution } from '../types.ts';

const db = getSupabaseClient();

export async function createGoalInDB(execution: ToolExecution, goalData: any) {
  return await db
    .from('user_goals')
    .insert({
      user_id: execution.user_id,
      title: goalData.title,
      description: goalData.description,
      goal_type: goalData.goal_type || 'habit',
      frequency: goalData.frequency,
      target_value: goalData.target_value
    })
    .select()
    .single();
}

export async function updateGoalInDB(execution: ToolExecution, goalId: string, updates: any) {
  return await db
    .from('user_goals')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', goalId)
    .eq('user_id', execution.user_id)
    .select()
    .single();
}

export async function getActiveGoalsFromDB(execution: ToolExecution) {
  return await db.rpc('get_user_active_goals', { p_user_id: execution.user_id });
}

export async function getGoalFromDB(execution: ToolExecution, goalId: string) {
  return await db
    .from('user_goals')
    .select()
    .eq('id', goalId)
    .eq('user_id', execution.user_id)
    .single();
}

export async function deleteGoalFromDB(execution: ToolExecution, goalId: string) {
  return await db
    .from('user_goals')
    .delete()
    .eq('id', goalId)
    .eq('user_id', execution.user_id);
}

export async function completeGoalInDB(execution: ToolExecution, goalId: string) {
  return await db
    .from('user_goals')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', goalId)
    .eq('user_id', execution.user_id);
} 