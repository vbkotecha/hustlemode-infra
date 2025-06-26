# HustleMode.ai Goals & Check-ins Usage Guide

## 🎯 Overview

This guide shows how to use the **AI-native goals and check-ins system** with Mem0 storage and ultra-concise personality coaching.

## 📋 Architecture

```
📱 User → 🔄 Azure Functions → 🧠 Mem0 (Dynamic Data) → 🤖 AI Coach (8-12 words)
                                 ↓
📊 PostgreSQL (Static User Data)
```

## 🚀 Quick Start

### 1. User Registration Flow
```bash
# First, user phones are registered via WhatsApp or direct API
# PostgreSQL stores: user_id (UUID), phone_number, preferences
# Mem0 stores: All conversations, goals, check-ins, AI context
```

### 2. Create Your First Goal
```bash
curl -X POST "https://hustlemode-api.azurewebsites.net/api/goals?code=YOUR_FUNCTION_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Daily Morning Workout",
    "category": "fitness",
    "time_frame": "daily",
    "target_value": "45 minutes",
    "description": "Build consistency and energy"
  }'
```

**Response:**
```json
{
  "goal_id": "goal-uuid-456",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "created",
  "goal": {
    "goal_id": "goal-uuid-456",
    "title": "Daily Morning Workout",
    "category": "fitness",
    "status": "active",
    "created_at": "2024-01-15T08:00:00Z"
  }
}
```

### 3. AI-Powered Check-in
```bash
curl -X POST "https://hustlemode-api.azurewebsites.net/api/checkins/ai?code=YOUR_FUNCTION_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "Completed my workout this morning!",
    "personality": "taskmaster"
  }'
```

**Response:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "personality": "taskmaster",
  "response": "Boom! Consistency beats perfection. Tomorrow again! 💪",
  "context_used": 3,
  "success": true
}
```

## 🎭 Personality Examples

### Taskmaster (Tough Love)
```json
{
  "message": "I skipped gym today",
  "personality": "taskmaster"
}
// Response: "Excuses build weakness. Go now or quit!"
```

### Cheerleader (Positive Support)
```json
{
  "message": "I skipped gym today", 
  "personality": "cheerleader"
}
// Response: "Tomorrow's a fresh start! You've got this! 🌟"
```

## 📊 Goal Management

### Get User Goals
```bash
curl -X GET "https://hustlemode-api.azurewebsites.net/api/users/550e8400-e29b-41d4-a716-446655440000/goals?status=active&code=YOUR_FUNCTION_KEY"
```

### Update Goal Progress
```bash
curl -X POST "https://hustlemode-api.azurewebsites.net/api/goals/goal-uuid-456/progress?code=YOUR_FUNCTION_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "progress_value": 80,
    "notes": "Completed 4 out of 5 workouts this week"
  }'
```

## ✅ Check-in Management

### Structured Check-in
```bash
curl -X POST "https://hustlemode-api.azurewebsites.net/api/checkins?code=YOUR_FUNCTION_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "checkin_type": "daily",
    "goal_id": "goal-uuid-456",
    "mood": 8,
    "energy": 7,
    "progress_rating": 9,
    "wins": ["Completed workout", "Ate healthy breakfast"],
    "challenges": ["Woke up late"],
    "notes": "Feeling strong and motivated"
  }'
```

### Get Check-in History
```bash
curl -X GET "https://hustlemode-api.azurewebsites.net/api/users/550e8400-e29b-41d4-a716-446655440000/checkins?type=daily&days=7&code=YOUR_FUNCTION_KEY"
```

### AI Check-in Schedule Suggestions
```bash
curl -X GET "https://hustlemode-api.azurewebsites.net/api/users/550e8400-e29b-41d4-a716-446655440000/checkin-schedule?code=YOUR_FUNCTION_KEY"
```

## 📱 WhatsApp Integration

### Automatic Goal Creation via WhatsApp
```
User sends: "New fitness goal: gym 3x per week"
Bot responds: "Perfect! Gym 3x weekly locked in! 🎯"
```

### Daily Check-in via WhatsApp
```
User sends: "Daily check-in"
Bot responds: "Energy level 1-10? How'd you show up? 💪"

User sends: "Energy 8, crushed my workout"
Bot responds: "YES! That's the energy! Keep crushing! 🔥"
```

### Progress Updates via WhatsApp
```
User sends: "Workout progress update"
Bot responds: "Scale 1-10, how consistent were you? 📊"

User sends: "8 out of 10"
Bot responds: "Solid! What's blocking that perfect 10? 🎯"
```

## 🔄 User Journey Example

### Week 1: Goal Setting
```
Day 1: User creates fitness goal via WhatsApp
Day 2: AI suggests check-in schedule
Day 3: First AI check-in establishes baseline
```

### Week 2: Habit Building
```
Daily: Ultra-concise AI check-ins (8-12 words)
Weekly: Progress review and goal adjustment
AI learns user patterns and optimizes coaching
```

### Week 3: Momentum Building
```
AI references past wins from Mem0
Personalized coaching based on user history
Automatic encouragement for consistency streaks
```

## 🧠 AI Context & Memory

### How Mem0 Enhances Coaching
```
User says: "I'm tired today"

AI has context:
- User's energy patterns from past check-ins
- Recent goal progress
- Previous responses to similar situations
- Personality preference (taskmaster vs cheerleader)

Response: "Tired beats lazy. 10 minutes counts! 🏃‍♂️"
```

### Memory Categories in Mem0
- **Goals**: Structured goal data with progress
- **Check-ins**: Daily/weekly mood, energy, progress ratings
- **Conversations**: All AI coaching interactions
- **Patterns**: User behavior and response trends
- **Preferences**: Personality choice, optimal check-in times

## 🚀 Advanced Features

### Goal Categories
- **Fitness**: Workouts, nutrition, health metrics
- **Career**: Skills, networking, project completion
- **Learning**: Courses, reading, skill development
- **Personal**: Habits, relationships, self-care

### Check-in Types
- **Daily**: Quick mood, energy, progress check
- **Weekly**: Comprehensive review and planning
- **AI-Triggered**: Based on user patterns and needs

### AI Coaching Modes
- **Taskmaster**: Tough love, accountability, no excuses
- **Cheerleader**: Positive, encouraging, celebrating wins
- **Adaptive**: AI learns which personality works best when

## 🛠️ Integration with Existing Systems

### Database Schema
```sql
-- PostgreSQL (Static Data)
users: user_id (UUID), phone_number, created_at, preferences

-- Mem0 (Dynamic Data)
All goals, check-ins, conversations, and AI context
```

### WhatsApp Webhook Flow
```
WhatsApp Message → Azure Functions → User Lookup (PostgreSQL) → 
AI Processing (Mem0 context) → Ultra-concise Response → WhatsApp
```

## 📈 Analytics & Insights

### Available Metrics
- Goal completion rates by category
- Check-in consistency patterns
- Personality effectiveness (taskmaster vs cheerleader)
- Optimal check-in timing
- User engagement trends

### AI-Powered Insights
- Personalized coaching recommendations
- Optimal goal-setting suggestions
- Behavioral pattern recognition
- Predictive engagement modeling

## 🎯 Best Practices

### Goal Setting
- Be specific and measurable
- Set realistic timeframes
- Link to larger life objectives
- Regular progress reviews

### Check-ins
- Consistent timing
- Honest self-assessment
- Celebrate small wins
- Learn from setbacks

### AI Coaching
- Choose personality that motivates you
- Engage consistently for better AI context
- Provide feedback for AI learning
- Trust the process and build momentum

---

**Ready to start?** Begin with creating your first goal and let HustleMode.ai's AI coach guide you to consistent action and measurable results! 🚀 