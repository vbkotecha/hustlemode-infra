# Changelog - Conversation Schemas

All notable changes to the conversation database schemas will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

### Notes
- JSONB fields provide flexible storage for AI analysis results
- Message type constraints ensure data validity
- Indexing optimized for conversation retrieval and analysis
- Mem0 integration enables persistent user memory
- Azure OpenAI tracing supports debugging and performance monitoring
- Processing time tracking enables performance optimization
- Foreign key relationship maintains user data integrity 