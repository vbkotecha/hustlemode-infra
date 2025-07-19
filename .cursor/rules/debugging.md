---
description: "Debug and fix root causes - no workarounds, no band-aids, proper investigation"
globs: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"]
alwaysApply: true
---

# Debugging and Issue Resolution Rules

## Core Principle: Fix, Don't Band-Aid

When a user reports something "not working" or "didn't work":

### ❌ DON'T Do This
- Add fallback mechanisms immediately
- Work around the issue without understanding it
- Layer on complexity to mask the problem
- Assume the issue is unfixable

### ✅ DO This Instead
1. **DIAGNOSE FIRST**: What exactly is failing?
2. **CHECK LOGS**: Look for actual error messages
3. **VERIFY IMPORTS**: Ensure all dependencies are correct
4. **TEST COMPONENTS**: Isolate and test individual parts
5. **TRACE EXECUTION**: Follow the code path to find the break
6. **FIX ROOT CAUSE**: Address the actual problem
7. **VERIFY FIX**: Confirm the original issue is resolved

## Debugging Methodology

### Step 1: Gather Information
- Check function logs/console output
- Verify deployment succeeded
- Test individual components
- Look for import/syntax errors

### Step 2: Isolate the Problem
- Test the simplest case first
- Remove complexity to find the core issue
- Use console.log for debugging
- Check type definitions and interfaces

### Step 3: Fix the Root Cause
- Address the actual failing component
- Fix type issues, missing imports, logic errors
- Don't mask with try-catch unless handling expected errors
- Ensure the fix addresses the original problem

### Step 4: Verify the Solution
- Test the exact scenario that was failing
- Confirm no regressions were introduced
- Only then consider resilience improvements

## Examples

### Bad Response Pattern
```
User: "It's not working"
Assistant: "Let me add a fallback mechanism..."
```

### Good Response Pattern  
```
User: "It's not working"
Assistant: "Let me check the logs to see what's failing..."
[Diagnoses actual issue]
Assistant: "Found the problem - missing import. Let me fix it."
```

## When Fallbacks Are Appropriate

Fallbacks should only be added AFTER:
- Primary system is proven to work correctly
- Edge cases are identified and understood
- Graceful degradation is a design requirement
- The original functionality is completely working

Never use fallbacks to avoid debugging actual issues. 