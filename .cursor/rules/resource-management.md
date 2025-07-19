---
description: "CRITICAL: Never delete resources without explicit user approval - databases, functions, files"
globs: ["**/*"]
alwaysApply: true
---

# Resource Management Rules

## 🚫 CRITICAL: NO RESOURCE DELETION WITHOUT APPROVAL

### Supabase Resources
- **NEVER** run `supabase projects delete` without explicit user approval
- **NEVER** run `supabase functions delete` without explicit user approval  
- **NEVER** run `supabase db reset` in production without explicit user approval
- **NEVER** run any destructive Supabase commands without explicit user approval

### Database Operations
- **NEVER** drop databases without explicit user approval
- **NEVER** truncate tables without explicit user approval
- **NEVER** delete data without explicit user approval
- **NEVER** run `supabase db reset` without explicit user approval

### Local Files and Directories
- **NEVER** run `rm -rf` on any directory without explicit user approval
- **NEVER** delete configuration files without explicit user approval
- **NEVER** delete deployment scripts without explicit user approval
- **ALWAYS** archive/backup files before any deletion

### Edge Functions & Code
- **NEVER** delete function directories without explicit user approval
- **NEVER** remove shared utilities without explicit user approval
- **NEVER** delete TypeScript files without explicit user approval

## ✅ Required Process for Resource Changes

### Before ANY Deletion:
1. **ASK THE USER EXPLICITLY**: "Do you want me to delete [specific resource]?"
2. **WAIT FOR CONFIRMATION**: Do not proceed until user says "yes" or "delete it"
3. **SUGGEST ALTERNATIVES**: Always offer backup/archive options first

### Safe Operations (No Approval Needed):
- Creating new resources
- Updating existing resources
- Reading/listing resources
- Archiving/backing up files
- Building and deploying code
- Running health checks

## 🔧 Alternative Approaches

### Instead of Deleting:
- **Archive** old files to `archive/` directory
- **Comment out** code instead of deleting
- **Rename** with `.old` or `.backup` suffix
- **Move** to temporary location

### Resource Recreation:
- Always check if resource exists first
- Create with different names if conflicts
- Use incremental naming (v1, v2, etc.)

## 📋 Emergency Procedures

If a deletion is absolutely necessary:
1. **Create full backup first**
2. **Document the reason for deletion**
3. **Get explicit user confirmation**
4. **Provide rollback plan**

## 🛡️ Supabase-Specific Protection

### Protected Supabase Operations
```bash
# ❌ FORBIDDEN WITHOUT APPROVAL
supabase projects delete
supabase functions delete
supabase db reset --linked (in production)
supabase secrets unset

# ✅ SAFE OPERATIONS
supabase functions deploy
supabase functions logs
supabase secrets list
supabase db status
```

### Database Protection
```bash
# ❌ FORBIDDEN WITHOUT APPROVAL
DROP DATABASE production;
DELETE FROM users;
TRUNCATE TABLE conversation_memory;

# ✅ SAFE OPERATIONS
SELECT * FROM users;
INSERT INTO users (...);
UPDATE user_preferences SET ...;
```

## 🚨 Emergency Procedures

### Function Recovery
```bash
# If function accidentally deleted:
# 1. Check git history for function code
# 2. Restore from backup
# 3. Redeploy function
supabase functions deploy function_name --no-verify-jwt
```

### Database Recovery
```bash
# If data accidentally deleted:
# 1. Check if point-in-time recovery available
# 2. Restore from most recent backup
# 3. Contact Supabase support if needed
```

This rule applies to ALL operations involving deletion, removal, or destruction of ANY Supabase resources, Edge Functions, database data, or local files. 