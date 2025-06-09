# HustleMode.ai Database Schemas

This directory contains the complete database schema definitions for the HustleMode.ai WhatsApp bot application, exported from production and organized according to the schema management guidelines.

## 📁 Directory Structure

```
schemas/
├── user-management/          # User authentication and preferences
│   ├── users.json           # Main user table
│   ├── user_preferences.json # User preferences and settings
│   └── CHANGELOG.md
├── goal-tracking/           # Goal management and progress
│   ├── goals.json          # Core goals table
│   ├── goal_progress.json  # Progress tracking entries
│   └── CHANGELOG.md
├── check-ins/              # Accountability check-ins
│   ├── check_ins.json      # Scheduled check-ins
│   ├── check_in_responses.json # User responses to check-ins
│   └── CHANGELOG.md
├── conversation/           # WhatsApp conversations
│   ├── conversation_history.json # Message history with AI analysis
│   └── CHANGELOG.md
└── README.md              # This file
```

## 🗃️ Schema Overview

### User Management
- **users**: Core user authentication and profile data
- **user_preferences**: Check-in preferences, Goggins intensity, and settings

### Goal Tracking  
- **goals**: User goals with categories, priorities, and success criteria
- **goal_progress**: Time-series progress tracking with multiple data sources

### Check-ins
- **check_ins**: Scheduled accountability check-ins
- **check_in_responses**: Detailed user responses with AI analysis

### Conversation
- **conversation_history**: WhatsApp message logging with intent detection and Mem0 integration

## 🔄 Schema Version

**Current Version**: 1.0.0  
**Last Updated**: 2025-01-16  
**Exported From**: hustlemode-ai-postgres.postgres.database.azure.com

## 🏗️ Database Features

- **UUID Primary Keys**: All tables use UUID for scalability
- **JSONB Support**: Flexible storage for preferences, analysis, and metadata
- **Comprehensive Indexing**: Optimized for common query patterns
- **Foreign Key Constraints**: CASCADE DELETE for data integrity
- **Check Constraints**: Data validation at database level
- **Triggers**: Automatic timestamp updates where needed

## 📊 Table Relationships

```
users (1) → (∞) user_preferences
users (1) → (∞) goals
users (1) → (∞) conversation_history
goals (1) → (∞) goal_progress
goals (1) → (∞) check_ins
check_ins (1) → (∞) check_in_responses
```

## 🚀 Production Status

- **Database Server**: hustlemode-ai-postgres.postgres.database.azure.com
- **Database Name**: postgres (default database)
- **Environment**: Production
- **Connection**: Azure AD authentication required

## 📖 Usage

Each schema directory contains:
1. **JSON Schema Files**: Complete table definitions following the schema management format
2. **CHANGELOG.md**: Version history and change documentation

To deploy these schemas to a new environment, use the JSON definitions to generate the appropriate CREATE TABLE statements for your target database system.

## 🔍 Schema Management

This schema collection follows the established schema management guidelines:
- Semantic versioning for all changes
- Comprehensive documentation in CHANGELOG files
- JSON format for cross-platform compatibility
- Modular organization by functional area 