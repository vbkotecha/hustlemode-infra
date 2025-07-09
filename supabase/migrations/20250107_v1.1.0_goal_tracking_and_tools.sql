-- HustleMode.ai Database Schema - Goal Tracking & AI Tools Migration v1.1.0
-- Migration: 2025-01-07
-- Version: 1.1.0
-- Type: FEATURE - Adds goal tracking and AI tools support for cross-platform functionality
-- Author: HustleMode.ai Development Team

/*
============================================================================
MIGRATION: Goal Tracking & AI Tools System
============================================================================

DESCRIPTION:
Adds comprehensive goal tracking system with AI tools support for cross-platform
accountability coaching. Enables users to set, track, and manage goals across
WhatsApp, iMessage, email, and future platforms.

CHANGES:
- [x] Add user_goals table for goal management
- [x] Add goal_check_ins table for progress tracking
- [x] Add tool_executions table for AI tool result caching
- [x] Extend user_preferences with accountability settings
- [x] Add performance indexes for goal operations
- [x] Add RLS policies for goal data security

ROLLBACK NOTES:
To rollback this migration:
1. DROP TABLE tool_executions CASCADE;
2. DROP TABLE goal_check_ins CASCADE;
3. DROP TABLE user_goals CASCADE;
4. ALTER TABLE user_preferences DROP COLUMN accountability_level, proactive_check_ins, escalation_enabled, quiet_hours_start, quiet_hours_end;

TESTING:
- [x] Test goal creation and management
- [x] Verify tool execution caching
- [x] Test accountability preferences
- [x] Validate performance with indexes
- [x] Test RLS policies for goal security

============================================================================
*/

-- Record this migration in schema_versions
INSERT INTO schema_versions (version, migration_file, description, migration_type, rollback_notes) VALUES 
('1.1.0', '20250107_v1.1.0_goal_tracking_and_tools.sql', 'Goal tracking and AI tools system', 'feature', 'Rollback by dropping goal tables and removing preference columns');

/*
============================================================================
TABLE: user_goals - Goal Management System
============================================================================
Purpose: Store user goals for cross-platform accountability coaching
Features: Habit tracking, project goals, calendar integration
*/
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT DEFAULT 'habit' CHECK (goal_type IN ('habit', 'project', 'calendar')),
  frequency TEXT, -- 'daily', '3x_weekly', 'weekly', 'monthly'
  target_value INTEGER, -- for measurable goals (e.g., 10000 steps)
  current_value INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_target_value CHECK (target_value IS NULL OR target_value > 0),
  CONSTRAINT non_negative_current_value CHECK (current_value >= 0),
  CONSTRAINT title_not_empty CHECK (length(trim(title)) > 0)
);

/*
============================================================================
TABLE: goal_check_ins - Progress Tracking
============================================================================
Purpose: Track goal progress and check-in history for accountability
Features: Daily/weekly check-ins, progress values, notes
*/
CREATE TABLE IF NOT EXISTS goal_check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID REFERENCES user_goals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('completed', 'missed', 'partial')),
  notes TEXT,
  value_progress INTEGER, -- progress amount for this check-in
  check_in_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT non_negative_progress CHECK (value_progress IS NULL OR value_progress >= 0),
  CONSTRAINT one_checkin_per_goal_per_day UNIQUE (goal_id, check_in_date)
);

/*
============================================================================
TABLE: tool_executions - AI Tool Result Caching
============================================================================
Purpose: Cache AI tool execution results for performance optimization
Features: Cross-platform tool result sharing, performance optimization
*/
CREATE TABLE IF NOT EXISTS tool_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  tool_parameters JSONB DEFAULT '{}',
  execution_result JSONB NOT NULL,
  platform TEXT NOT NULL, -- 'whatsapp', 'imessage', 'email', 'telegram'
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT tool_name_not_empty CHECK (length(trim(tool_name)) > 0),
  CONSTRAINT platform_valid CHECK (platform IN ('whatsapp', 'imessage', 'email', 'telegram', 'api'))
);

/*
============================================================================
EXTEND user_preferences - Accountability Settings
============================================================================
Purpose: Add accountability and coaching preferences for goal system
*/
-- Add accountability level setting
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS accountability_level TEXT DEFAULT 'moderate' 
  CHECK (accountability_level IN ('minimal', 'moderate', 'intensive'));

-- Add proactive coaching preferences  
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS proactive_check_ins BOOLEAN DEFAULT true;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS escalation_enabled BOOLEAN DEFAULT true;

-- Add quiet hours for respectful coaching
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS quiet_hours_start TIME DEFAULT '22:00';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS quiet_hours_end TIME DEFAULT '07:00';

/*
============================================================================
INDEXES - Performance Optimization
============================================================================
*/
-- Goal lookup optimization (primary access patterns)
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_status ON user_goals(status);
CREATE INDEX IF NOT EXISTS idx_user_goals_type ON user_goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_user_goals_active_user ON user_goals(user_id, status) WHERE status = 'active';

-- Check-in optimization for progress tracking
CREATE INDEX IF NOT EXISTS idx_goal_check_ins_goal_id ON goal_check_ins(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_check_ins_user_id ON goal_check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_check_ins_date ON goal_check_ins(check_in_date DESC);
CREATE INDEX IF NOT EXISTS idx_goal_check_ins_recent ON goal_check_ins(user_id, check_in_date DESC);

-- Tool execution caching optimization
CREATE INDEX IF NOT EXISTS idx_tool_executions_user_tool ON tool_executions(user_id, tool_name);
CREATE INDEX IF NOT EXISTS idx_tool_executions_expires ON tool_executions(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tool_executions_platform ON tool_executions(platform, created_at DESC);

-- Updated preferences indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_accountability ON user_preferences(accountability_level);

/*
============================================================================
ROW LEVEL SECURITY (RLS) - Goal Data Protection
============================================================================
*/
-- Enable RLS on new tables
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_check_ins ENABLE ROW LEVEL SECURITY;  
ALTER TABLE tool_executions ENABLE ROW LEVEL SECURITY;

-- Goal access policies
CREATE POLICY user_goals_access ON user_goals
  FOR ALL USING (
    auth.role() = 'service_role' OR
    user_id = auth.uid()::uuid
  );

CREATE POLICY goal_check_ins_access ON goal_check_ins
  FOR ALL USING (
    auth.role() = 'service_role' OR
    user_id = auth.uid()::uuid
  );

CREATE POLICY tool_executions_access ON tool_executions
  FOR ALL USING (
    auth.role() = 'service_role' OR
    user_id = auth.uid()::uuid
  );

/*
============================================================================
FUNCTIONS - Goal Management Utilities
============================================================================
*/

-- Apply update trigger to user_goals
CREATE TRIGGER update_user_goals_updated_at
  BEFORE UPDATE ON user_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Goal progress calculation function
CREATE OR REPLACE FUNCTION calculate_goal_progress(p_goal_id UUID)
RETURNS NUMERIC(5,2) AS $$
DECLARE
  goal_record user_goals%ROWTYPE;
  progress_percentage NUMERIC(5,2);
BEGIN
  SELECT * INTO goal_record FROM user_goals WHERE id = p_goal_id;
  
  IF goal_record.target_value IS NULL OR goal_record.target_value = 0 THEN
    RETURN 0;
  END IF;
  
  progress_percentage := (goal_record.current_value::NUMERIC / goal_record.target_value::NUMERIC) * 100;
  RETURN LEAST(progress_percentage, 100.00);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get active goals for user function  
CREATE OR REPLACE FUNCTION get_user_active_goals(p_user_id UUID)
RETURNS TABLE(
  goal_id UUID,
  title TEXT,
  goal_type TEXT,
  current_value INTEGER,
  target_value INTEGER,
  progress_percentage NUMERIC(5,2),
  days_active INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ug.id,
    ug.title,
    ug.goal_type,
    ug.current_value,
    ug.target_value,
    calculate_goal_progress(ug.id),
    (CURRENT_DATE - ug.start_date)::INTEGER
  FROM user_goals ug
  WHERE ug.user_id = p_user_id 
    AND ug.status = 'active'
  ORDER BY ug.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean expired tool executions
CREATE OR REPLACE FUNCTION cleanup_expired_tool_executions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM tool_executions 
  WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/*
============================================================================
PERMISSIONS - Grants for new tables and functions
============================================================================
*/
GRANT ALL ON user_goals TO service_role;
GRANT ALL ON goal_check_ins TO service_role;
GRANT ALL ON tool_executions TO service_role;
GRANT EXECUTE ON FUNCTION calculate_goal_progress(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION get_user_active_goals(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_tool_executions() TO service_role;

/*
============================================================================
DOCUMENTATION - Table & Column Comments
============================================================================
*/
COMMENT ON TABLE user_goals IS 'v1.1.0 - User goal tracking for accountability coaching';
COMMENT ON TABLE goal_check_ins IS 'v1.1.0 - Goal progress check-ins and status updates';
COMMENT ON TABLE tool_executions IS 'v1.1.0 - AI tool execution result caching for performance';

COMMENT ON COLUMN user_goals.goal_type IS 'Type of goal: habit (recurring), project (deadline), calendar (scheduled)';
COMMENT ON COLUMN user_goals.frequency IS 'How often goal should be achieved (daily, weekly, etc.)';
COMMENT ON COLUMN user_preferences.accountability_level IS 'Coaching intensity: minimal, moderate, intensive';
COMMENT ON COLUMN tool_executions.expires_at IS 'Cache expiration time for tool results';

/*
============================================================================
MIGRATION COMPLETE - v1.1.0 Goal Tracking & AI Tools
============================================================================
Expected Schema Version: 1.1.0
Tables Added: 3 (user_goals, goal_check_ins, tool_executions)
Columns Added: 5 (accountability_level, proactive_check_ins, escalation_enabled, quiet_hours_start, quiet_hours_end)
Functions Added: 3 (calculate_goal_progress, get_user_active_goals, cleanup_expired_tool_executions)
Indexes Added: 9 performance indexes for goal operations
RLS Policies Added: 3 policies for goal data protection
Next Migration: v1.2.0 for additional features
============================================================================
*/ 