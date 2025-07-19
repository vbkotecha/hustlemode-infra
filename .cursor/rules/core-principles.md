---
description: "Core development principles - no shortcuts, fix root causes, small files, test first"
globs: ["**/*"]
alwaysApply: true
---

# Core Development Principles

## 🚨 MANDATORY PRACTICES

### 1. No Shortcuts or Re-engineering
- **FIX** the actual issue, don't add workarounds
- **DEBUG** properly: check logs, test imports, verify syntax
- **NEVER** add fallback mechanisms without fixing the root cause

### 2. Small, Manageable Files
- **Edge Functions**: ≤100 lines per index.ts
- **Shared Modules**: ≤80 lines per module
- **Handlers**: ≤120 lines maximum
- **Break down** large functions into smaller, focused modules

### 3. Test-First Development
- **Write tests BEFORE** implementing functionality
- **Red → Green → Refactor** cycle
- **95%+ coverage** for domain layer
- **Run tests** after every change

### 4. Semantic LLM Understanding
- **ALWAYS** use Judge/Eval/Orchestrator pattern
- **NEVER** use keyword matching or string.includes()
- **ALL** intent analysis through LLM reasoning

### 5. Proper Deployment
```bash
# ALWAYS use deployment script (NEVER raw commands):
./scripts/deploy-supabase.sh

# Script includes automatic quality checks and proper flags
# Raw commands are prohibited in favor of standardized deployment
```

### 6. Resource Protection
- **NEVER** delete without explicit user approval
- **ALWAYS** backup before any deletion
- **ASK** "Do you want me to delete [resource]?"

### 7. Concise Communication
- **Be brief** and actionable
- **8-12 words** for WhatsApp responses
- **No long explanations** unless requested

## 🎯 Development Workflow

1. **Check quality** before commits: `./scripts/code-quality-check.sh`
2. **Fix violations** before proceeding
3. **Test thoroughly** before deployment
4. **Document changes** in appropriate files

## ❌ PROHIBITED PATTERNS

- Adding to large files instead of creating new modules
- Copy-paste fixes instead of shared solutions
- Keyword matching for intent analysis
- Deploying without quality checks
- **Raw deployment commands** (`supabase functions deploy` - use script instead)
- Deleting resources without permission
- Creating files without clear purpose

## ✅ REQUIRED PATTERNS

- Single responsibility per file
- Interface-based abstractions
- Proper error handling
- Performance monitoring
- Security validation
- Documentation updates

---
**Remember**: Quality is enforced automatically. Follow the patterns, and the system helps you succeed. 