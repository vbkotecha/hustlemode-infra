// Progress Tracking Tool Implementation
import { getSupabaseClient } from '../../database/index.ts';
import type { ToolExecution, ToolResult } from '../types.ts';
import { createToolResult, createErrorResult } from '../utils.ts';
import { 
  getDateFilter, 
  calculateCompletionRate, 
  calculateProgressPercentage, 
  calculateDaysActive,
  calculateProgressSummary 
} from './progress-utils.ts';

// Lazy-loaded database client
let _db: any = null;
function getDb() {
  if (!_db) {
    _db = getSupabaseClient();
  }
  return _db;
}

export async function executeProgressTool(execution: ToolExecution): Promise<ToolResult> {
  const { time_period = 'week', goal_id, include_checkins = true } = execution.parameters;
  
  try {
    if (goal_id) {
      return await getGoalProgress(execution, goal_id, time_period, include_checkins);
    } else {
      return await getAllGoalsProgress(execution, time_period, include_checkins);
    }
  } catch (error) {
    return createErrorResult(execution, error instanceof Error ? error.message : 'Unknown error');
  }
}

async function getGoalProgress(
  execution: ToolExecution, 
  goalId: string, 
  timePeriod: string,
  includeCheckins: boolean
): Promise<ToolResult> {
  const { data: goal, error: goalError } = await getDb()
    .from('user_goals')
    .select('*')
    .eq('id', goalId)
    .eq('user_id', execution.user_id)
    .single();
  if (goalError) throw goalError;

  const progressData: any = {
    goal,
    progress_percentage: calculateProgressPercentage(goal),
    days_active: calculateDaysActive(goal.start_date)
  };

  if (includeCheckins) {
    const dateFilter = getDateFilter(timePeriod);
    const { data: checkins } = await getDb()
      .from('goal_check_ins')
      .select('*')
      .eq('goal_id', goalId)
      .eq('user_id', execution.user_id)
      .gte('check_in_date', dateFilter)
      .order('check_in_date', { ascending: false });

    progressData.recent_checkins = checkins || [];
    progressData.completion_rate = calculateCompletionRate(checkins || []);
  }

  return createToolResult(execution, progressData);
}

async function getAllGoalsProgress(
  execution: ToolExecution,
  timePeriod: string,
  includeCheckins: boolean
): Promise<ToolResult> {
  const { data: goals, error } = await getDb().rpc('get_user_active_goals', { p_user_id: execution.user_id });
  if (error) throw error;

  const progressSummary = calculateProgressSummary(goals);
  return createToolResult(execution, progressSummary);
}

// Utility functions moved to progress-utils.ts 