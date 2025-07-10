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
    // DEBUG MODE: Return diagnostic data if execution contains debug flag
    if (execution.parameters?.debug === true) {
      const userCheck = await db.from('users').select('id, phone_number').eq('id', execution.user_id).single();
      const allGoalsCheck = await db.from('user_goals').select('*').eq('user_id', execution.user_id);
      const rpcResult = await db.rpc('get_user_active_goals', { p_user_id: execution.user_id });
      
      return {
        data: {
          debug_info: {
            user_check: userCheck,
            all_goals: allGoalsCheck,
            rpc_result: rpcResult,
            user_id: execution.user_id
          }
        },
        error: null
      };
    }
    
    // Normal mode
    // Diagnostic: First check user exists
    const userCheck = await db.from('users').select('id, phone_number').eq('id', execution.user_id).single();
    console.log('👤 User check result:', JSON.stringify(userCheck, null, 2));
    
    // Diagnostic: Check if any goals exist for this user (any status)
    const allGoalsCheck = await db.from('user_goals').select('*').eq('user_id', execution.user_id);
    console.log('🎯 All goals check result:', JSON.stringify(allGoalsCheck, null, 2));
    
    // Diagnostic: Check if RPC function exists by calling it
    const result = await db.rpc('get_user_active_goals', { p_user_id: execution.user_id });
    
    console.log('🔍 Raw database result:', JSON.stringify(result, null, 2));
    
    if (result.error) {
      console.error('❌ Goals fetch error:', result.error);
    } else {
      console.log(`✅ Found ${result.data?.length || 0} active goals`);
      console.log('📋 Goal data:', JSON.stringify(result.data, null, 2));
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