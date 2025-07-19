---
description: "Goal management using LLM semantic understanding - Judge/Eval/Orchestrator pattern"
globs: ["supabase/shared/tools/**/*goal*.ts", "supabase/shared/ai-tools/**/*"]
alwaysApply: true
---

# Goal Management System Rules

## Core Principle: LLM-Based Semantic Understanding

The goal management system MUST use LLM evaluation for semantic understanding instead of manual pattern matching. This provides robust natural language processing across ALL goal domains.

## 🧠 Judge/Eval/Orchestrator Pattern

### Judge LLM
- **Purpose**: Determine which goal the user is referencing
- **Input**: User message + list of current goals
- **Output**: Goal ID or "no match" with confidence score
- **Example**: "amend my walking goal" → Judge identifies "walk 10000 steps daily"

### Eval LLM  
- **Purpose**: Assess implications, conflicts, and suggestions
- **Input**: Proposed changes + current goal state
- **Output**: Conflict analysis, recommendations, optimizations
- **Example**: "20k steps" → Eval suggests "Ambitious! Consider 15k first?"

### Orchestrator LLM
- **Purpose**: Coordinate overall workflow and responses
- **Input**: Judge + Eval results + user context
- **Output**: Final action plan and user communication
- **Example**: Execute update + provide encouraging feedback

## 🚫 Avoid Manual Pattern Matching

**DON'T:**
```typescript
// Manual regex scoring
if (goalText.includes(reference.toLowerCase())) {
  matchScore += reference.length * 3;
}
const activityWords = ['walk', 'run', 'exercise'];
```

**DO:**
```typescript
// LLM-based semantic evaluation
const judgePrompt = `
User message: "${userMessage}"
Available goals: ${goalList}
Which goal is the user referring to? Return goal ID.
`;
const match = await llm.evaluate(judgePrompt);
```

### ✅ Supported Goal Types (Examples)
- **Fitness**: "Walk 10,000 steps daily", "Run 30 minutes 3x weekly"
- **Learning**: "Read 30 minutes daily", "Practice piano 45 minutes", "Learn Spanish 20 minutes daily"
- **Financial**: "Save $500 monthly", "Budget $100 weekly for groceries"
- **Creative**: "Write 1000 words daily", "Draw 30 minutes daily", "Take 5 photos weekly"
- **Social**: "Call mom weekly", "Text friend daily", "Have 1 coffee meeting weekly"
- **Professional**: "Code 2 hours daily", "Review 10 PRs weekly", "Write 1 blog post monthly"
- **Health**: "Meditate 15 minutes daily", "Drink 8 glasses water daily", "Sleep 8 hours nightly"

## 📋 Implementation Guidelines

#### 1. Goal Reference Matching
- Use **Judge LLM** for semantic goal identification
- Provide full context: user message + all current goals
- Handle ambiguous references with clarifying questions
- Support natural language: "my exercise thing", "that reading goal"

#### 2. Parameter Extraction
- Use **LLM understanding** for value extraction
- Support any format: "20,000 steps", "$500", "30 minutes", "1000 words"
- Let LLM interpret units and intentions contextually
- Handle conversational updates: "double it", "a bit more"

#### 3. Conflict Detection & Resolution
- Use **Eval LLM** for intelligent conflict analysis
- Consider time, resources, motivation, and lifestyle factors
- Provide conversational suggestions, not rigid blocking
- Example: "These goals might conflict - prioritize which one?"

#### 4. Natural Language Processing
- Support any phrasing: "adjust my goal", "I want to change that thing"
- Use LLM context understanding vs keyword matching
- Handle pronouns, references, and implied meanings
- Work across all languages and communication styles

### 🧪 Testing Approach

Test with diverse scenarios using LLM evaluation:
- Ambiguous references ("change that goal")
- Multiple similar goals ("exercise" when user has gym AND running goals)
- Cross-domain conflicts (time/budget/energy)
- Natural conversation flows

### 🚀 LLM Integration

#### Judge Implementation
```typescript
async function findGoalByLLM(userMessage: string, goals: Goal[]): Promise<Goal | null> {
  const prompt = `
  User message: "${userMessage}"
  Available goals:
  ${goals.map((g, i) => `${i+1}. ${g.title} (${g.description || 'no description'})`).join('\n')}
  
  Which goal is the user referring to? Return only the number (1-${goals.length}) or "none".
  `;
  
  const result = await groqClient.evaluate(prompt);
  // Parse and return matched goal
}
```

#### Eval Implementation  
```typescript
async function evaluateGoalChange(goal: Goal, changes: any): Promise<EvalResult> {
  const prompt = `
  Current goal: "${goal.title}"
  Proposed changes: ${JSON.stringify(changes)}
  User's other goals: ${otherGoals}
  
  Analyze: 1) Conflicts 2) Feasibility 3) Suggestions
  Respond in JSON format.
  `;
  
  return await groqClient.evaluate(prompt);
}
```

### 🎯 Future Extensions

When adding new features:
1. Ask: "Can an LLM understand this naturally?"
2. Use semantic evaluation over pattern matching
3. Design prompts for robust natural language understanding
4. Test with conversational, not programmatic inputs 