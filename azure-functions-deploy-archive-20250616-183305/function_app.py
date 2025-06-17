import json
import logging
import os
import uuid
import requests
from datetime import datetime
import azure.functions as func
from assistant import assistant_apis
import whatsapp_api
from constants import ASSISTANT_NOT_AVAILABLE

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)

# Register the assistant blueprint
app.register_functions(assistant_apis)

# ============================================================================
# HEALTH CHECK & SYSTEM STATUS
# ============================================================================

@app.function_name("health")
@app.route(route="health", methods=["GET"])
def health_check(req: func.HttpRequest) -> func.HttpResponse:
    """Comprehensive health check endpoint."""
    
    try:
        # Check environment variables
        openai_configured = bool(os.getenv("AZURE_OPENAI_ENDPOINT")) and bool(os.getenv("AZURE_OPENAI_KEY"))
        whatsapp_configured = bool(os.getenv("WHATSAPP_TOKEN")) and bool(os.getenv("WHATSAPP_VERIFY_TOKEN"))
        
        health_status = {
            "status": "healthy",
            "message": "HustleMode.ai API is running",
            "version": "1.0.0",
            "platform": "Azure Functions v2",
            "timestamp": datetime.utcnow().isoformat(),
            "features": {
                "goal_management": True,
                "user_management": True,
                "whatsapp_integration": whatsapp_configured,
                "ai_services": openai_configured
            },
            "endpoints": [
                "/api/health",
                "/api/goals", 
                "/api/users",
                "/api/messaging/whatsapp",
                "/api/ai/motivate",
                "/api/assistants/message",
                "/api/users/{phone}/conversations",
                "/api/users/{phone}/preferences"
            ]
        }
        
        status_code = 200 if openai_configured else 503
        
        return func.HttpResponse(
            json.dumps(health_status, indent=2),
            status_code=status_code,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"❌ Health check failed: {str(e)}")
        return func.HttpResponse(
            json.dumps({
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }),
            status_code=503,
            mimetype="application/json"
        )

# ============================================================================
# GOALS MANAGEMENT API
# ============================================================================

@app.function_name("create_goal")
@app.route(route="goals", methods=["POST"])
def create_goal(req: func.HttpRequest) -> func.HttpResponse:
    """Create a new goal for a user."""
    
    try:
        data = req.get_json()
        
        if not data:
            return func.HttpResponse(
                json.dumps({"error": "Request body required"}),
                status_code=400,
                mimetype="application/json"
            )
        
        # Basic validation
        required_fields = ["title", "description", "user_id"]
        for field in required_fields:
            if field not in data:
                return func.HttpResponse(
                    json.dumps({"error": f"Missing required field: {field}"}),
                    status_code=400,
                    mimetype="application/json"
                )
        
        # Create goal object
        goal = {
            "goal_id": str(uuid.uuid4()),
            "title": data["title"],
            "description": data["description"],
            "user_id": data["user_id"],
            "target_date": data.get("target_date"),
            "priority": data.get("priority", "medium"),
            "status": "active",
            "progress": 0,
            "created_at": datetime.utcnow().isoformat()
        }
        
        logging.info(f"📝 Created goal: {goal['goal_id']} for user: {goal['user_id']}")
        
        return func.HttpResponse(
            json.dumps({
                "success": True,
                "goal": goal,
                "message": "Goal created successfully"
            }),
            status_code=201,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"❌ Error creating goal: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            mimetype="application/json"
        )

@app.function_name("get_goals")
@app.route(route="goals", methods=["GET"])
def get_goals(req: func.HttpRequest) -> func.HttpResponse:
    """Get goals for a user."""
    
    try:
        user_id = req.params.get('user_id')
        
        if not user_id:
            return func.HttpResponse(
                json.dumps({"error": "user_id parameter required"}),
                status_code=400,
                mimetype="application/json"
            )
        
        # Mock response for now - TODO: Connect to database
        goals = [
            {
                "goal_id": "goal_1",
                "title": "Run 5K",
                "description": "Complete a 5K run in under 30 minutes",
                "user_id": user_id,
                "status": "active",
                "progress": 60
            }
        ]
        
        return func.HttpResponse(
            json.dumps({
                "success": True,
                "goals": goals,
                "count": len(goals)
            }),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"❌ Error fetching goals: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            mimetype="application/json"
        )

@app.function_name("update_goal_progress")
@app.route(route="goals/{goal_id}/progress", methods=["POST"])
def update_goal_progress(req: func.HttpRequest) -> func.HttpResponse:
    """Update progress for a specific goal."""
    
    try:
        goal_id = req.route_params.get('goal_id')
        data = req.get_json()
        
        if not data or 'progress' not in data:
            return func.HttpResponse(
                json.dumps({"error": "Progress value required"}),
                status_code=400,
                mimetype="application/json"
            )
        
        progress = data['progress']
        
        logging.info(f"📈 Updated goal {goal_id} progress to {progress}%")
        
        return func.HttpResponse(
            json.dumps({
                "success": True,
                "goal_id": goal_id,
                "progress": progress,
                "message": "Progress updated successfully"
            }),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"❌ Error updating progress: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            mimetype="application/json"
        )

# ============================================================================
# USER MANAGEMENT API
# ============================================================================

@app.function_name("create_user")
@app.route(route="users", methods=["POST"])
def create_user(req: func.HttpRequest) -> func.HttpResponse:
    """Create a new user."""
    
    try:
        data = req.get_json()
        
        if not data:
            return func.HttpResponse(
                json.dumps({"error": "Request body required"}),
                status_code=400,
                mimetype="application/json"
            )
        
        # Create user object
        user = {
            "user_id": str(uuid.uuid4()),
            "name": data.get("name", ""),
            "phone_number": data.get("phone_number", ""),
            "created_at": datetime.utcnow().isoformat(),
            "is_active": True
        }
        
        logging.info(f"👤 Created user: {user['user_id']} - {user['name']}")
        
        return func.HttpResponse(
            json.dumps({
                "success": True,
                "user": user,
                "message": "User created successfully"
            }),
            status_code=201,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"❌ Error creating user: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            mimetype="application/json"
        )

# ============================================================================
# WHATSAPP INTEGRATION
# ============================================================================

# WhatsApp functions moved to whatsapp_api.py module

@app.function_name("whatsapp_webhook")
@app.route(route="messaging/whatsapp", methods=["GET", "POST"])
def whatsapp_webhook(req: func.HttpRequest) -> func.HttpResponse:
    """WhatsApp webhook handler that forwards messages to assistant API."""
    
    logging.info('📱 WhatsApp webhook called')
    
    try:
        if req.method == "GET":
            # Handle webhook verification
            is_verification, challenge = whatsapp_api.is_whatsapp_verification(req.params)
            
            if is_verification:
                logging.info("✅ WhatsApp webhook verified successfully")
                return func.HttpResponse(challenge, status_code=200)
            else:
                logging.warning("❌ WhatsApp webhook verification failed")
                return func.HttpResponse("Forbidden", status_code=403)
                
        elif req.method == "POST":
            # Handle incoming messages
            data = req.get_json()
            
            if not data:
                return func.HttpResponse("OK", status_code=200)
            
            logging.info(f"📥 Received WhatsApp data")
            
            # Extract phone and message using the WhatsApp API module
            phone_number, message = whatsapp_api.extract_whatsapp_data(data)
            
            if phone_number and message:
                logging.info(f"📥 Message from {phone_number}: {message}")
                
                # Send to assistant API for processing
                try:
                    # Use global assistant message endpoint
                    assistant_url = f"https://hustlemode-api.azurewebsites.net/api/assistants/message?code=FUNCTION_KEY_HERE"
                    
                    assistant_response = requests.post(
                        assistant_url,
                        json={
                            "phone": phone_number,
                            "message": message,
                            "platform": "whatsapp"
                        },
                        timeout=30
                    )
                    
                    if assistant_response.status_code == 200:
                        result = assistant_response.json()
                        logging.info(f"✅ Assistant handled message: {result.get('sent', False)}")
                    else:
                        logging.warning(f"⚠️ Assistant API issue: {assistant_response.status_code}")
                        # Emergency fallback
                        whatsapp_api.send_whatsapp_message(phone_number, ASSISTANT_NOT_AVAILABLE)
                        
                except Exception as assistant_error:
                    logging.error(f"❌ Assistant API error: {str(assistant_error)}")
                    # Emergency fallback
                    whatsapp_api.send_whatsapp_message(phone_number, ASSISTANT_NOT_AVAILABLE)
            
            return func.HttpResponse("OK", status_code=200)
            
    except Exception as e:
        logging.error(f"❌ Error in WhatsApp webhook: {str(e)}")
        return func.HttpResponse("Error", status_code=500)

# ============================================================================
# AI SERVICES
# ============================================================================

@app.function_name("generate_motivation")
@app.route(route="ai/motivate", methods=["POST"])
@app.text_completion_input(
    arg_name="response",
    prompt="You are David Goggins. Someone just told you: '{message}'. Respond with intense motivation in your signature style. Keep it under 100 words and use catchphrases like 'STAY HARD'. Be tough but supportive.",
    max_tokens="150",
    model="%CHAT_MODEL_DEPLOYMENT_NAME%"
)
def generate_motivation(req: func.HttpRequest, response: str) -> func.HttpResponse:
    """Generate David Goggins-style motivation."""
    
    try:
        # Parse the OpenAI response
        response_json = json.loads(response)
        content = response_json.get("content", "STAY HARD! No excuses!")
        
        logging.info(f'🔥 Generated Goggins motivation')
        
        return func.HttpResponse(
            json.dumps({
                "success": True,
                "motivation": content,
                "source": "David Goggins AI"
            }),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f'❌ Error in motivate function: {str(e)}')
        return func.HttpResponse(
            json.dumps({
                "success": False,
                "motivation": "STAY HARD! Even when the tech fails, you don't quit!",
                "error": "Fallback motivation"
            }),
            status_code=500,
            mimetype="application/json"
        )

# ============================================================================
# TESTING ENDPOINTS
# ============================================================================

@app.function_name("test_openai")
@app.route(route="test/openai", methods=["GET"])
@app.text_completion_input(
    arg_name="response",
    prompt="Say 'Hello from HustleMode.ai! OpenAI integration is working perfectly.' in an encouraging tone.",
    max_tokens="50",
    model="%CHAT_MODEL_DEPLOYMENT_NAME%"
)
def test_openai(req: func.HttpRequest, response: str) -> func.HttpResponse:
    """Test OpenAI integration."""
    
    try:
        response_json = json.loads(response)
        content = response_json.get("content", "OpenAI test response")
        
        return func.HttpResponse(
            json.dumps({
                "success": True,
                "openai_response": content,
                "test_status": "✅ OpenAI integration working"
            }),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        return func.HttpResponse(
            json.dumps({
                "success": False,
                "error": str(e),
                "test_status": "❌ OpenAI integration failed"
            }),
            status_code=500,
            mimetype="application/json"
        ) 