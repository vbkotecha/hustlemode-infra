// Coaching and Scheduling Tool Definitions
import type { ToolDefinition } from '../types.ts';

export const COACHING_TOOL_DEFINITIONS: Record<string, ToolDefinition> = {
  update_preferences: {
    name: 'update_preferences',
    description: 'Update user accountability and coaching preferences',
    // cache_ttl: undefined, // No cache - immediate effect
    parameters: {
      accountability_level: {
        type: 'enum',
        description: 'Coaching intensity level',
        enum: ['minimal', 'moderate', 'intensive']
      },
      proactive_check_ins: {
        type: 'boolean',
        description: 'Enable proactive check-ins'
      },
      escalation_enabled: {
        type: 'boolean',
        description: 'Enable escalation for missed check-ins'
      },
      quiet_hours_start: {
        type: 'string',
        description: 'Start of quiet hours (HH:MM format)'
      },
      quiet_hours_end: {
        type: 'string',
        description: 'End of quiet hours (HH:MM format)'
      }
    }
  }
}; 