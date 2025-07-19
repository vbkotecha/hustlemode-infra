---
description: "Meta-rule: Conflict-aware cursor rule writing - mandatory planning, no shortcuts, unified standards"
globs: [".cursor/rules/**/*.md", ".cursor/rules/**/*.mdc"]
alwaysApply: true
---

# Cursor Rule Writing Guidelines

## 🎯 Core Principles for Effective Rules

### 1. **Clear Metadata Header**
Every rule MUST start with:
```yaml
---
description: "Brief, actionable description - what it does, not what it contains"
globs: ["specific/path/**/*.ts", "!exclude/these/**"]
alwaysApply: true/false
---
```

### 2. **Description Best Practices**
- **Action-oriented**: "Enforce X" not "Guidelines for X"
- **Specific outcomes**: "file size limits, zero duplication" not "code quality"
- **Brief**: Maximum 15-20 words
- **Keywords**: Include searchable terms developers would look for

### 3. **Glob Pattern Rules**
```yaml
# ✅ GOOD - Specific and targeted
globs: ["supabase/functions/**/*.ts", "scripts/deploy-*.sh", "!node_modules/**"]

# ❌ BAD - Too broad or vague
globs: ["**/*", "*.ts"]
```

### 4. **alwaysApply Decision Tree**
Set to `true` when:
- Rule prevents critical failures (security, data loss)
- Rule enforces non-negotiable standards (no shortcuts, fix root causes)
- Rule applies to all code regardless of context

Set to `false` when:
- Rule is context-specific (deployment, testing)
- Rule applies to specific file types or workflows
- Rule is advisory rather than mandatory

## 📋 Rule Structure Template

```markdown
---
description: "[Action verb] [what] - [key outcomes]"
globs: ["specific/paths/**/*"]
alwaysApply: true/false
---

# [Rule Title]

## 🚨 CRITICAL RULE: [One-line summary]
[User demand or critical requirement if applicable]

## ❌ PROHIBITED PATTERNS
[What NOT to do - specific examples]

## ✅ REQUIRED PATTERNS  
[What TO do - specific examples]

## 🔧 Implementation
[How to implement - commands, code examples]

## 📊 Enforcement
[How it's enforced - automation, checks]

## 💡 Examples
[Before/after or good/bad examples]
```

## 🎯 Content Guidelines

### 1. **MANDATORY: Pre-Rule Conflict Analysis**
Before writing any new rule:
```markdown
## 🔍 CONFLICT ANALYSIS COMPLETED
- [ ] Checked ALL existing rules for conflicts
- [ ] Verified no contradictory requirements
- [ ] Ensured consistent file size limits
- [ ] Confirmed compatible testing requirements  
- [ ] Validated documentation standards align
- [ ] No overlapping enforcement mechanisms
```

### 2. **MANDATORY: Planning Requirements**
Before implementing or writing files:
```markdown
## 📋 IMPLEMENTATION PLANNING CHECKLIST
- [ ] File size limits verified (≤100 lines Edge functions, ≤80 lines shared modules)
- [ ] Modularity plan documented (clear separation of concerns)
- [ ] Dependencies mapped (no circular dependencies)
- [ ] Breaking down oversized components planned
- [ ] Shared module extraction strategy defined
```

### 3. **NO SHORTCUTS PRINCIPLE**
Every rule MUST enforce:
```markdown
## 🚫 ANTI-LAZY DEVELOPMENT RULES
- **NO SHORTCUTS**: Always implement proper solution, not quick fixes
- **NO LAZY PATTERNS**: Address root causes, never add workarounds
- **NO COPY-PASTE**: Create shared modules for common functionality
- **NO OVERSIZED FILES**: Plan modular architecture from start
- **NO CONFLICTING RULES**: Resolve conflicts, don't ignore them
```

### 4. **User Instructions as Law**
When user gives explicit instructions:
```markdown
## 🚨 CRITICAL RULE: No Keyword Shortcuts
**USER EXPLICITLY DEMANDS**: All message analysis MUST use LLM semantic understanding
```

### 5. **Specific Over General**
```markdown
# ❌ BAD: "Write good code"
# ✅ GOOD: "Edge Functions: ≤100 lines, Shared Modules: ≤80 lines"
```

### 6. **Enforceable Rules**
Every rule should be:
- **Measurable**: Can be checked programmatically
- **Specific**: Clear pass/fail criteria
- **Actionable**: Developer knows exactly what to do

### 7. **Examples Are Mandatory**
Always include:
```markdown
## Examples
❌ **BAD**: File with 150 lines
✅ **GOOD**: File split into 75-line modules
```

## ⚔️ MANDATORY: Conflict Detection & Resolution

### 1. **Rule Conflict Analysis Process**
Before creating/updating ANY rule, MUST run complete conflict check:

```bash
# Check each existing rule one-by-one for conflicts
# 1. Read deployment.mdc - note file size limits, quality checks
# 2. Read sentinel-patterns.mdc - note testing requirements (95%+ coverage)  
# 3. Read environment-automation.mdc - note env var management
# 4. Read schema.mdc - note migration requirements
# 5. Read personality-system.mdc - note response constraints
# 6. Read prompts.mdc - note versioning standards
# 7. Read supabase-deployment-testing.mdc - note testing protocols
```

### 2. **Known Conflicts That MUST Be Resolved**

#### Testing Coverage Standards
```markdown
❌ CONFLICT DETECTED:
- sentinel-patterns.mdc: "95%+ test coverage"  
- deployment.mdc: ">80% test coverage"

✅ RESOLUTION REQUIRED:
Choose ONE standard across ALL rules. Document in meta-rule.
```

#### File Size Enforcement  
```markdown
❌ CONFLICT RISK:
Rules themselves might exceed 100-line limits they enforce

✅ PREVENTION REQUIRED:
- Plan rule modularity BEFORE writing
- Split long rules into focused sub-rules
- Reference other rules instead of duplicating content
```

#### Documentation Requirements
```markdown
❌ CONFLICT DETECTED:
Multiple rules require different documentation updates

✅ RESOLUTION REQUIRED:
- Create single documentation standard
- Remove duplicate requirements
- Reference central documentation rule
```

### 3. **Conflict Resolution Protocol**
When conflicts found:

```markdown
## 🚨 CONFLICT RESOLUTION STEPS
1. **STOP**: Do not proceed until resolved
2. **IDENTIFY**: Document exact conflicting requirements  
3. **PRIORITIZE**: User demands > System integrity > Convenience
4. **UNIFY**: Choose ONE approach across ALL rules
5. **UPDATE**: Modify conflicting rules to align
6. **VALIDATE**: Re-check all rules for consistency
7. **DOCUMENT**: Record resolution in this meta-rule
```

### 4. **File Size & Modularity Planning Requirements**

#### Before Writing ANY Rule
```markdown
## 📏 SIZE & MODULARITY CHECKLIST
- [ ] Rule planned to stay under 250 lines total
- [ ] Complex rules broken into focused sub-rules
- [ ] References other rules instead of duplicating
- [ ] Implementation examples concise but complete
- [ ] No copy-paste from other rules
```

#### Before Writing ANY Code  
```markdown
## 🏗️ ARCHITECTURE PLANNING CHECKLIST
- [ ] File size limits checked (≤100 lines Edge functions, ≤80 lines shared)
- [ ] Modularity strategy documented
- [ ] Shared module extraction planned
- [ ] Dependencies mapped (no circular imports)
- [ ] Separation of concerns clearly defined
- [ ] Breaking down oversized components planned
```

### 5. **Anti-Conflict Enforcement**
```markdown
## 🛡️ AUTOMATIC CONFLICT PREVENTION
- Every new rule MUST include conflict analysis
- No rule can contradict existing rules without resolution
- File size limits apply to rules themselves
- Testing standards MUST be consistent across all rules
- Documentation requirements MUST be unified
- Environment management MUST follow single pattern
```

## 🚫 Common Mistakes to Avoid

### 1. **Vague Descriptions**
```yaml
# ❌ BAD
description: "Development guidelines"

# ✅ GOOD  
description: "Enforce TDD with 95%+ coverage, test-first development"
```

### 2. **Missing Enforcement**
```markdown
# ❌ BAD: Rule without enforcement
"Always write tests"

# ✅ GOOD: Rule with enforcement
"Tests required: Pre-commit hook blocks commits without tests"
```

### 3. **Overlapping Rules**
- Each rule should have a single, clear purpose
- Don't duplicate content across rules
- Reference other rules instead of repeating

### 4. **Outdated Examples**
- Use current project structure in examples
- Reference actual files/patterns from codebase
- Update when architecture changes

## 📐 Rule Categories

### 1. **Enforcement Rules** (alwaysApply: true)
- Quality gates that prevent problems
- Security and data protection
- Core development principles

### 2. **Workflow Rules** (alwaysApply: false)
- Deployment procedures
- Testing protocols
- Environment-specific guidelines

### 3. **Pattern Rules** (varies)
- Architecture patterns
- Code organization
- Naming conventions

## 🔍 Enhanced Quality Checklist for Rules

Before finalizing a cursor rule:

### **MANDATORY Pre-Checks (CANNOT SKIP)**
- [ ] **Conflict analysis completed**: All existing rules checked one-by-one
- [ ] **Testing standards aligned**: Consistent coverage requirements (95%+ or 80%+)
- [ ] **File size planning done**: Rule itself ≤250 lines, promotes ≤100/80 line limits
- [ ] **Documentation unified**: No conflicting documentation requirements
- [ ] **No lazy patterns**: Enforces proper solutions, not shortcuts
- [ ] **Architecture planning**: Clear modularity and separation of concerns

### **Standard Quality Checks**
- [ ] **Metadata complete**: description, globs, alwaysApply
- [ ] **Single purpose**: Rule does ONE thing well
- [ ] **Specific examples**: Good/bad patterns shown
- [ ] **Enforcement clear**: How violations are caught
- [ ] **Action-oriented**: Tells what to DO, not just what not to do
- [ ] **Current**: References current architecture/tools
- [ ] **Searchable**: Keywords in description for discovery
- [ ] **No duplication**: Doesn't repeat other rules

### **Anti-Conflict Validation**
- [ ] **Consistent with deployment.mdc**: File sizes, quality checks align
- [ ] **Consistent with sentinel-patterns.mdc**: Testing, TDD requirements align
- [ ] **Consistent with environment-automation.mdc**: Environment management align
- [ ] **No contradictory requirements**: All rules work together harmoniously

## 💡 Advanced Patterns

### 1. **Progressive Enhancement**
Start with simple rule, add complexity as needed:
```markdown
v1: "Files must be under 100 lines"
v2: "Files under 100 lines, specific limits by type"
v3: "File limits + automated refactoring suggestions"
```

### 2. **Rule Composition**
Reference other rules to build complex behaviors:
```markdown
This rule requires:
- code-quality-enforcement.mdc (file sizes)
- debugging.md (root cause analysis)
- llm-semantic-understanding.md (no shortcuts)
```

### 3. **Contextual Activation**
Use globs to activate rules intelligently:
```yaml
# Only for new features
globs: ["features/**/*", "!features/**/tests/**"]

# Only for critical paths  
globs: ["supabase/functions/*/index.ts", "scripts/deploy-*.sh"]
```

## 🚀 Rule Maintenance

### 1. **Regular Reviews**
- Review rules quarterly
- Update examples with current code
- Remove obsolete patterns
- Consolidate overlapping rules

### 2. **User Feedback Integration**
- Track which rules developers find helpful
- Note which rules get violated most
- Adjust enforcement based on effectiveness

### 3. **Evolution Strategy**
- Start with advisory (alwaysApply: false)
- Graduate to mandatory after validation
- Automate enforcement progressively

## 📝 Example: Well-Written Rule

```markdown
---
description: "Enforce LLM semantic understanding - no keyword matching, Judge/Eval pattern required"
globs: ["supabase/shared/ai-tools/**/*", "supabase/shared/tools/**/*"]
alwaysApply: true
---

# LLM Semantic Understanding - MANDATORY

## 🚨 CRITICAL RULE: No Keyword Shortcuts
**USER EXPLICITLY DEMANDS**: All analysis MUST use LLM reasoning

## ❌ PROHIBITED
```typescript
if (message.includes('goal')) { // FORBIDDEN
```

## ✅ REQUIRED
```typescript
const intent = await llm.analyze(semanticPrompt);
```

## 📊 Enforcement
- Code review: Reject any PR with keyword matching
- Testing: Semantic understanding tests required
- Monitoring: Log when LLM analysis bypassed

**USER QUOTE**: "I want semantic LLM understanding"
```

---

## 📋 FINAL IMPLEMENTATION CHECKLIST

Before committing ANY cursor rule changes:

### **Conflict Detection (MANDATORY)**
- [ ] Read ALL 7 existing rules individually for conflicts
- [ ] Documented any conflicts found and resolution plan
- [ ] Verified consistent testing standards across rules
- [ ] Ensured unified documentation requirements
- [ ] Confirmed no overlapping enforcement mechanisms

### **Planning & Architecture (MANDATORY)**
- [ ] File size limits planned and verified
- [ ] Modularity strategy documented
- [ ] No shortcuts or lazy patterns introduced
- [ ] Proper separation of concerns enforced
- [ ] Rule itself follows size/modularity guidelines

### **Quality Assurance (MANDATORY)**
- [ ] All mandatory pre-checks completed
- [ ] Standard quality checks passed
- [ ] Anti-conflict validation completed
- [ ] Rule promotes excellence, not workarounds

---

**Remember**: 
- **NO SHORTCUTS**: Always plan properly, resolve conflicts, enforce excellence
- **NO LAZY PATTERNS**: Address root causes, don't ignore conflicts  
- **NO CONFLICTING RULES**: Unity and consistency are non-negotiable
- Cursor rules should make it impossible to do the wrong thing while making the right thing easy
- Write rules that developers will thank you for, not rules they'll try to bypass 