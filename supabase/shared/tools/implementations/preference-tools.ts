// User Preference Management Tool Implementation
// Handles accountability and coaching preference updates

import { getSupabaseClient } from '../../database/index.ts';
import type { ToolExecution, ToolResult } from '../types.ts';

const db = getSupabaseClient();

export async function executePreferencesTool(execution: ToolExecution): Promise<ToolResult> {
  const { 
    accountability_level, 
    proactive_check_ins, 
    escalation_enabled, 
    quiet_hours_start, 
    quiet_hours_end 
  } = execution.parameters;
  
  try {
    // Build update object with only provided parameters
    const updates: any = {
      updated_at: new Date().toISOString()
    };
    
    if (accountability_level !== undefined) updates.accountability_level = accountability_level;
    if (proactive_check_ins !== undefined) updates.proactive_check_ins = proactive_check_ins;
    if (escalation_enabled !== undefined) updates.escalation_enabled = escalation_enabled;
    if (quiet_hours_start !== undefined) updates.quiet_hours_start = quiet_hours_start;
    if (quiet_hours_end !== undefined) updates.quiet_hours_end = quiet_hours_end;

    const { data, error } = await db
      .from('user_preferences')
      .update(updates)
      .eq('user_id', execution.user_id)
      .select()
      .single();

    if (error) throw error;

    return {
      tool_name: execution.tool_name,
      success: true,
      data: {
        preferences: data,
        message: 'Preferences updated successfully',
        changes_applied: Object.keys(updates).filter(k => k !== 'updated_at')
      },
      execution_time_ms: 0,
      platform: execution.platform
    };
  } catch (error) {
    return {
      tool_name: execution.tool_name,
      success: false,
      error: error.message,
      execution_time_ms: 0,
      platform: execution.platform
    };
  }
} 