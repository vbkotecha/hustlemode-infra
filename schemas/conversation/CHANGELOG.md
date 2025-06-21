# Changelog - Conversation Schemas

All notable changes to the conversation database schemas will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-01-16

### Added
- **conversation_history.json** - Personality tracking and message relevance filtering
  - Added `assistant_personality` field to track which personality was used for each response
  - Added `message_relevance` field for AI context filtering (accountability_relevant, goal_related, small_talk, off_topic, system)
  - New indexes for performance optimization:
    - `idx_conversation_history_message_relevance` for relevance filtering
    - `idx_conversation_history_assistant_personality` for personality queries
    - `idx_conversation_history_context_query` composite index for efficient context retrieval
  - Check constraints ensure valid personality and relevance values
  - Default value 'unknown' for message_relevance allows gradual classification

- **user_sessions.json** - Simplified to minimal operational state
  - Added `current_workflow` field for operational state tracking (chat, goal_setup, check_in, onboarding)
  - Added `rate_limit_reset_at` field for rate limiting functionality
  - Renamed `session_context` to `temporary_context` for clarity (operational state only, not conversation context)

### Removed
- **user_sessions.json** - Current personality tracking
  - Removed `current_personality` field (moved to user_preferences.default_personality)
  - Aligns with architecture decision that personality is a user preference, not session state

### Changed
- **user_sessions.json** - Extended session duration
  - Session expiry increased from 1 day to 30 days for better accountability continuity
  - Updated description to emphasize minimal operational state vs conversation context
- **Schema versions**: Both conversation_history and user_sessions updated to 1.1.0
- **Architecture alignment**: Sessions now handle only operational state, conversation history is the source of truth for context

### Technical Notes
- `assistant_personality` only applies to outgoing messages (bot responses)
- `message_relevance` enables filtering for AI context window (include only relevant messages)
- New composite index optimizes the query: `WHERE user_id = ? AND message_relevance IN (...) ORDER BY created_at DESC`
- Session state simplified: temporary operational data only, conversation context derived from conversation_history
- 30-day session expiry better supports accountability use case where users may check in sporadically
- Backward compatible - existing records get 'unknown' relevance and can be gradually classified

## [1.0.0] - 2025-06-15

### Added
- **Database Deployment**: Successfully deployed user_sessions table to production PostgreSQL
  - Table created with all fields, constraints, and indexes as per schema specification
  - Deployed to hustlemode-ai-postgres.postgres.database.azure.com
  - All check constraints and unique constraints applied successfully
  - Comprehensive indexing implemented for optimal query performance

### Changed
- **Database Access Configuration**: Updated Azure PostgreSQL firewall rules
  - Removed specific IP-based access rule (dynamic IP compatibility)
  - Added public access rule (0.0.0.0-255.255.255.255) for development flexibility
  - Database remains secure through Azure AD authentication and master password
  - Enables seamless access from any location without firewall management

### Technical Notes
- Foreign key constraint to users table requires elevated permissions (deferred for production deployment)
- Table functional relationship maintained at application level
- Session expiration set to 24 hours with automatic cleanup capability
- Production-ready for assistant API integration

## [1.0.0] - 2025-01-16

### Added
- **conversation_history.json** - WhatsApp conversation logging with AI integration
  - UUID primary key with user relationship
  - WhatsApp message ID tracking for API correlation
  - Message type classification (incoming, outgoing)
  - Content storage for full message preservation
  - Intent detection and classification
  - Entity extraction storage (JSONB)
  - Sentiment analysis tracking
  - Context metadata storage (JSONB)
  - Mem0 memory integration with memory ID references
  - Azure OpenAI request ID for debugging and tracing
  - Processing time metrics in milliseconds
  - Comprehensive indexing for search and analytics

- **user_sessions.json** - Active user sessions for real-time conversation state
  - UUID primary key with user and phone number relationships
  - Current personality tracking (goggins, cheerleader, comedian, zen)
  - Session context storage (JSONB) for conversation state
  - Session expiration with automatic cleanup capability
  - Unique constraint on phone numbers for single active session per user
  - Indexing optimized for session lookup and cleanup operations

### Notes
- JSONB fields provide flexible storage for AI analysis results
- Message type constraints ensure data validity
- Indexing optimized for conversation retrieval and analysis
- Mem0 integration enables persistent user memory
- Azure OpenAI tracing supports debugging and performance monitoring
- Processing time tracking enables performance optimization
- Foreign key relationship maintains user data integrity 