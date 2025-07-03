-- HustleMode.ai Database Schema for Supabase PostgreSQL
-- Optimized 2-table structure with Row Level Security (RLS)
-- Migrated from Azure PostgreSQL to Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table (Core user data)
CREATE TABLE users (
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

-- User Preferences Table (Settings and AI configuration)  
CREATE TABLE user_preferences (
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

-- Conversation Memory Table (Replaces Mem0 for now)
CREATE TABLE conversation_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Full-text search index for simple memory search
  CONSTRAINT content_not_empty CHECK (length(trim(content)) > 0)
);

-- Indexes for Performance
CREATE INDEX idx_users_phone_number ON users(phone_number);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_last_active ON users(last_active);
CREATE INDEX idx_user_preferences_personality ON user_preferences(default_personality);

-- Memory search indexes
CREATE INDEX idx_conversation_memory_user_id ON conversation_memory(user_id);
CREATE INDEX idx_conversation_memory_created_at ON conversation_memory(created_at DESC);
CREATE INDEX idx_conversation_memory_content ON conversation_memory USING gin(to_tsvector('english', content));

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own data
CREATE POLICY user_access_own_data ON users
  FOR ALL USING (
    -- Allow service role full access
    auth.role() = 'service_role' OR
    -- Users can access their own records
    id = auth.uid()::uuid
  );

CREATE POLICY user_preferences_access ON user_preferences  
  FOR ALL USING (
    -- Allow service role full access
    auth.role() = 'service_role' OR
    -- Users can access their own preferences
    user_id = auth.uid()::uuid
  );

CREATE POLICY conversation_memory_access ON conversation_memory  
  FOR ALL USING (
    -- Allow service role full access
    auth.role() = 'service_role' OR
    -- Users can access their own memories
    user_id = auth.uid()::uuid
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get table names (for health checks)
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

-- Memory search function using PostgreSQL full-text search
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

-- Insert default data for testing (optional)
-- Uncomment for development environment
/*
INSERT INTO users (id, phone_number, email, name, timezone) VALUES 
('550e8400-e29b-41d4-a716-446655440000', '+17817470041', 'test@hustlemode.ai', 'Test User', 'America/New_York');

INSERT INTO user_preferences (user_id, default_personality, groq_temperature) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'taskmaster', 0.8);
*/

-- Storage and Analytics Views (Optional - for monitoring)
CREATE VIEW user_stats AS
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
  COUNT(CASE WHEN last_active > NOW() - INTERVAL '7 days' THEN 1 END) as weekly_active_users,
  COUNT(CASE WHEN last_active > NOW() - INTERVAL '1 day' THEN 1 END) as daily_active_users,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_users_this_week
FROM users;

CREATE VIEW personality_distribution AS
SELECT 
  default_personality,
  COUNT(*) as user_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM user_preferences up
JOIN users u ON up.user_id = u.id
WHERE u.status = 'active'
GROUP BY default_personality
ORDER BY user_count DESC;

CREATE VIEW memory_stats AS
SELECT 
  COUNT(*) as total_memories,
  COUNT(DISTINCT user_id) as users_with_memories,
  AVG(length(content)) as avg_memory_length,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as memories_this_week
FROM conversation_memory;

-- Grant permissions for service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Comments for documentation
COMMENT ON TABLE users IS 'Core user data with phone number as primary identifier';
COMMENT ON TABLE user_preferences IS 'User settings and AI personality configuration';
COMMENT ON TABLE conversation_memory IS 'Chat context and conversation history for AI memory';
COMMENT ON COLUMN users.phone_number IS 'International format phone number (+1234567890)';
COMMENT ON COLUMN user_preferences.default_personality IS 'AI personality: taskmaster or cheerleader';
COMMENT ON COLUMN user_preferences.groq_temperature IS 'AI creativity level (0.0-1.0)';
COMMENT ON COLUMN conversation_memory.content IS 'Conversation text for AI context';
COMMENT ON COLUMN conversation_memory.metadata IS 'Additional context: platform, intent, etc.';

-- Performance monitoring function
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
    'timestamp', NOW()
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 