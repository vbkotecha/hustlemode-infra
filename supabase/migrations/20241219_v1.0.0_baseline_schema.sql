-- HustleMode.ai Database Schema - Baseline Migration v1.0.0
-- Migration: 2024-12-19 
-- Version: 1.0.0
-- Type: BASELINE - Establishes initial schema after Azure → Supabase migration
-- Author: Migration from Azure PostgreSQL to Supabase PostgreSQL

/*
============================================================================
MIGRATION CONTEXT & HISTORY
============================================================================

PRE-MIGRATION STATE (Azure PostgreSQL):
- Complex 6+ table structure with goals, conversations, check-ins
- Azure Functions Python integration
- Azure OpenAI dependency
- Performance issues: 2-5 second cold starts
- High costs: $200-500/month

POST-MIGRATION GOALS:
- Simplified 3-table structure optimized for Edge Functions
- Supabase PostgreSQL with Row Level Security
- Groq API integration for 40-100x faster inference
- Cost reduction: 60-80% savings
- Memory abstraction layer (PostgreSQL → Mem0 upgrade path)

============================================================================
*/

-- Schema Version Tracking
CREATE TABLE IF NOT EXISTS schema_versions (
  version TEXT PRIMARY KEY,
  migration_file TEXT NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT,
  migration_type TEXT CHECK (migration_type IN ('baseline', 'feature', 'hotfix', 'data')),
  rollback_notes TEXT
);

-- Record this baseline migration
INSERT INTO schema_versions (version, migration_file, description, migration_type, rollback_notes) VALUES 
('1.0.0', '20241219_v1.0.0_baseline_schema.sql', 'Initial Supabase schema after Azure migration', 'baseline', 'This is the baseline - no rollback available. Would require full Azure restoration.');

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

/*
============================================================================
TABLE: users - Core User Identification
============================================================================
Purpose: Primary user identification via phone number (WhatsApp integration)
Migration Notes: Simplified from Azure schema - removed Azure-specific fields
*/
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT UNIQUE NOT NULL,
  email TEXT,
  name TEXT,
  timezone TEXT DEFAULT 'UTC',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_phone_format CHECK (phone_number ~ '^\+\d{10,15}$'),
  CONSTRAINT valid_email CHECK (email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

/*
============================================================================
TABLE: user_preferences - AI Configuration & Settings
============================================================================
Purpose: User preferences for AI personality, check-ins, and behavior
Migration Notes: Consolidated from multiple Azure tables into single preferences table
*/
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  default_personality TEXT DEFAULT 'taskmaster' CHECK (default_personality IN ('taskmaster', 'cheerleader')),
  groq_temperature NUMERIC(3,2) DEFAULT 0.8 CHECK (groq_temperature >= 0.0 AND groq_temperature <= 1.0),
  check_in_frequency TEXT DEFAULT 'daily' CHECK (check_in_frequency IN ('daily', 'weekly', 'custom')),
  reminder_enabled BOOLEAN DEFAULT true,
  weekend_check_ins BOOLEAN DEFAULT false,
  ai_memory_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

/*
============================================================================
TABLE: conversation_memory - Temporary Memory Storage
============================================================================
Purpose: Conversation context storage (PostgreSQL implementation of memory abstraction)
Migration Notes: Replaces Mem0 temporarily - designed for easy migration to Mem0 Cloud
Upgrade Path: Switch MEMORY_PROVIDER=mem0 environment variable to use Mem0 Cloud
*/
CREATE TABLE IF NOT EXISTS conversation_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Full-text search index for simple memory search
  CONSTRAINT content_not_empty CHECK (length(trim(content)) > 0)
);

/*
============================================================================
INDEXES - Performance Optimization
============================================================================
*/
-- User lookup optimization (primary access pattern: phone → user_id)
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);

-- Preferences optimization
CREATE INDEX IF NOT EXISTS idx_user_preferences_personality ON user_preferences(default_personality);

-- Memory search optimization (PostgreSQL full-text search)
CREATE INDEX IF NOT EXISTS idx_conversation_memory_user_id ON conversation_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_created_at ON conversation_memory(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_content ON conversation_memory USING gin(to_tsvector('english', content));

/*
============================================================================
ROW LEVEL SECURITY (RLS) - Supabase Security Model
============================================================================
*/
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS user_access_own_data ON users;
DROP POLICY IF EXISTS user_preferences_access ON user_preferences;
DROP POLICY IF EXISTS conversation_memory_access ON conversation_memory;

-- Users can only access their own data (service role has full access)
CREATE POLICY user_access_own_data ON users
  FOR ALL USING (
    auth.role() = 'service_role' OR
    id = auth.uid()::uuid
  );

CREATE POLICY user_preferences_access ON user_preferences  
  FOR ALL USING (
    auth.role() = 'service_role' OR
    user_id = auth.uid()::uuid
  );

CREATE POLICY conversation_memory_access ON conversation_memory  
  FOR ALL USING (
    auth.role() = 'service_role' OR
    user_id = auth.uid()::uuid
  );

/*
============================================================================
FUNCTIONS - Database Utilities
============================================================================
*/

-- Automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Apply trigger to user_preferences
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Health check function for Edge Functions
CREATE OR REPLACE FUNCTION get_table_names()
RETURNS TABLE(table_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT t.table_name::TEXT
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Memory search using PostgreSQL full-text search (Mem0 abstraction layer)
CREATE OR REPLACE FUNCTION search_memories(
  p_user_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
  memory_id UUID,
  content TEXT,
  relevance REAL,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.id,
    cm.content,
    ts_rank(to_tsvector('english', cm.content), plainto_tsquery('english', p_query)) as relevance,
    cm.metadata,
    cm.created_at
  FROM conversation_memory cm
  WHERE cm.user_id = p_user_id
    AND to_tsvector('english', cm.content) @@ plainto_tsquery('english', p_query)
  ORDER BY relevance DESC, cm.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Performance monitoring for health checks
CREATE OR REPLACE FUNCTION get_db_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM users),
    'active_users', (SELECT COUNT(*) FROM users WHERE status = 'active'),
    'preferences_configured', (SELECT COUNT(*) FROM user_preferences),
    'total_memories', (SELECT COUNT(*) FROM conversation_memory),
    'last_hour_activity', (SELECT COUNT(*) FROM users WHERE last_active > NOW() - INTERVAL '1 hour'),
    'database_size', pg_size_pretty(pg_database_size(current_database())),
    'schema_version', (SELECT version FROM schema_versions ORDER BY applied_at DESC LIMIT 1),
    'timestamp', NOW()
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/*
============================================================================
PERMISSIONS - Supabase Service Role Access
============================================================================
*/
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

/*
============================================================================
DOCUMENTATION - Table & Column Comments
============================================================================
*/
COMMENT ON TABLE users IS 'v1.0.0 - Core user data with phone number as primary identifier';
COMMENT ON TABLE user_preferences IS 'v1.0.0 - User settings and AI personality configuration';
COMMENT ON TABLE conversation_memory IS 'v1.0.0 - Chat context and conversation history (PostgreSQL memory implementation)';
COMMENT ON TABLE schema_versions IS 'v1.0.0 - Migration version tracking and rollback information';

COMMENT ON COLUMN users.phone_number IS 'International format phone number (+1234567890) - primary WhatsApp identifier';
COMMENT ON COLUMN user_preferences.default_personality IS 'AI personality: taskmaster (default) or cheerleader';
COMMENT ON COLUMN user_preferences.groq_temperature IS 'AI creativity level (0.0-1.0) for Groq API';
COMMENT ON COLUMN conversation_memory.content IS 'Conversation text for AI context - searchable via full-text search';
COMMENT ON COLUMN conversation_memory.metadata IS 'Additional context: platform, intent, personality used, etc.';

/*
============================================================================
TEST DATA - Development & Testing
============================================================================
*/
-- Insert test user for WhatsApp testing (idempotent)
INSERT INTO users (id, phone_number, email, name, timezone) VALUES 
('550e8400-e29b-41d4-a716-446655440000', '+17817470041', 'test@hustlemode.ai', 'Test User', 'America/New_York')
ON CONFLICT (phone_number) DO NOTHING;

INSERT INTO user_preferences (user_id, default_personality, groq_temperature) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'taskmaster', 0.8)
ON CONFLICT (user_id) DO NOTHING;

/*
============================================================================
MIGRATION COMPLETE - v1.0.0 Baseline Established
============================================================================
Expected Schema Version: 1.0.0
Tables Created: 4 (users, user_preferences, conversation_memory, schema_versions)
Functions Created: 4 (update_updated_at_column, get_table_names, search_memories, get_db_stats)
Indexes Created: 6 performance indexes
RLS Policies: 3 policies for data protection
Next Migration: Any schema changes should increment to v1.1.0, v1.2.0, etc.
============================================================================
*/ 