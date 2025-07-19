// Goal Management Tool Definitions
import type { ToolDefinition } from '../types.ts';

export const GOAL_TOOL_DEFINITIONS: Record<string, ToolDefinition> = {
  manage_goal: {
    name: 'manage_goal',
    description: 'Create, update, or retrieve user goals for accountability coaching',
    // cache_ttl: undefined, // DISABLED - No caching for goal operations
    parameters: {
      action: {
        type: 'enum',
        description: 'Action to perform on goals',
        required: true,
        enum: ['create', 'update', 'list', 'get', 'delete', 'complete', 'analyze_conflicts', 'suggest_amendments']
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
      },
      check_conflicts: {
        type: 'boolean',
        description: 'Whether to check for conflicts when creating/updating goals',
        default: true
      },
      auto_resolve: {
        type: 'boolean',
        description: 'Whether to automatically suggest conflict resolutions',
        default: false
      }
    }
  },

  enhanced_coaching: {
    name: 'enhanced_coaching',
    description: 'Advanced coaching tool for multi-dimensional intent analysis and expert responses',
    // cache_ttl: undefined, // No caching for personalized coaching
    parameters: {
      original_message: {
        type: 'string',
        description: 'Original user message',
        required: true
      },
      domain: {
        type: 'enum',
        description: 'Domain of the coaching request',
        required: true,
        enum: ['fitness', 'learning', 'productivity', 'financial', 'creative', 'health', 'general']
      },
      depth_level: {
        type: 'enum',
        description: 'Level of detail and complexity needed',
        required: true,
        enum: ['surface', 'detailed', 'implementation', 'strategic', 'expert']
      },
      coaching_type: {
        type: 'enum',
        description: 'Type of coaching response needed',
        required: true,
        enum: ['informational', 'motivational', 'tactical', 'strategic', 'troubleshooting']
      },
      follow_up_context: {
        type: 'enum',
        description: 'Context of the conversation progression',
        required: true,
        enum: ['initial', 'clarification', 'deeper_detail', 'implementation', 'problem_solving']
      },
      specificity_needed: {
        type: 'enum',
        description: 'Level of specificity required in response',
        required: true,
        enum: ['high', 'medium', 'low']
      },
      conversation_progression: {
        type: 'enum',
        description: 'Stage of conversation flow',
        required: true,
        enum: ['start', 'continue', 'deep_dive', 'switching_topics', 'wrapping_up']
      },
      unresolved_needs: {
        type: 'array',
        description: 'List of unresolved user needs for follow-up',
        required: false
      }
    }
  }
}; 