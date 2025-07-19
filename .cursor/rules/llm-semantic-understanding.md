---
description: "MANDATORY: All message analysis MUST use LLM semantic understanding - NO keyword matching"
globs: ["supabase/shared/ai-tools/**/*", "supabase/shared/tools/**/*", "supabase/functions/**/*"]
alwaysApply: true
---

# LLM Semantic Understanding - MANDATORY RULE

## 🚨 CRITICAL RULE: No Keyword Shortcuts

**USER EXPLICITLY DEMANDS**: All message analysis MUST use LLM semantic understanding through Judge/Eval/Orchestrator pattern. **NEVER EVER** use keyword matching, word checking, `includes()`, `toLowerCase()`, or any shortcuts.

## ❌ PROHIBITED PATTERNS

**NEVER DO THESE:**
```typescript
// ❌ FORBIDDEN - Keyword matching
const goalWords = ['goal', 'goals'];
const actionWords = ['update', 'change', 'modify'];
const hasGoalWord = goalWords.some(word => lower.includes(word));

// ❌ FORBIDDEN - Simple string checking  
if (message.toLowerCase().includes('update')) {

// ❌ FORBIDDEN - Pattern matching
const isUpdate = lower.includes('update') || lower.includes('change');

// ❌ FORBIDDEN - Regex shortcuts
/goal|goals/i.test(message)
```

## ✅ REQUIRED APPROACH

**ALWAYS USE LLM SEMANTIC UNDERSTANDING:**
```typescript
// ✅ CORRECT - LLM semantic analysis
const analysisPrompt = `
Analyze this user message for intent:
Message: "${userMessage}"
Determine: Does user want to manage goals? (YES/NO)
Reason using semantic understanding, not keywords.
`;
const intent = await llm.analyze(analysisPrompt);
```

## 🧠 Judge/Eval/Orchestrator Pattern

**MANDATORY WORKFLOW:**
1. **Judge LLM**: "What is the user trying to do?" (semantic understanding)
2. **Eval LLM**: "What are the implications?" (coaching assessment)  
3. **Orchestrator LLM**: "How should we respond?" (coordinate execution)

**NO EXCEPTIONS**: Every message analysis, goal detection, intent recognition MUST go through LLM reasoning, not pattern matching.

## 🎯 Goal Management Requirements

- **Goal Detection**: Use LLM to understand "Can you increase steps to 15,000" semantically
- **Goal Matching**: Use LLM to identify which goal user references  
- **Parameter Extraction**: Use LLM to extract values and units from natural language
- **Intent Recognition**: Use LLM to distinguish updates vs questions vs commands

## ⚖️ Enforcement

- **Code Review**: Reject any PR with keyword matching in goal/intent analysis
- **Testing**: All goal operations must pass semantic understanding tests
- **Monitoring**: Log when LLM analysis is bypassed (should be NEVER)

**USER QUOTE**: "I don't want word checking etc. I want semantic LLM like judge eval orchestrator model... why is it checking for goal words and action words instead and not checking for semantic LLM understanding?"

This rule is NON-NEGOTIABLE. Any reversion to keyword matching violates explicit user requirements. 