# HustleMode.ai Personality System

## 🎭 2-Personality MVP Architecture

This directory contains the modular personality system for HustleMode.ai's ultra-concise AI coaching platform.

### Current Structure
```
personalities/
├── __init__.py          # Module interface and exports
├── taskmaster.py        # Tough love accountability coach (default)
└── cheerleader.py       # Enthusiastic positive support
```

## 🎯 Core Personalities

### 💪 Taskmaster (Default)
- **Style**: Military discipline, no excuses, tough love
- **Response Length**: 8-12 words maximum
- **Example**: "Stop whining. Go work out. Now! 🏋️‍♂️" (6 words)

### 🎉 Cheerleader  
- **Style**: Enthusiastic celebration, positive reinforcement
- **Response Length**: 8-12 words maximum
- **Example**: "YES! You're crushing it! 🎉 Keep going!" (7 words)

## 📱 Mobile Optimization

### Ultra-Concise Requirements
- **Maximum**: 12 words per response (strictly enforced)
- **Target**: 8-10 words for optimal mobile experience
- **Mobile-First**: Responses fit comfortably in single text bubble
- **Action-Oriented**: Every response inspires immediate action

## 🔧 Module Interface

### Usage in Code
```python
from personalities import taskmaster, cheerleader

# Get personality prompt
prompt = taskmaster.PERSONALITY_PROMPT

# Get fallback response
fallback = cheerleader.FALLBACK
```

### Personality Selection
```python
from personalities import get_personality

# Get personality by name
personality = get_personality("taskmaster")  # or "cheerleader"
```

## 🎯 Adding New Personalities (Future)

**⚠️ MVP Constraint**: Only add personalities with explicit user demand validation.

### Requirements for New Personalities
1. **User Demand**: Clear evidence users want additional personality
2. **Distinct Value**: New personality serves unmet coaching need  
3. **Word Count Compliance**: All responses 8-12 words maximum
4. **Mobile Optimization**: Perfect for text messaging platforms
5. **Fallback Ready**: Emergency responses when AI unavailable

### Implementation Pattern
```python
# personalities/new_personality.py
PERSONALITY_PROMPT = """You are a [personality type] coach...
CRITICAL: Respond in 8-12 words maximum for mobile messaging."""

FALLBACK = "Your fallback message here! 🌟"  # 5 words

KEYWORDS = ["keyword1", "keyword2", "keyword3"]

def get_personality_config():
    return {
        "prompt": PERSONALITY_PROMPT,
        "fallback": FALLBACK,
        "keywords": KEYWORDS,
        "style": "personality_style",
        "max_words": 12
    }
```

## 🧪 Testing Guidelines

### Personality Testing
- Test same input with both personalities
- Validate word count limits (8-12 words)
- Verify character consistency
- Test fallback responses
- Ensure mobile readability

### Integration Testing
```python
# Test personality switching
from personalities import taskmaster, cheerleader

print(taskmaster.FALLBACK)  # Should be ≤12 words
print(cheerleader.FALLBACK)  # Should be ≤12 words
```

## 🚫 Anti-Patterns

### Never Do These
- ❌ Add personalities without user demand validation
- ❌ Exceed 12-word limit under any circumstances
- ❌ Mix personality traits in single response
- ❌ Create platform-specific responses
- ❌ Use academic or formal language

### Prohibited Response Patterns
- ❌ Long explanations or paragraphs
- ❌ Multiple concepts in single response
- ❌ Responses requiring follow-up questions
- ❌ Generic motivational quotes

## 🎯 Success Metrics

### Personality Effectiveness
- **Response Relevance**: How well personality matches user need
- **Action Inspiration**: Does response motivate immediate action
- **Character Consistency**: Personality traits maintained
- **Word Efficiency**: Maximum impact in minimal words
- **User Preference**: Which personality users choose most

---
**Core Principle**: Two focused personalities delivering maximum coaching impact through ultra-concise, mobile-optimized responses 