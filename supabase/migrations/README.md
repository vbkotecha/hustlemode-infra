# HustleMode.ai Database Migrations

Automated semantic versioning system for Supabase PostgreSQL schema management.

## 🎯 Overview

This migration system provides:
- **Semantic Versioning**: All migrations follow semver (1.0.0 → 1.1.0 → 2.0.0)
- **Version Tracking**: `schema_versions` table tracks all applied migrations
- **Automated Scripts**: Tools for creating and deploying migrations safely
- **Rollback Guidance**: Clear rollback instructions for each migration
- **Documentation**: Comprehensive migration history and context

## 📁 Directory Structure

```
supabase/migrations/
├── README.md                                    # This file
├── 20241219_v1.0.0_baseline_schema.sql         # Baseline migration (v1.0.0)
└── [future migrations...]                      # Future versioned migrations
```

## 🚀 Quick Start

### Creating a New Migration
```bash
# Minor feature addition (1.0.0 → 1.1.0)
./scripts/create-migration.sh "add_user_settings" minor

# Bug fix (1.1.0 → 1.1.1)  
./scripts/create-migration.sh "fix_phone_constraint" patch

# Breaking change (1.1.1 → 2.0.0)
./scripts/create-migration.sh "remove_legacy_table" major

# Emergency fix (1.1.1 → 1.1.2)
./scripts/create-migration.sh "critical_security_fix" hotfix
```

### Deploying Migrations
```bash
# Test locally first
./scripts/deploy-migrations.sh --local

# Preview production deployment
./scripts/deploy-migrations.sh --production --dry-run

# Deploy to production (with safety checks)
./scripts/deploy-migrations.sh --production
```

## 📋 Migration Workflow

### 1. Planning
- Determine migration type: `major` | `minor` | `patch` | `hotfix`
- Write clear, descriptive name using underscores
- Consider rollback strategy before starting

### 2. Creation
```bash
./scripts/create-migration.sh "your_description" [type]
```
This creates a properly versioned migration file with:
- Semantic version in filename
- Pre-filled template with documentation sections
- Version tracking entry
- Rollback guidance placeholder

### 3. Development
Edit the generated migration file:
- Add SQL changes between `BEGIN MIGRATION CHANGES` and `END MIGRATION CHANGES`
- Update description and rollback notes
- Document all changes made

### 4. Testing
```bash
# Test on local database
./scripts/deploy-migrations.sh --local

# Verify health endpoints still work
curl http://localhost:54321/functions/v1/health
```

### 5. Production Deployment
```bash
# Preview first
./scripts/deploy-migrations.sh --production --dry-run

# Deploy with safety checks
./scripts/deploy-migrations.sh --production
```

## 🏷️ Version Types

| Type | When to Use | Version Change | Example |
|------|-------------|----------------|---------|
| `major` | Breaking changes, removed features | 1.0.0 → 2.0.0 | Remove table, change constraints |
| `minor` | New features, non-breaking additions | 1.0.0 → 1.1.0 | Add table, new columns |
| `patch` | Bug fixes, small improvements | 1.0.0 → 1.0.1 | Fix constraint, optimize index |
| `hotfix` | Emergency fixes | 1.0.0 → 1.0.1 | Critical security patch |

## 📊 Version Tracking

All migrations are tracked in the `schema_versions` table:

```sql
-- View current schema version
SELECT version, description, applied_at 
FROM schema_versions 
ORDER BY applied_at DESC 
LIMIT 1;

-- View migration history
SELECT version, migration_file, description, migration_type, applied_at
FROM schema_versions 
ORDER BY applied_at ASC;
```

## 🛡️ Safety Features

### Pre-Deployment Validation
- File naming convention enforcement
- Version numbering validation
- SQL syntax basic checks
- Migration template compliance

### Deployment Safety
- Production confirmation prompts
- Health endpoint verification after deployment
- Automatic rollback guidance on failures
- Database connectivity checks

### Version Consistency
- Prevents duplicate version numbers
- Ensures sequential version increments
- Validates schema_versions table entries

## 🚨 Emergency Procedures

### If Migration Fails
1. **Check Error Logs**:
   ```bash
   supabase functions logs --project-ref yzfclhnkxpgyxeklrvur
   ```

2. **Rollback Options**:
   ```bash
   # Quick local rollback
   supabase db reset --linked
   
   # Production rollback (use Supabase Dashboard)
   # Navigate to Database → Backups → Restore
   ```

3. **Fix and Redeploy**:
   ```bash
   ./scripts/create-migration.sh "fix_migration_issue" hotfix
   # Edit the new migration to fix the issue
   ./scripts/deploy-migrations.sh --production
   ```

### Schema Version Mismatch
If production and migration files don't match:
```bash
# Check current production version
curl https://yzfclhnkxpgyxeklrvur.supabase.co/functions/v1/health

# Compare with migration files
ls -la supabase/migrations/*_v*.sql

# Reset to known good state if needed
supabase db reset --linked
```

## 📚 Migration History

### v1.0.0 - Baseline Schema
- **File**: `20241219_v1.0.0_baseline_schema.sql`
- **Date**: 2024-12-19
- **Type**: BASELINE
- **Description**: Initial Supabase schema after Azure migration
- **Tables**: users, user_preferences, conversation_memory, schema_versions
- **Features**: RLS policies, full-text search, performance indexes

## 🛠️ Development Guidelines

### Migration File Template
Each migration includes:
- Header with version, date, type, author
- Detailed description and context
- Change checklist
- Rollback instructions
- Testing checklist
- Version tracking insert statement

### Best Practices
- **One logical change per migration**
- **Test on local database first**
- **Document rollback procedures**
- **Use descriptive names**
- **Include performance considerations**
- **Test Edge Functions after deployment**

### Code Review Requirements
Before deploying to production:
- [ ] Migration logic reviewed
- [ ] Rollback instructions documented
- [ ] Performance impact assessed
- [ ] Edge Functions compatibility verified
- [ ] Local testing completed

## 🔗 Related Documentation

- [Cursor Rules: Schema Management](.cursor/rules/schema.mdc)
- [Deployment Configuration](deployment-config.json)
- [Health Check Script](scripts/health-check.sh)
- [Supabase Dashboard](https://supabase.com/dashboard/project/yzfclhnkxpgyxeklrvur)

## 📞 Support

For migration issues:
1. Check this README first
2. Review migration logs and error messages
3. Test fixes on local environment
4. Contact team for production rollback assistance

---
**Remember**: Always test locally first, document rollback procedures, and use the automated scripts for consistency. 