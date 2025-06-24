import json
import logging
import uuid
from datetime import datetime, timedelta
import azure.functions as func
from mem0_service import MemoryService
from personalities import get_personality

# Create blueprint for check-ins endpoints
checkins_bp = func.Blueprint()

@checkins_bp.function_name("create_checkin")
@checkins_bp.route(route="checkins", methods=["POST"])
def create_checkin(req: func.HttpRequest) -> func.HttpResponse:
    """Create a daily/weekly check-in for user."""
    
    try:
        input_json = req.get_json()
        
        required_fields = ['user_id', 'checkin_type']
        if not all(field in input_json for field in required_fields):
            return func.HttpResponse(
                json.dumps({"error": "user_id and checkin_type are required"}),
                status_code=400,
                mimetype="application/json"
            )
        
        user_id = input_json['user_id']
        checkin_id = str(uuid.uuid4())
        checkin_type = input_json['checkin_type']  # daily, weekly
        
        # Check-in data
        checkin_data = {
            "checkin_id": checkin_id,
            "user_id": user_id,
            "checkin_type": checkin_type,
            "goal_id": input_json.get('goal_id'),
            "mood": input_json.get('mood'),  # 1-10 scale
            "energy": input_json.get('energy'),  # 1-10 scale
            "progress_rating": input_json.get('progress_rating'),  # 1-10 scale
            "challenges": input_json.get('challenges', []),
            "wins": input_json.get('wins', []),
            "notes": input_json.get('notes', ''),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Store in Mem0
        memory_service = MemoryService()
        memory_service.add_memory(
            message=f"{checkin_type.title()} check-in: Mood {checkin_data.get('mood', 'N/A')}/10, Energy {checkin_data.get('energy', 'N/A')}/10, Progress {checkin_data.get('progress_rating', 'N/A')}/10. Notes: {checkin_data.get('notes', 'None')}",
            user_id=user_id,
            metadata={
                "type": "checkin",
                "checkin_id": checkin_id,
                "checkin_type": checkin_type,
                "goal_id": checkin_data.get('goal_id'),
                "data": checkin_data
            }
        )
        
        logging.info(f"✅ Created {checkin_type} check-in {checkin_id} for user {user_id}")
        
        return func.HttpResponse(
            json.dumps({
                "checkin_id": checkin_id,
                "user_id": user_id,
                "checkin_type": checkin_type,
                "status": "created",
                "checkin": checkin_data
            }),
            status_code=201,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"❌ Error creating check-in: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": "Failed to create check-in"}),
            status_code=500,
            mimetype="application/json"
        )

@checkins_bp.function_name("get_user_checkins")
@checkins_bp.route(route="users/{user_id}/checkins", methods=["GET"])
def get_user_checkins(req: func.HttpRequest) -> func.HttpResponse:
    """Get check-ins for a user with optional filtering."""
    
    try:
        user_id = req.route_params.get('user_id')
        checkin_type = req.params.get('type')  # daily, weekly
        days = int(req.params.get('days', 30))  # Last N days
        
        # Search check-ins in Mem0
        memory_service = MemoryService()
        memories = memory_service.search_memories(
            query=f"check-ins for user {user_id}",
            user_id=user_id
        )
        
        # Filter and sort check-ins
        checkins = []
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        for memory in memories:
            metadata = memory.get('metadata', {})
            if metadata.get('type') == 'checkin':
                checkin_data = metadata.get('data', {})
                checkin_timestamp = datetime.fromisoformat(checkin_data.get('timestamp', ''))
                
                # Apply filters
                if checkin_timestamp >= cutoff_date:
                    if not checkin_type or checkin_data.get('checkin_type') == checkin_type:
                        checkins.append(checkin_data)
        
        # Sort by timestamp (newest first)
        checkins.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        
        logging.info(f"✅ Retrieved {len(checkins)} check-ins for user {user_id}")
        
        return func.HttpResponse(
            json.dumps({
                "user_id": user_id,
                "checkin_type": checkin_type,
                "days": days,
                "count": len(checkins),
                "checkins": checkins
            }),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"❌ Error getting user check-ins: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": "Failed to retrieve check-ins"}),
            status_code=500,
            mimetype="application/json"
        )

@checkins_bp.function_name("checkin_with_ai")
@checkins_bp.route(route="checkins/ai", methods=["POST"])
def checkin_with_ai(req: func.HttpRequest) -> func.HttpResponse:
    """AI-powered check-in that asks questions and provides coaching."""
    
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
        
        # Get personality for ultra-concise response
        personality = get_personality(personality_name)
        
        # Get recent context from Mem0
        memory_service = MemoryService()
        recent_memories = memory_service.search_memories(
            query=f"goals and progress for user {user_id}",
            user_id=user_id
        )
        
        # Import AI service for response generation
        from azure_openai_service import AzureOpenAIService
        ai_service = AzureOpenAIService()
        
        # Create context-aware prompt for check-in
        context_info = ""
        if recent_memories:
            context_info = f"Recent context: {recent_memories[:3]}"  # Last 3 memories
        
        checkin_prompt = f"""
You are a {personality_name} coach doing a check-in. 
User context: {context_info}
User message: {message}

Respond in 8-12 words maximum. Be encouraging but direct.
Ask about progress, mood, or next action.
"""
        
        # Get AI response
        ai_response = ai_service.get_completion(
            messages=[{"role": "user", "content": checkin_prompt}],
            max_tokens=50  # Force concise response
        )
        
        # Store the check-in interaction
        memory_service.add_memory(
            message=f"Check-in conversation: User said '{message}', Coach responded '{ai_response}'",
            user_id=user_id,
            metadata={
                "type": "checkin_conversation",
                "personality": personality_name,
                "user_message": message,
                "ai_response": ai_response,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        logging.info(f"✅ AI check-in for user {user_id} with {personality_name}")
        
        return func.HttpResponse(
            json.dumps({
                "user_id": user_id,
                "personality": personality_name,
                "response": ai_response,
                "context_used": len(recent_memories),
                "success": True
            }),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"❌ Error in AI check-in: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": "Failed to process AI check-in"}),
            status_code=500,
            mimetype="application/json"
        )

@checkins_bp.function_name("suggest_checkin_time")
@checkins_bp.route(route="users/{user_id}/checkin-schedule", methods=["GET"])
def suggest_checkin_time(req: func.HttpRequest) -> func.HttpResponse:
    """Suggest optimal check-in time based on user patterns."""
    
    try:
        user_id = req.route_params.get('user_id')
        
        # Get user's check-in history from Mem0
        memory_service = MemoryService()
        checkin_memories = memory_service.search_memories(
            query=f"check-in history patterns for user {user_id}",
            user_id=user_id
        )
        
        # Analyze patterns (simplified for MVP)
        suggestions = {
            "recommended_time": "08:00",  # Morning default
            "frequency": "daily",
            "reason": "Morning check-ins show higher completion rates",
            "next_checkin": (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d %H:%M")
        }
        
        logging.info(f"✅ Generated check-in schedule for user {user_id}")
        
        return func.HttpResponse(
            json.dumps({
                "user_id": user_id,
                "suggestions": suggestions,
                "based_on_checkins": len(checkin_memories)
            }),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"❌ Error suggesting check-in time: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": "Failed to suggest check-in time"}),
            status_code=500,
            mimetype="application/json"
        ) 