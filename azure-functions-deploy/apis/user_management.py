import json
import logging
import azure.functions as func
from constants import *
from assistant_utils import get_user_context

# Create blueprint for user management endpoints
user_management_bp = func.Blueprint()

@user_management_bp.function_name("test_database")
@user_management_bp.route(route="test/database", methods=["GET"])
def test_database(req: func.HttpRequest) -> func.HttpResponse:
    """Test database connection"""
    try:
        # Import database connection only when needed to avoid startup issues
        import os
        import pg8000
        
        # Test environment variables first
        db_vars = {
            'host': os.environ.get('DATABASE_HOST'),
            'database': os.environ.get('DATABASE_NAME'), 
            'user': os.environ.get('DATABASE_USER'),
            'password': os.environ.get('DATABASE_PASSWORD'),
            'port': os.environ.get('DATABASE_PORT', '5432')
        }
        
        # Check if all required vars are present
        missing_vars = [k for k, v in db_vars.items() if v is None]
        if missing_vars:
            return func.HttpResponse(
                json.dumps({"status": "failed", "error": f"Missing environment variables: {missing_vars}"}),
                status_code=500,
                mimetype="application/json"
            )
        
        # Test simple connection
        conn = pg8000.connect(
            host=db_vars['host'],
            database=db_vars['database'],
            user=db_vars['user'],
            password=db_vars['password'],
            port=int(db_vars['port']),
            ssl_context=True
        )
        
        with conn.cursor() as cursor:
            cursor.execute('SELECT 1 as test')
            result = cursor.fetchall()
            
        conn.close()
        
        return func.HttpResponse(
            json.dumps({"status": "success", "result": result, "connection_params": {k: v for k, v in db_vars.items() if k != 'password'}}),
            status_code=200,
            mimetype="application/json"
        )
    except Exception as e:
        logging.error(f"❌ Database test error: {str(e)}")
        return func.HttpResponse(
            json.dumps({"status": "failed", "error": str(e), "error_type": type(e).__name__}),
            status_code=500,
            mimetype="application/json"
        )

@user_management_bp.function_name("test_database_functions")
@user_management_bp.route(route="test/database-functions", methods=["GET"])
def test_database_functions(req: func.HttpRequest) -> func.HttpResponse:
    """Test database utility functions"""
    try:
        # Import database utilities when needed
        from database_utils import get_or_create_user_by_phone, save_incoming_message, get_conversation_context
        
        phone_number = "+17817470041"
        
        # Test user creation
        user_data = get_or_create_user_by_phone(phone_number)
        user_id = user_data['user_id']
        
        # Test message saving
        message_result = save_incoming_message(
            user_id=user_id,
            content="Test message for database functions",
            whatsapp_message_id="test_db_functions_001",
            message_relevance="goal_related"
        )
        
        # Test conversation retrieval
        conversation = get_conversation_context(user_id, limit=5)
        
        return func.HttpResponse(
            json.dumps({
                "status": "success", 
                "user_data": user_data,
                "message_saved": message_result,
                "conversation_context": conversation
            }),
            status_code=200,
            mimetype="application/json"
        )
    except Exception as e:
        import traceback
        logging.error(f"❌ Database functions test error: {str(e)}")
        logging.error(f"❌ Traceback: {traceback.format_exc()}")
        return func.HttpResponse(
            json.dumps({
                "status": "failed", 
                "error": str(e), 
                "error_type": type(e).__name__,
                "traceback": traceback.format_exc()
            }),
            status_code=500,
            mimetype="application/json"
        )

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