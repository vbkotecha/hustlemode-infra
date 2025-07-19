# Cursor Rules Overview

This directory contains automated development rules that enforce quality and best practices for the HustleMode.ai codebase.

## Active Rules (alwaysApply: true)

### 1. **core-principles.md**
- **Purpose**: Enforces fundamental development practices
- **Key Rules**: No shortcuts, small files, test-first, proper debugging
- **Applies to**: All files

### 2. **code-quality-enforcement.mdc**
- **Purpose**: Automated file size limits and duplication prevention
- **Key Rules**: Edge functions ≤100 lines, modules ≤80 lines, zero duplication
- **Applies to**: All TypeScript/JavaScript files

### 3. **debugging.md**
- **Purpose**: Ensures proper debugging practices
- **Key Rules**: Fix root causes, no band-aids, proper investigation
- **Applies to**: All code files

### 4. **llm-semantic-understanding.md**
- **Purpose**: Enforces LLM-based analysis over keyword matching
- **Key Rules**: Judge/Eval/Orchestrator pattern, no string.includes()
- **Applies to**: AI tools and message analysis

### 5. **resource-management.md**
- **Purpose**: Prevents accidental resource deletion
- **Key Rules**: Never delete without explicit approval
- **Applies to**: All files and resources

## Context-Specific Rules (alwaysApply: false)

### 6. **deployment.mdc**
- **Purpose**: Supabase deployment standards
- **When Applied**: Working with Supabase functions, deployment scripts
- **Key Rules**: Quality checks before deployment, proper commands

### 7. **environment-automation.mdc**
- **Purpose**: Environment variable management
- **When Applied**: Working with .env files, configuration
- **Key Rules**: Proper secret management, testing automation

### 8. **goal-management.md**
- **Purpose**: Goal system implementation patterns
- **When Applied**: Working with goal-related tools
- **Key Rules**: LLM semantic understanding for goals

### 9. **personality-system.mdc**
- **Purpose**: 2-personality system constraints
- **When Applied**: Working with AI personalities, prompts
- **Key Rules**: 8-12 word responses, Taskmaster/Cheerleader only

### 10. **prompts.mdc**
- **Purpose**: AI prompt version control
- **When Applied**: Working with prompt templates
- **Key Rules**: Semantic versioning, metadata

### 11. **schema.mdc**
- **Purpose**: Database schema management
- **When Applied**: Working with migrations
- **Key Rules**: Single source of truth, migration scripts

### 12. **sentinel-patterns.mdc**
- **Purpose**: Disciplined development workflow
- **When Applied**: Documentation, testing, task management
- **Key Rules**: TDD, proper documentation

### 13. **supabase-deployment-testing.mdc**
- **Purpose**: Deployment and testing procedures
- **When Applied**: Deploying or testing Supabase functions
- **Key Rules**: Pre-deployment checks, testing protocols

### 14. **cursor-rule-writing.md**
- **Purpose**: Meta-rule for writing effective cursor rules
- **When Applied**: Creating or updating cursor rules
- **Key Rules**: Structure, metadata, enforcement patterns

## Quick Reference

### Before Committing:
1. Run `./scripts/code-quality-check.sh`
2. Fix any violations
3. Ensure tests pass

### Before Deploying:
1. Check environment variables
2. Run quality checks
3. Use `supabase functions deploy --no-verify-jwt`

### When Debugging:
1. Check logs first
2. Fix root cause
3. No band-aid solutions

### When Deleting:
1. Always ask for approval
2. Consider archiving instead
3. Never use `rm -rf` without permission 