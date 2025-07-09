// Universal AI Tool Definitions
import type { ToolDefinition } from './types.ts';
import { GOAL_TOOL_DEFINITIONS } from './definitions/goal-definitions.ts';
import { COACHING_TOOL_DEFINITIONS } from './definitions/coaching-definitions.ts';

export const TOOL_DEFINITIONS: Record<string, ToolDefinition> = {
  ...GOAL_TOOL_DEFINITIONS,
  ...COACHING_TOOL_DEFINITIONS
};

export const TOOL_NAMES = Object.keys(TOOL_DEFINITIONS) as Array<keyof typeof TOOL_DEFINITIONS>; 