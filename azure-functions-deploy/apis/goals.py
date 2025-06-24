import json
import logging
import uuid
from datetime import datetime
import azure.functions as func
from mem0_service import MemoryService

# Create blueprint for goals endpoints
goals_bp = func.Blueprint()

@goals_bp.function_name("create_goal")
@goals_bp.route(route="goals", methods=["POST"])
def create_goal(req: func.HttpRequest) -> func.HttpResponse:
    """Create a new goal for user."""
    
    try:
        input_json = req.get_json()
        
        required_fields = ['user_id', 'title', 'category', 'time_frame']
        if not all(field in input_json for field in required_fields):
            return func.HttpResponse(
                json.dumps({"error": "user_id, title, category, and time_frame are required"}),
                status_code=400,
                mimetype="application/json"
            )
        
        user_id = input_json['user_id']
        goal_id = str(uuid.uuid4())
        
        # Create goal data
        goal_data = {
            "goal_id": goal_id,
            "user_id": user_id,
            "title": input_json['title'],
            "description": input_json.get('description', ''),
            "category": input_json['category'],  # fitness, career, learning, personal
            "time_frame": input_json['time_frame'],  # daily, weekly, monthly
            "target_value": input_json.get('target_value'),
            "current_progress": 0,
            "status": "active",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Store in Mem0
        memory_service = MemoryService()
        memory_service.add_memory(
            message=f"New {goal_data['category']} goal: {goal_data['title']}. Target: {goal_data.get('target_value', 'completion')}. Time frame: {goal_data['time_frame']}.",
            user_id=user_id,
            metadata={
                "type": "goal",
                "goal_id": goal_id,
                "category": goal_data['category'],
                "status": "active",
                "data": goal_data
            }
        )
        
        logging.info(f"🎯 Created goal {goal_id} for user {user_id}")
        
        return func.HttpResponse(
            json.dumps({
                "goal_id": goal_id,
                "user_id": user_id,
                "status": "created",
                "goal": goal_data
            }),
            status_code=201,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"❌ Error creating goal: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": "Failed to create goal"}),
            status_code=500,
            mimetype="application/json"
        )

@goals_bp.function_name("get_user_goals")
@goals_bp.route(route="users/{user_id}/goals", methods=["GET"])
def get_user_goals(req: func.HttpRequest) -> func.HttpResponse:
    """Get all goals for a user."""
    
    try:
        user_id = req.route_params.get('user_id')
        status = req.params.get('status', 'active')  # active, completed, paused
        
        # Search goals in Mem0
        memory_service = MemoryService()
        memories = memory_service.search_memories(
            query=f"goals for user {user_id}",
            user_id=user_id
        )
        
        # Filter for goal memories
        goals = []
        for memory in memories:
            if (memory.get('metadata', {}).get('type') == 'goal' and 
                memory.get('metadata', {}).get('status') == status):
                goal_data = memory.get('metadata', {}).get('data', {})
                goals.append(goal_data)
        
        logging.info(f"🎯 Retrieved {len(goals)} {status} goals for user {user_id}")
        
        return func.HttpResponse(
            json.dumps({
                "user_id": user_id,
                "status": status,
                "count": len(goals),
                "goals": goals
            }),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"❌ Error getting user goals: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": "Failed to retrieve goals"}),
            status_code=500,
            mimetype="application/json"
        )

@goals_bp.function_name("update_goal_progress")
@goals_bp.route(route="goals/{goal_id}/progress", methods=["POST"])
def update_goal_progress(req: func.HttpRequest) -> func.HttpResponse:
    """Update progress on a specific goal."""
    
    try:
        goal_id = req.route_params.get('goal_id')
        input_json = req.get_json()
        
        if not input_json or 'user_id' not in input_json:
            return func.HttpResponse(
                json.dumps({"error": "user_id is required"}),
                status_code=400,
                mimetype="application/json"
            )
        
        user_id = input_json['user_id']
        progress_value = input_json.get('progress_value', 0)
        notes = input_json.get('notes', '')
        
        # Store progress update in Mem0
        memory_service = MemoryService()
        memory_service.add_memory(
            message=f"Goal progress update: {progress_value}. Notes: {notes}",
            user_id=user_id,
            metadata={
                "type": "goal_progress",
                "goal_id": goal_id,
                "progress_value": progress_value,
                "notes": notes,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        logging.info(f"🎯 Updated progress for goal {goal_id}: {progress_value}")
        
        return func.HttpResponse(
            json.dumps({
                "goal_id": goal_id,
                "user_id": user_id,
                "progress_value": progress_value,
                "status": "updated"
            }),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"❌ Error updating goal progress: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": "Failed to update goal progress"}),
            status_code=500,
            mimetype="application/json"
        ) 