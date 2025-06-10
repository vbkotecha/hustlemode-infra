---
description: "Resource management rules - NEVER delete any resources without explicit user approval"
globs: "**/*"
alwaysApply: true
---

# Resource Management Rules

## 🚫 CRITICAL: NO RESOURCE DELETION WITHOUT APPROVAL

### Azure Resources
- **NEVER** run `az functionapp delete` without explicit user approval
- **NEVER** run `az storage account delete` without explicit user approval  
- **NEVER** run `az group delete` without explicit user approval
- **NEVER** run any `az * delete` commands without explicit user approval

### Local Files and Directories
- **NEVER** run `rm -rf` on any directory without explicit user approval
- **NEVER** delete configuration files without explicit user approval
- **NEVER** delete deployment scripts without explicit user approval
- **ALWAYS** archive/backup files before any deletion

### Database Operations
- **NEVER** drop databases without explicit user approval
- **NEVER** truncate tables without explicit user approval
- **NEVER** delete collections without explicit user approval

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

## 🛡️ Protection Examples

```bash
# ❌ FORBIDDEN WITHOUT APPROVAL
az functionapp delete --name myapp
rm -rf important-directory/
DROP DATABASE production;

# ✅ SAFE OPERATIONS
az functionapp create --name myapp
mkdir archive/
cp -r important-directory/ archive/backup-$(date +%s)/
```

This rule applies to ALL operations involving deletion, removal, or destruction of ANY resources, files, or data. 