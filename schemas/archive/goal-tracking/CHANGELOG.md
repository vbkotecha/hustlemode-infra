# Changelog - Goal Tracking Schemas

All notable changes to the goal tracking database schemas will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-16

### Added
- **goals.json** - Core goals table with comprehensive tracking capabilities
  - UUID primary key with user relationship
  - Goal categorization (fitness, career, learning, personal, health, financial, general)
  - Priority levels (low, medium, high, critical)
  - Status tracking (active, paused, completed, failed, cancelled)
  - Measurable targets with value and unit fields
  - Current progress tracking with numeric precision
  - Target date support for deadline management
  - Success criteria and obstacles (JSONB for flexibility)
  - Why important field for motivation tracking
  - Accountability levels (low, medium, high)
  - Automatic updated_at trigger
  - Comprehensive indexing for performance

- **goal_progress.json** - Progress tracking entries with data source attribution
  - UUID primary key with goal and user relationships
  - Numeric progress values with decimal precision
  - Progress percentage calculations (0-100 constraint)
  - Notes field for context and details
  - Data source tracking (manual, check_in, api, import)
  - Timestamp tracking for progress history
  - Foreign key constraints with CASCADE DELETE

### Notes
- All numeric fields use appropriate precision for accurate tracking
- Check constraints ensure data validity and business rules
- JSONB fields provide flexible storage for obstacles and metadata
- Indexing optimized for common query patterns (user, goal, date ranges)
- Progress percentage automatically constrained to valid range 