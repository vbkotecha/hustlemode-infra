# HustleMode.ai MVP Specification

## 🎯 **MVP Overview**

Transform the current static Goggins bot into an intelligent, personalized accountability system that:
- Tracks user goals with specific targets and deadlines
- Provides automated check-ins based on user preferences
- Delivers AI-powered responses using Azure OpenAI + Mem0
- Maintains conversation memory and context
- Tracks progress over time with analytics

---

## 🏗️ **Architecture Integration**

### **Current State** ✅
- Static Goggins responses
- Azure Functions Premium infrastructure  
- WhatsApp Business API integration
- Application Insights logging

### **Target State** 🎯
- **Azure OpenAI**: Dynamic, contextual responses
- **Mem0**: Conversation memory and user context
- **PostgreSQL**: Goal tracking, check-ins, progress data
- **Automated Workflows**: Scheduled check-ins and reminders

---

## 🚀 **MVP Features Breakdown**

### **1. Goal Setting & Management**

#### User Experience Flow:
```
User: "I want to lose 20 pounds by December 31st"

Bot Response:
🔥 GOAL SETTING TIME - NO WEAK TARGETS ALLOWED!

Let's break this down:
✅ Target: 20 pounds weight loss  
✅ Deadline: December 31st
✅ Measurable: Yes

Now tell me:
1. What's your current weight?
2. Why is this important to YOU?
3. What's your biggest obstacle?
4. How often can you commit to checking in?

WHO'S GONNA CARRY THE BOATS? 💪
```

#### Database Implementation:
```sql
INSERT INTO goals (
    user_id, title, description, category, 
    target_value, target_unit, current_value,
    target_date, why_important, obstacles
) VALUES (
    user_uuid, 'Lose 20 pounds', 'Weight loss goal',
    'fitness', 20, 'lbs', 0, '2024-12-31',
    'User reason', '["time", "motivation"]'
);
```

#### Features:
- **SMART Goal Creation**: Specific, Measurable, Achievable, Relevant, Time-bound
- **Category Classification**: fitness, career, learning, personal, health, financial
- **Progress Tracking**: Current vs. target values
- **Obstacle Identification**: Common challenges and solutions
- **Priority Levels**: critical, high, medium, low

### **2. Automated Check-ins**

#### User Preference Setup:
```
User: "Set up daily check-ins at 8 AM"

Database:
INSERT INTO user_preferences (
    user_id, check_in_frequency, check_in_time,
    goggins_intensity, reminder_enabled
) VALUES (
    user_uuid, 'daily', '08:00:00', 'high', true
);
```

#### Check-in Types:
- **Daily**: Progress updates, motivation level, energy assessment
- **Weekly**: Comprehensive review, strategy adjustments
- **Milestone**: When targets are reached or deadlines approach
- **Emergency**: When user requests help or reports setbacks

#### Automated Scheduling:
```sql
-- Function automatically creates next check-in
CREATE TRIGGER schedule_next_checkin_trigger
    AFTER UPDATE ON check_ins
    FOR EACH ROW
    WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
    EXECUTE FUNCTION schedule_next_checkin();
```

### **3. AI-Powered Response System**

#### Azure OpenAI Integration:
```python
# Dynamic response generation
async def generate_response(user_context, message, intent):
    # Build context-aware system prompt
    system_prompt = build_dynamic_prompt(
        user_goals=user_context['goals'],
        recent_progress=user_context['progress'],
        conversation_history=user_context['history'],
        goggins_intensity=user_context['intensity']
    )
    
    # Generate response
    response = await azure_openai.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message}
        ],
        temperature=0.8
    )
    
    return response.choices[0].message.content
```

#### Response Personalization:
- **Intensity Levels**: low, medium, high, brutal
- **Goal Context**: References specific user goals and progress
- **Historical Awareness**: Remembers past conversations and commitments
- **Progress-Based**: Adjusts based on user's current performance

### **4. Conversation Memory (Mem0)**

#### Memory Storage:
```python
# Add conversation to memory
memory_id = await mem0_service.add_conversation(
    user_id=user_id,
    message=user_message,
    context={
        "intent": "goal_setting",
        "goal_id": goal_uuid,
        "sentiment": "motivated",
        "timestamp": datetime.now()
    }
)

# Store memory reference in database
INSERT INTO conversation_history (
    user_id, content, intent, mem0_memory_id
) VALUES (
    user_uuid, message_text, intent, memory_id
);
```

#### Context Retrieval:
```python
# Get relevant context for response
user_context = await mem0_service.get_user_context(
    user_id=user_id,
    query="goal progress motivation"
)

# Include in prompt
context_summary = user_context['context_summary']
recent_patterns = user_context['key_patterns']
```

### **5. Progress Tracking & Analytics**

#### Progress Data Collection:
```sql
-- Automatic progress tracking
CREATE TRIGGER update_goal_progress_trigger
    AFTER INSERT ON check_in_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_progress_from_checkin();
```

#### Analytics Queries:
```sql
-- Weekly progress summary
SELECT 
    g.title,
    g.target_value,
    g.current_value,
    (g.current_value / g.target_value * 100) as completion_percentage,
    COUNT(cir.id) as check_ins_completed
FROM goals g
LEFT JOIN check_in_responses cir ON g.id = cir.goal_id
WHERE g.user_id = $user_id 
AND cir.created_at >= NOW() - INTERVAL '7 days'
GROUP BY g.id;
```

---

## 🔄 **Complete User Journey Example**

### **Day 1: Goal Setting**
```
User: "I want to run a marathon"

Bot (AI): 🔥 MARATHON? Now we're talking REAL goals!

But let's get SPECIFIC:
- Which marathon? When?
- Current running distance?
- How many days per week can you train?
- What's gonna stop you when it gets hard?

No vague dreams - we need a BATTLE PLAN! 💪

[System creates goal record, sets up training plan, schedules first check-in]
```

### **Day 2: First Check-in**
```
Automated Check-in at 8 AM:
"Morning warrior! Yesterday you committed to marathon training.

What did you DO about it?
- Did you run?
- How far?
- Energy level 1-10?
- What's your excuse if you didn't?

ACCOUNTABILITY TIME! 🔥"

User: "Ran 3 miles, felt good, energy was 8/10"

Bot (AI): "3 MILES! That's what I'm talking about!

[Mem0 remembers: positive start, high energy]
[Database: progress_value=3, energy_level=8]

Keep that momentum. Tomorrow we push for 3.5.
Your body will quit before your mind - remember that.

STAY HARD! ⚡"
```

### **Week 4: Progress Review**
```
Weekly Review Check-in:
"4 weeks in. Time for BRUTAL honesty.

Your goal: Marathon training
Commitment: 4 runs/week  
Reality check: You completed 12/16 runs (75%)

[AI analyzes: consistent but room for improvement]
[Mem0 context: user struggles with motivation on rainy days]

Here's the truth: 75% won't get you to 26.2 miles.
Weather excuses? WEAK.

Next week: 4/4 runs. No exceptions.
Rain gear. Treadmill. Find a way.

WHO'S GONNA CARRY THE BOATS? 💪"
```

### **Month 3: Setback Recovery**
```
User: "Injured my knee, can't run for 2 weeks"

Bot (AI): ⚡ SETBACK DETECTED!

[Mem0 retrieves: user's commitment history, previous challenges overcome]

Listen up - this is where CHAMPIONS are made.

Injury? That's just your body telling you to get CREATIVE:
- Swimming for cardio
- Upper body strength
- Core work
- Mental training

2 weeks is NOTHING in the grand scheme. Use this time to come back STRONGER.

Your marathon dream doesn't die because of a knee.
It dies when YOU quit.

What's your comeback plan? 🔥
```

---

## 📊 **Implementation Priority**

### **Phase 1: Core Infrastructure** (Week 1-2)
1. ✅ Database schema deployment (init.sql)
2. ✅ Azure OpenAI service integration  
3. ✅ Basic goal creation and storage
4. ✅ Simple check-in workflow

### **Phase 2: AI Integration** (Week 3-4)
1. ✅ Dynamic response generation
2. ✅ Intent detection and routing
3. ✅ Context-aware prompts
4. ✅ Fallback response system

### **Phase 3: Memory & Intelligence** (Week 5-6)
1. ✅ Mem0 integration
2. ✅ Conversation history storage
3. ✅ User context retrieval
4. ✅ Personalized responses

### **Phase 4: Automation** (Week 7-8)
1. ✅ Scheduled check-ins
2. ✅ Progress tracking automation
3. ✅ Analytics and reporting
4. ✅ User preference management

---

## 🔧 **Environment Variables Needed**

```env
# Azure OpenAI
AZURE_OPENAI_API_KEY=your_api_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
AZURE_OPENAI_API_VERSION=2024-02-01

# Mem0 
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_API_KEY=your_qdrant_key

# PostgreSQL
POSTGRES_CONNECTION_STRING=postgresql://user:pass@host:port/db

# Existing WhatsApp
WHATSAPP_TOKEN=your_current_token
WHATSAPP_PHONE_NUMBER_ID=682917338218717
WHATSAPP_VERIFY_TOKEN=fa22d4e7-cba4-48cf-9b36-af6190bf9c67
WHATSAPP_PHONE_NUMBER=15556583575
```

---

## 🎯 **Success Metrics**

### **User Engagement**
- Daily active users responding to check-ins
- Goal completion rates  
- Message response rates
- User retention (7-day, 30-day)

### **AI Performance**
- Response relevance ratings
- Intent detection accuracy
- Context utilization effectiveness
- Fallback response frequency

### **Goal Achievement**
- Goals completed vs. created
- Average time to goal completion
- Progress consistency rates
- User satisfaction scores

---

## 💰 **Cost Estimation**

### **Monthly Operational Costs**
- **Azure Functions Premium**: $150-300
- **Azure OpenAI**: $50-200 (depending on usage)
- **PostgreSQL Flexible Server**: $50-150
- **Mem0/Qdrant**: $30-100
- **WhatsApp Business API**: Free (1000 conversations/month)

**Total: $280-750/month** for production-ready MVP

---

## 🚀 **Next Steps**

1. **Deploy Database Schema**: Run the updated init.sql
2. **Set up Azure OpenAI**: Create resource and get API keys
3. **Integrate AI Service**: Replace static responses with dynamic ones
4. **Add Mem0**: Set up conversation memory
5. **Test Complete Flow**: Goal setting → Check-ins → Progress tracking
6. **Monitor & Optimize**: Use Application Insights for performance tuning

**Ready to build the ultimate accountability system? STAY HARD! 💪🔥** 