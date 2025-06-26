# Changelog - Check-ins Schemas

All notable changes to the check-ins database schemas will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-16

### Added
- **check_ins.json** - Scheduled check-ins for goal accountability
  - UUID primary key with user and goal relationships
  - Scheduled timestamp for precise timing
  - Completion tracking with optional completed_at
  - Status management (pending, completed, skipped, missed)
  - Check-in types (regular, weekly_review, milestone, emergency)
  - JSONB questions field for flexible question storage
  - Comprehensive indexing for scheduling queries
  - Foreign key constraints with CASCADE DELETE

- **check_in_responses.json** - Detailed user responses to check-ins
  - UUID primary key with check-in, user, and goal relationships
  - Progress rating scale (1-10 with constraints)
  - Current value and completion percentage tracking
  - Qualitative fields for challenges and wins
  - Energy and motivation level tracking (1-10 scales)
  - Next actions planning field
  - Help needed flag and description
  - Raw response preservation
  - AI analysis storage (JSONB)
  - Generated Goggins response storage
  - Comprehensive constraint validation for rating scales

### Notes
- All rating fields constrained to valid 1-10 ranges
- Percentage fields constrained to 0-100 range
- JSONB fields support flexible AI analysis storage
- Timestamp tracking for response analysis
- Foreign key relationships maintain referential integrity
- Indexing optimized for reporting and analytics queries 