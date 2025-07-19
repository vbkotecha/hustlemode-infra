// Tool Execution Utilities
import type { ToolExecution, ToolResult } from './types.ts';

export function validateParameters(parameters: Record<string, any>, toolDef: any): string | null {
  for (const [paramName, paramDef] of Object.entries(toolDef.parameters)) {
    const value = parameters[paramName];
    const def = paramDef as any;
    
    if (def.required && (value === undefined || value === null)) {
      return `Missing required parameter: ${paramName}`;
    }
    
    if (value !== undefined && def.enum && !def.enum.includes(value)) {
      return `Invalid value for ${paramName}. Must be one of: ${def.enum.join(', ')}`;
    }
  }
  return null;
}

export function createErrorResult(execution: ToolExecution, error: string, startTime?: number): ToolResult {
  return {
    tool_name: execution.tool_name,
    success: false,
    error,
    execution_time_ms: startTime ? performance.now() - startTime : 0,
    platform: execution.platform
  };
}

export function createToolResult(
  execution: ToolExecution, 
  data: any, 
  message?: string
): ToolResult {
  return {
    tool_name: execution.tool_name,
    success: true,
    data: message ? { ...data, message } : data,
    execution_time_ms: 0,
    platform: execution.platform
  };
}

// Placeholder implementations removed - only real tools supported 