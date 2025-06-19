import json
import logging
import azure.functions as func
from constants import *
from assistant_utils import get_user_context

# Create blueprint for user management endpoints
user_management_bp = func.Blueprint()

@user_management_bp.function_name("get_user_conversations")
@user_management_bp.route(route="users/{phone}/conversations", methods=["GET"])
def get_user_conversations(req: func.HttpRequest) -> func.HttpResponse:
    """Get user's conversation history across all personalities."""
    
    try:
        phone_number = req.route_params.get("phone")
        
        if not phone_number:
            return func.HttpResponse(
                json.dumps({"error": "Phone number is required"}),
                status_code=400,
                mimetype="application/json"
            )
        
        # Get user context (in production, this would query database)
        user_context = get_user_context(phone_number)
        
        return func.HttpResponse(
            json.dumps({
                "phone": phone_number,
                "current_personality": user_context.get("current_personality"),
                "conversation_history": user_context.get("conversation_history", []),
                "total_messages": len(user_context.get("conversation_history", []))
            }),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"❌ Error getting conversations: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": "Failed to retrieve conversations"}),
            status_code=500,
            mimetype="application/json"
        )

@user_management_bp.function_name("set_user_preferences")
@user_management_bp.route(route="users/{phone}/preferences", methods=["PUT"])
def set_user_preferences(req: func.HttpRequest) -> func.HttpResponse:
    """Set user's default personality and preferences."""
    
    try:
        phone_number = req.route_params.get("phone")
        data = req.get_json()
        
        if not phone_number:
            return func.HttpResponse(
                json.dumps({"error": "Phone number is required"}),
                status_code=400,
                mimetype="application/json"
            )
        
        if not data:
            return func.HttpResponse(
                json.dumps({"error": "Preferences data required"}),
                status_code=400,
                mimetype="application/json"
            )
        
        default_personality = data.get("default_personality", DEFAULT_PERSONALITY)
        
        # Validate personality type
        if default_personality not in PERSONALITY_NAMES:
            return func.HttpResponse(
                json.dumps({"error": f"Invalid personality. Choose from: {list(PERSONALITY_NAMES.keys())}"}),
                status_code=400,
                mimetype="application/json"
            )
        
        # Save preferences (in production, this would update database)
        logging.info(f"📝 Updated preferences for {phone_number}: {default_personality}")
        
        return func.HttpResponse(
            json.dumps({
                "phone": phone_number,
                "default_personality": default_personality,
                "updated": True
            }),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"❌ Error setting preferences: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": "Failed to set preferences"}),
            status_code=500,
            mimetype="application/json"
        ) 