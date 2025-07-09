// Coaching and Scheduling Tool Definitions
import type { ToolDefinition } from '../types.ts';

export const COACHING_TOOL_DEFINITIONS: Record<string, ToolDefinition> = {
  schedule_checkin: {
    name: 'schedule_checkin',
    description: 'Schedule future check-ins and reminders for accountability',
    cache_ttl: 3600, // 1 hour
    parameters: {
      datetime: {
        type: 'string',
        description: 'When to schedule check-in (ISO datetime string)',
        required: true
      },
      goal_ids: {
        type: 'array',
        description: 'Goal IDs to check in about (empty = all active goals)'
      },
      reminder_type: {
        type: 'enum',
        description: 'Type of reminder to send',
        enum: ['gentle', 'firm', 'celebration'],
        default: 'firm'
      },
      message: {
        type: 'string',
        description: 'Custom reminder message'
      }
    }
  },

  analyze_patterns: {
    name: 'analyze_patterns',
    description: 'Analyze user patterns and provide coaching insights',
    cache_ttl: 1800, // 30 minutes
    parameters: {
      analysis_type: {
        type: 'enum',
        description: 'Type of pattern analysis',
        enum: ['performance', 'timing', 'motivation', 'obstacles'],
        default: 'performance'
      },
      time_range: {
        type: 'enum',
        description: 'Time range for analysis',
        enum: ['week', 'month', 'quarter', 'all'],
        default: 'month'
      }
    }
  },

  update_preferences: {
    name: 'update_preferences',
    description: 'Update user accountability and coaching preferences',
    cache_ttl: null, // No cache - immediate effect
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