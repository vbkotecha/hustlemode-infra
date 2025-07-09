// Goal Database Operations
import { getSupabaseClient } from '../../database/index.ts';
import type { ToolExecution } from '../types.ts';

const db = getSupabaseClient();

export async function createGoalInDB(execution: ToolExecution, goalData: any) {
  console.log(`🎯 Creating goal for user ${execution.user_id}:`, goalData);
  
  try {
    const result = await db
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
    
    if (result.error) {
      console.error('❌ Goal creation error:', result.error);
    } else {
      console.log('✅ Goal created successfully:', result.data?.id);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Goal creation exception:', error);
    return { data: null, error };
  }
}

export async function updateGoalInDB(execution: ToolExecution, goalId: string, updates: any) {
  console.log(`📝 Updating goal ${goalId} for user ${execution.user_id}`);
  
  try {
    const result = await db
      .from('user_goals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', goalId)
      .eq('user_id', execution.user_id)
      .select()
      .single();
      
    if (result.error) {
      console.error('❌ Goal update error:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Goal update exception:', error);
    return { data: null, error };
  }
}

export async function getActiveGoalsFromDB(execution: ToolExecution) {
  console.log(`📋 Fetching active goals for user ${execution.user_id}`);
  
  try {
    const result = await db.rpc('get_user_active_goals', { p_user_id: execution.user_id });
    
    if (result.error) {
      console.error('❌ Goals fetch error:', result.error);
    } else {
      console.log(`✅ Found ${result.data?.length || 0} active goals`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Goals fetch exception:', error);
    return { data: null, error };
  }
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