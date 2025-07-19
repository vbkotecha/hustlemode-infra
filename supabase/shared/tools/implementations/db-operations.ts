// Database Operations Utilities - Extracted from goal-db-operations.ts
import { getSupabaseClient } from '../../database/client.ts';
import type { ToolExecution } from '../types.ts';

export async function executeGoalQuery(execution: ToolExecution, operation: string, data?: any) {
  const db = getSupabaseClient();
  const { user_id } = execution;

  try {
    switch (operation) {
      case 'select_active':
        return await db.rpc('get_user_active_goals', { p_user_id: user_id });
      
      case 'insert':
        return await db.from('user_goals').insert({
          user_id,
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).select().single();
      
      case 'update':
        return await db.from('user_goals')
          .update({
            ...data,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id)
          .eq('user_id', user_id)
          .select()
          .single();
      
      case 'delete':
        return await db.from('user_goals')
          .delete()
          .eq('id', data.id)
          .eq('user_id', user_id);
      
      case 'select_single':
        return await db.from('user_goals')
          .select('*')
          .eq('id', data.id)
          .eq('user_id', user_id)
          .single();
      
      case 'complete':
        return await db.from('user_goals')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id)
          .eq('user_id', user_id)
          .select()
          .single();
      
      default:
        throw new Error(`Unknown database operation: ${operation}`);
    }
  } catch (error) {
    console.error(`❌ Database operation '${operation}' failed:`, error);
    throw error;
  }
}

export function validateGoalData(goalData: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!goalData.title || typeof goalData.title !== 'string') {
    errors.push('Goal title is required and must be a string');
  }

  if (goalData.title && goalData.title.length > 200) {
    errors.push('Goal title must be 200 characters or less');
  }

  if (goalData.description && goalData.description.length > 1000) {
    errors.push('Goal description must be 1000 characters or less');
  }

  if (goalData.goal_type && !['fitness', 'learning', 'productivity', 'financial', 'creative', 'health', 'general'].includes(goalData.goal_type)) {
    errors.push('Invalid goal type');
  }

  if (goalData.target_value && (typeof goalData.target_value !== 'number' || goalData.target_value < 0)) {
    errors.push('Target value must be a positive number');
  }

  if (goalData.frequency && typeof goalData.frequency !== 'string') {
    errors.push('Frequency must be a string');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function formatGoalResponse(operation: string, data: any, error?: any) {
  if (error) {
    return {
      success: false,
      error: error.message || 'Database operation failed',
      operation
    };
  }

  const responses = {
    create: () => ({
      success: true,
      message: 'Goal created successfully',
      goal: data.data,
      goal_created: true
    }),
    
    update: () => ({
      success: true,
      message: 'Goal updated successfully', 
      goal: data.data,
      goal_updated: true
    }),
    
    list: () => ({
      success: true,
      goals: data.data || [],
      goalCount: data.data?.length || 0
    }),
    
    delete: () => ({
      success: true,
      message: 'Goal deleted successfully',
      goal_deleted: true
    }),
    
    get: () => ({
      success: true,
      goal: data.data
    }),
    
    complete: () => ({
      success: true,
      message: 'Goal completed successfully',
      goal: data.data,
      goal_completed: true
    })
  };

  const formatter = responses[operation as keyof typeof responses];
  return formatter ? formatter() : { success: true, data: data.data };
} 