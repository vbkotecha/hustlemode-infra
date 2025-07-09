// Universal AI Tool Type Definitions
// Cross-platform tool system for goal tracking and accountability coaching

export type Platform = 'whatsapp' | 'imessage' | 'email' | 'telegram' | 'api';

export type ToolName = 
  | 'manage_goal'
  | 'schedule_checkin' 
  | 'get_progress'
  | 'analyze_patterns'
  | 'update_preferences';

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'enum' | 'array' | 'object';
  description: string;
  required?: boolean;
  enum?: string[];
  default?: any;
}

export interface ToolDefinition {
  name: ToolName;
  description: string;
  parameters: Record<string, ToolParameter>;
  cache_ttl?: number; // seconds, null = no cache
  platforms?: Platform[]; // if undefined, available on all platforms
}

export interface ToolExecution {
  tool_name: ToolName;
  parameters: Record<string, any>;
  user_id: string;
  platform: Platform;
}

export interface ToolResult {
  tool_name: ToolName;
  success: boolean;
  data?: any;
  error?: string;
  cached?: boolean;
  execution_time_ms: number;
  platform: Platform;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  goal_type: 'habit' | 'project' | 'calendar';
  frequency?: string;
  target_value?: number;
  current_value: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  start_date: string;
  end_date?: string;
  progress_percentage: number;
  days_active: number;
}

export interface CheckIn {
  id: string;
  goal_id: string;
  user_id: string;
  status: 'completed' | 'missed' | 'partial';
  notes?: string;
  value_progress?: number;
  check_in_date: string;
}

export interface UserPattern {
  user_id: string;
  best_check_in_time: string;
  struggling_days: string[];
  motivation_triggers: string[];
  goal_completion_rate: number;
  preferred_reminder_style: 'gentle' | 'firm' | 'celebration';
}

export interface PlatformResponse {
  text: string;
  metadata?: Record<string, any>;
  follow_up_action?: string;
} 