# Changelog - User Management Schemas

All notable changes to the user management database schemas will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-16

### Added
- **users.json** - Main user table schema with authentication and profile data
  - UUID primary key with auto-generation
  - Phone number unique constraint (WhatsApp integration)
  - Email unique constraint with optional field
  - User status with check constraints (active, inactive, blocked)
  - Timezone support for check-in scheduling
  - JSONB notification settings with defaults
  - Full indexing on critical fields (phone, email, status, last_active)

- **user_preferences.json** - User preferences for check-ins and bot behavior
  - Check-in frequency options (daily, every_other_day, weekly, custom)
  - Time and timezone preferences for scheduling
  - Goggins intensity levels (low, medium, high, brutal)
  - Boolean flags for reminders and weekend check-ins
  - JSONB custom check-in days for flexible scheduling
  - AI memory toggle for Mem0 integration
  - Automatic updated_at trigger

### Notes
- All tables use UUID primary keys for scalability
- Foreign key relationships include CASCADE DELETE for data integrity
- JSONB fields support flexible configuration storage
- Comprehensive indexing for query performance
- Check constraints ensure data validity 