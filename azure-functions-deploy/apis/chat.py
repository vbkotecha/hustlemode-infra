import json
import logging
import azure.functions as func
from mem0_service import MemoryService
from azure_openai_service import AzureOpenAIService
from personalities import get_personality
from datetime import datetime

# Create blueprint for universal chat endpoint
chat_bp = func.Blueprint()

# Available tools for function calling
AVAILABLE_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "create_goal",
            "description": "Create a new goal for the user when they express wanting to achieve something",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Goal title"},
                    "category": {"type": "string", "enum": ["fitness", "career", "learning", "personal"]},
                    "time_frame": {"type": "string", "enum": ["daily", "weekly", "monthly"]},
                    "target_value": {"type": "string", "description": "Specific target or measurement"}
                },
                "required": ["title", "category", "time_frame"]
            }
        }
    },
    {
        "type": "function", 
        "function": {
            "name": "daily_checkin",
            "description": "Conduct a check-in when user shares mood, energy, or progress updates",
            "parameters": {
                "type": "object",
                "properties": {
                    "mood": {"type": "integer", "description": "User's mood 1-10"},
                    "energy": {"type": "integer", "description": "User's energy 1-10"},
                    "progress_note": {"type": "string", "description": "What they accomplished or struggled with"}
                },
                "required": ["progress_note"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "schedule_reminder",
            "description": "Set a reminder or calendar event when user asks to be reminded of something",
            "parameters": {
                "type": "object", 
                "properties": {
                    "reminder_text": {"type": "string", "description": "What to remind them about"},
                    "when": {"type": "string", "description": "When to remind them"},
                    "reminder_type": {"type": "string", "enum": ["workout", "goal_check", "general"]}
                },
                "required": ["reminder_text", "when"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "progress_analysis", 
            "description": "Analyze user's progress patterns when they ask about their performance or trends",
            "parameters": {
                "type": "object",
                "properties": {
                    "time_period": {"type": "string", "enum": ["week", "month", "all_time"]},
                    "analysis_type": {"type": "string", "enum": ["goals", "mood", "consistency"]}
                },
                "required": ["time_period", "analysis_type"]
            }
        }
    }
]

@chat_bp.function_name("universal_chat")
@chat_bp.route(route="chat", methods=["POST"])
def universal_chat(req: func.HttpRequest) -> func.HttpResponse:
    """Universal chat endpoint with AI-driven tool selection."""
    
    try:
        input_json = req.get_json()
        
        required_fields = ['user_id', 'message']
        if not all(field in input_json for field in required_fields):
            return func.HttpResponse(
                json.dumps({"error": "user_id and message are required"}),
                status_code=400,
                mimetype="application/json"
            )
        
        user_id = input_json['user_id']
        message = input_json['message']
        personality_name = input_json.get('personality', 'taskmaster')
        platform = input_json.get('platform', 'whatsapp')
        passed_context = input_json.get('context', {})  # Context passed from WhatsApp integration
        
        # Map personality names (taskmaster -> goggins for compatibility)
        personality_map = {
            'taskmaster': 'goggins',
            'goggins': 'goggins', 
            'cheerleader': 'cheerleader'
        }
        actual_personality = personality_map.get(personality_name, 'goggins')
        
        # Get user context - use passed context if available, otherwise search Mem0
        memory_service = MemoryService()
        
        if passed_context:
            # Use context passed from WhatsApp integration (more reliable)
            conversation_history = passed_context.get('conversation_history', [])
            goal_summary = passed_context.get('goal_summary', '')
            hybrid_summary = passed_context.get('hybrid_summary', '')
            
            # Build context summary from passed data
            context_summary = f"Goals: {goal_summary}; Recent: {hybrid_summary}" if hybrid_summary else "User with history"
        else:
            # Fallback to Mem0 search for direct API calls
            user_context = memory_service.search_memories(
                query=f"conversation history name goals preferences for user {user_id}",
                user_id=user_id,
                limit=15
            )
            
            # Extract relevant context from Mem0 memories
            context_summary = "New user"
            if user_context:
                # Extract key information from memories
                recent_conversations = []
                user_info = []
                goals = []
                
                for memory in user_context[:10]:  # Use more context
                    memory_text = memory.get('memory', memory.get('text', ''))
                    if 'name' in memory_text.lower():
                        user_info.append(memory_text)
                    elif 'goal' in memory_text.lower():
                        goals.append(memory_text)
                    elif 'user:' in memory_text.lower() or 'coach:' in memory_text.lower():
                        recent_conversations.append(memory_text)
                
                # Build context summary
                context_parts = []
                if user_info:
                    context_parts.append(f"User info: {user_info[0]}")
                if goals:
                    context_parts.append(f"Goals: {'; '.join(goals[:2])}")
                if recent_conversations:
                    context_parts.append(f"Recent: {recent_conversations[0]}")
                
                context_summary = '; '.join(context_parts) if context_parts else "User with some history"
        
        # Get personality prompts
        from personalities import get_personality_prompts
        personality_prompts = get_personality_prompts()
        personality_prompt = personality_prompts.get(actual_personality, personality_prompts['goggins'])
        
        # Build system prompt with tools and personality
        system_prompt = f"""
{personality_prompt}

User Context: {context_summary}

You have access to tools for:
- Creating goals when users want to achieve something  
- Conducting check-ins when they share mood/progress
- Setting reminders when they ask to be reminded
- Analyzing progress when they ask about performance

ALWAYS:
1. Use tools when user intent matches tool purpose
2. Respond in your personality (8-12 words max)
3. Be encouraging but direct
4. Reference their context when relevant

Examples:
- User: "I want to get fit" → Use create_goal tool + "Gym 3x weekly? Let's lock it! 🎯"
- User: "Feeling tired today" → Use daily_checkin tool + "Energy 1-10? We'll push through! 💪"
- User: "Just saying hi" → No tools needed + "Ready to crush goals! What's up? 🚀"
"""

        # Get AI response with function calling
        ai_service = AzureOpenAIService()
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Add conversation history if available (from WhatsApp context)
        if passed_context and passed_context.get('conversation_history'):
            for msg in passed_context['conversation_history'][-5:]:  # Last 5 messages
                role = "user" if msg.get("message_type") == "incoming" else "assistant"
                content = msg.get("content", "")
                if content:  # Only add non-empty messages
                    messages.append({"role": role, "content": content})
        
        # Add current user message
        messages.append({"role": "user", "content": message})
        
        response = ai_service.get_completion_with_tools(
            messages=messages,
            tools=AVAILABLE_TOOLS,
            max_tokens=100  # Force concise responses
        )
        
        # Process function calls if AI decided to use tools
        tool_results = []
        if hasattr(response, 'tool_calls') and response.tool_calls:
            for tool_call in response.tool_calls:
                tool_result = execute_tool(tool_call, user_id, memory_service)
                tool_results.append(tool_result)
        
        # Get final AI response - if tools were used, generate personality response about the action
        if tool_results:
            # Generate a follow-up response acknowledging the tool actions
            tool_summary = ", ".join([f"{t.get('function_name', 'action')}" for t in tool_results])
            followup_prompt = f"""
{personality_prompt}

The user said: "{message}"
I just executed these tools: {tool_summary}

Respond in 8-12 words acknowledging the action taken in your personality style.

Examples:
- If goal created: "Goal locked in! Let's crush it! 🎯"  
- If check-in done: "Progress noted. Keep pushing forward! 💪"
- If reminder set: "Reminder scheduled. No excuses now! ⏰"
"""
            followup_messages = [
                {"role": "system", "content": followup_prompt},
                {"role": "user", "content": f"Acknowledge that tools were used: {tool_summary}"}
            ]
            
            followup_response = ai_service.get_completion(followup_messages, max_tokens=50)
            ai_response = followup_response
        else:
            # No tools used, use original response
            ai_response = response.content if hasattr(response, 'content') else str(response)
        
        # Store conversation in Mem0
        memory_service.add_memory(
            message=f"User: {message}. Coach: {ai_response}. Tools used: {len(tool_results)}",
            user_id=user_id,
            metadata={
                "type": "conversation",
                "personality": personality_name,
                "platform": platform,
                "tools_used": [t.get('function_name') for t in tool_results],
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        logging.info(f"🤖 Universal chat for {user_id}: {len(tool_results)} tools used")
        
        return func.HttpResponse(
            json.dumps({
                "user_id": user_id,
                "personality": personality_name,
                "response": ai_response,
                "tools_used": len(tool_results),
                "tool_results": tool_results,
                "platform": platform,
                "success": True
            }),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"❌ Error in universal chat: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": "Failed to process chat message"}),
            status_code=500,
            mimetype="application/json"
        )

def execute_tool(tool_call, user_id, memory_service):
    """Execute the tool function called by AI."""
    
    function_name = tool_call.function.name
    arguments = json.loads(tool_call.function.arguments)
    
    try:
        if function_name == "create_goal":
            return create_goal_tool(user_id, arguments, memory_service)
        elif function_name == "daily_checkin":
            return daily_checkin_tool(user_id, arguments, memory_service)
        elif function_name == "schedule_reminder":
            return schedule_reminder_tool(user_id, arguments, memory_service)
        elif function_name == "progress_analysis":
            return progress_analysis_tool(user_id, arguments, memory_service)
        else:
            return {"function_name": function_name, "status": "unknown_function"}
            
    except Exception as e:
        logging.error(f"❌ Error executing tool {function_name}: {str(e)}")
        return {"function_name": function_name, "status": "error", "error": str(e)}

def create_goal_tool(user_id, arguments, memory_service):
    """Tool: Create a new goal."""
    import uuid
    
    goal_id = str(uuid.uuid4())
    goal_data = {
        "goal_id": goal_id,
        "user_id": user_id,
        "title": arguments['title'],
        "category": arguments['category'],
        "time_frame": arguments['time_frame'],
        "target_value": arguments.get('target_value', ''),
        "status": "active",
        "created_at": datetime.utcnow().isoformat()
    }
    
    memory_service.add_memory(
        message=f"New {goal_data['category']} goal: {goal_data['title']}. Target: {goal_data.get('target_value', 'completion')}.",
        user_id=user_id,
        metadata={"type": "goal", "goal_id": goal_id, "data": goal_data}
    )
    
    return {"function_name": "create_goal", "status": "created", "goal_id": goal_id}

def daily_checkin_tool(user_id, arguments, memory_service):
    """Tool: Conduct daily check-in."""
    import uuid
    
    checkin_id = str(uuid.uuid4())
    checkin_data = {
        "checkin_id": checkin_id,
        "user_id": user_id,
        "mood": arguments.get('mood'),
        "energy": arguments.get('energy'), 
        "progress_note": arguments['progress_note'],
        "timestamp": datetime.utcnow().isoformat()
    }
    
    memory_service.add_memory(
        message=f"Check-in: {checkin_data['progress_note']}. Mood: {checkin_data.get('mood', 'N/A')}, Energy: {checkin_data.get('energy', 'N/A')}",
        user_id=user_id,
        metadata={"type": "checkin", "checkin_id": checkin_id, "data": checkin_data}
    )
    
    return {"function_name": "daily_checkin", "status": "recorded", "checkin_id": checkin_id}

def schedule_reminder_tool(user_id, arguments, memory_service):
    """Tool: Schedule a reminder."""
    import uuid
    
    reminder_id = str(uuid.uuid4())
    reminder_data = {
        "reminder_id": reminder_id,
        "user_id": user_id,
        "reminder_text": arguments['reminder_text'],
        "when": arguments['when'],
        "reminder_type": arguments.get('reminder_type', 'general'),
        "created_at": datetime.utcnow().isoformat()
    }
    
    memory_service.add_memory(
        message=f"Reminder set: {reminder_data['reminder_text']} at {reminder_data['when']}",
        user_id=user_id,
        metadata={"type": "reminder", "reminder_id": reminder_id, "data": reminder_data}
    )
    
    return {"function_name": "schedule_reminder", "status": "scheduled", "reminder_id": reminder_id}

def progress_analysis_tool(user_id, arguments, memory_service):
    """Tool: Analyze user progress patterns."""
    
    # Search for relevant memories
    memories = memory_service.search_memories(
        query=f"goals and progress for user {user_id} in {arguments['time_period']}",
        user_id=user_id
    )
    
    # Simple analysis (can be enhanced with AI)
    analysis = {
        "time_period": arguments['time_period'],
        "analysis_type": arguments['analysis_type'],
        "memory_count": len(memories),
        "insight": "Consistent progress detected" if len(memories) > 5 else "Need more data for patterns"
    }
    
    return {"function_name": "progress_analysis", "status": "analyzed", "analysis": analysis} 