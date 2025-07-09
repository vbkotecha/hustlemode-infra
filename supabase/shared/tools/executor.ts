// Tool Execution Engine
import type { ToolExecution, ToolResult, ToolName } from './types.ts';
import { TOOL_DEFINITIONS } from './definitions.ts';
import { getCachedToolResult, setCachedToolResult, generateCacheKey } from './cache.ts';
import { executeGoalTool } from './implementations/goal-tools.ts';
import { executeProgressTool } from './implementations/progress-tools.ts';
import { executePreferencesTool } from './implementations/preference-tools.ts';
import { validateParameters, createErrorResult, executeScheduleTool, executeAnalysisTool } from './utils.ts';

const TOOL_HANDLERS: Record<ToolName, (execution: ToolExecution) => Promise<ToolResult>> = {
  'manage_goal': executeGoalTool,
  'get_progress': executeProgressTool,
  'schedule_checkin': executeScheduleTool,
  'analyze_patterns': executeAnalysisTool,
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

  // Check cache first
  if (toolDef.cache_ttl) {
    const cacheKey = generateCacheKey(execution);
    const cachedResult = await getCachedToolResult(execution, cacheKey);
    if (cachedResult) {
      console.log(`✅ Tool cache hit: ${execution.tool_name}`);
      return cachedResult;
    }
  }

  try {
    // Execute tool
    console.log(`🔧 Executing tool: ${execution.tool_name}`, execution.parameters);
    const handler = TOOL_HANDLERS[execution.tool_name];
    const result = await handler(execution);
    
    result.execution_time_ms = performance.now() - startTime;
    console.log(`✅ Tool completed: ${execution.tool_name} (${result.execution_time_ms.toFixed(1)}ms)`);

    // Cache result if configured
    if (toolDef.cache_ttl && result.success) {
      await setCachedToolResult(execution, result, toolDef.cache_ttl);
    }

    return result;
  } catch (error) {
    console.error(`❌ Tool execution failed: ${execution.tool_name}`, error);
    return createErrorResult(execution, error.message, startTime);
  }
}

// Utilities moved to utils.ts 