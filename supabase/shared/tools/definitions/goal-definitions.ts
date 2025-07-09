// Goal Management Tool Definitions
import type { ToolDefinition } from '../types.ts';

export const GOAL_TOOL_DEFINITIONS: Record<string, ToolDefinition> = {
  manage_goal: {
    name: 'manage_goal',
    description: 'Create, update, or retrieve user goals for accountability coaching',
    cache_ttl: 300, // 5 minutes
    parameters: {
      action: {
        type: 'enum',
        description: 'Action to perform on goals',
        required: true,
        enum: ['create', 'update', 'list', 'get', 'delete', 'complete']
      },
      goal_id: {
        type: 'string',
        description: 'Goal ID for update/get/delete actions'
      },
      title: {
        type: 'string',
        description: 'Goal title for create/update actions'
      },
      description: {
        type: 'string',
        description: 'Goal description'
      },
      goal_type: {
        type: 'enum',
        description: 'Type of goal',
        enum: ['habit', 'project', 'calendar'],
        default: 'habit'
      },
      frequency: {
        type: 'string',
        description: 'How often goal should be achieved (daily, 3x_weekly, weekly, etc.)'
      },
      target_value: {
        type: 'number',
        description: 'Target value for measurable goals'
      }
    }
  },

  get_progress: {
    name: 'get_progress',
    description: 'Get goal progress and check-in history for motivation',
    cache_ttl: 180, // 3 minutes
    parameters: {
      time_period: {
        type: 'enum',
        description: 'Time period for progress report',
        enum: ['today', 'week', 'month', 'all'],
        default: 'week'
      },
      goal_id: {
        type: 'string',
        description: 'Specific goal ID (empty = all goals)'
      },
      include_checkins: {
        type: 'boolean',
        description: 'Include detailed check-in history',
        default: true
      }
    }
  }
}; 