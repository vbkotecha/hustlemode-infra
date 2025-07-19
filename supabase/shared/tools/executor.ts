// Tool Execution Engine
import type { ToolExecution, ToolResult, ToolName } from './types.ts';
import { TOOL_DEFINITIONS } from './definitions.ts';
import { GoalToolImplementation } from './implementations/goal-tools.ts';
import { executeProgressTool } from './implementations/progress-tools.ts';
import { executePreferencesTool } from './implementations/preference-tools.ts';
import { validateParameters, createErrorResult } from './utils.ts';

const TOOL_HANDLERS: Record<ToolName, (execution: ToolExecution) => Promise<ToolResult>> = {
  'manage_goal': (execution) => GoalToolImplementation.executeGoalTool(execution, execution.user_id, execution.platform),
  'enhanced_coaching': (execution) => GoalToolImplementation.executeGoalTool(execution, execution.user_id, execution.platform),
  'get_progress': executeProgressTool,
  'update_preferences': executePreferencesTool,
};

export async function executeTool(execution: ToolExecution): Promise<ToolResult> {
  const startTime = performance.now();
  const toolDef = TOOL_DEFINITIONS[execution.tool_name];
  
  if (!toolDef) {
    return createErrorResult(execution, 'Unknown tool', startTime);
  }

  // Validate parameters
  const validationError = validateParameters(execution.parameters, toolDef);
  if (validationError) {
    return createErrorResult(execution, validationError, startTime);
  }

  // Cache system removed - direct execution only

  try {
    // Execute tool
    console.log(`🔧 Executing tool: ${execution.tool_name}`, execution.parameters);
    const handler = TOOL_HANDLERS[execution.tool_name];
    const result = await handler(execution);
    
    result.execution_time_ms = performance.now() - startTime;
    console.log(`✅ Tool completed: ${execution.tool_name} (${result.execution_time_ms.toFixed(1)}ms)`);

    return result;
  } catch (error) {
    console.error(`❌ Tool execution failed: ${execution.tool_name}`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResult(execution, errorMessage, startTime);
  }
}

// Utilities moved to utils.ts 