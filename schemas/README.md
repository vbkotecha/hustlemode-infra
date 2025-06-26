# Database Schemas - AI-First Architecture

This directory contains PostgreSQL schema definitions for **static user data** in the HustleMode.ai AI-first coaching system.

## 🎯 **Architecture Overview**

**PostgreSQL**: Static user data (identification, preferences, platform settings)  
**Mem0**: Dynamic AI context (goals, conversations, check-ins, behavioral patterns)

## ✅ **Active Schemas**

### User Management
- `user-management/users.json` - Core user identification and static profile data
- `user-management/user_preferences.json` - Static preferences including personality and messaging platform settings

## 📁 **Archived Schemas**

Moved to `archive/` folder as they're now handled by Mem0 + AI tools:
- `archive/goal-tracking/` - Goals now stored dynamically in Mem0 with AI context
- `archive/conversation/` - Conversations now in Mem0 with semantic search
- `archive/check-ins/` - Check-ins now handled by AI tools with Mem0 storage

## 🔄 **Data Flow**

```
1. Phone Number → User ID lookup (PostgreSQL)
2. Get static preferences (PostgreSQL) 
3. Pass user_id to Mem0 for dynamic context
4. AI processes message + selects tools
5. Store results in Mem0
6. Update last_active in PostgreSQL
```

## 📊 **Simplified Database**

**Before**: 6+ tables for everything  
**After**: 2 tables for static data, Mem0 for intelligence

### Benefits
- **Faster Performance**: Focused PostgreSQL queries
- **AI Intelligence**: Mem0 provides semantic understanding  
- **Easy Scaling**: Static data in PostgreSQL, dynamic data in Mem0
- **Tool Extensibility**: New AI capabilities don't require schema changes

## 🚀 **Schema Usage**

### Code Example
```python
# PostgreSQL: Static user lookup
user = get_user_by_phone(phone_number)
preferences = get_user_preferences(user['id'])

# Mem0: Dynamic AI context
memory_service = MemoryService()
context = memory_service.search_memories(user_id=user['id'])

# AI Tools: Handle goals, check-ins, reminders automatically
response = universal_chat({
    "user_id": user['id'],
    "message": message,
    "personality": preferences['default_personality']
})
```

## 📋 **Versioning**

All active schemas include version numbers and change logs. Archived schemas are preserved for reference but no longer actively maintained.

---
**Focus**: Minimal PostgreSQL schema supporting AI-first architecture with Mem0 handling all dynamic coaching intelligence. 