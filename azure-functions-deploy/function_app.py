import json
import logging
import os
import uuid
import requests
from datetime import datetime
import azure.functions as func

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)

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
                "/api/ai/motivate"
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

def send_whatsapp_message(to_phone: str, message: str) -> bool:
    """Send a message via WhatsApp Business API."""
    
    try:
        whatsapp_token = os.getenv("WHATSAPP_TOKEN")
        phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "682917338218717")
        
        if not whatsapp_token:
            logging.error("❌ WHATSAPP_TOKEN not configured")
            return False
        
        url = f"https://graph.facebook.com/v18.0/{phone_number_id}/messages"
        
        headers = {
            "Authorization": f"Bearer {whatsapp_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "messaging_product": "whatsapp",
            "to": to_phone,
            "type": "text",
            "text": {
                "body": message
            }
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        
        if response.status_code == 200:
            logging.info(f"✅ WhatsApp message sent to {to_phone}")
            return True
        else:
            logging.error(f"❌ WhatsApp API error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        logging.error(f"❌ Error sending WhatsApp message: {str(e)}")
        return False

@app.function_name("whatsapp_webhook")
@app.route(route="messaging/whatsapp", methods=["GET", "POST"])
def whatsapp_webhook(req: func.HttpRequest) -> func.HttpResponse:
    """WhatsApp webhook handler with message processing and response."""
    
    logging.info('📱 WhatsApp webhook called')
    
    try:
        if req.method == "GET":
            # Handle webhook verification
            verify_token = os.getenv("WHATSAPP_VERIFY_TOKEN")
            mode = req.params.get("hub.mode")
            token = req.params.get("hub.verify_token") 
            challenge = req.params.get("hub.challenge")
            
            if mode == "subscribe" and token == verify_token:
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
            
            logging.info(f"📥 Received WhatsApp data: {json.dumps(data, indent=2)}")
            
            # Process WhatsApp webhook data
            entries = data.get("entry", [])
            for entry in entries:
                changes = entry.get("changes", [])
                for change in changes:
                    if change.get("field") == "messages":
                        value = change.get("value", {})
                        messages = value.get("messages", [])
                        
                        for message in messages:
                            message_type = message.get("type")
                            sender = message.get("from")
                            
                            if message_type == "text":
                                text_content = message.get("text", {}).get("body", "")
                                logging.info(f"📥 Received text from {sender}: {text_content}")
                                
                                # Generate response based on message content
                                if any(keyword in text_content.lower() for keyword in ["motivation", "motivate", "inspire", "help", "goals"]):
                                    response_message = f"🔥 STAY HARD! You reached out for motivation - that's already a WIN! {text_content} is just an excuse trying to hold you back. YOU are in control. YOU decide if you're going to be average or extraordinary. The only person who can stop you is YOU. Now get out there and TAKE WHAT'S YOURS! 💪"
                                elif "goal" in text_content.lower():
                                    response_message = "🎯 Goals without action are just dreams! What specific goal are you working on? Tell me and I'll help you create a battle plan to CRUSH it! Remember: You don't get what you wish for, you get what you WORK for. STAY HARD! 💯"
                                elif any(greeting in text_content.lower() for greeting in ["hello", "hi", "hey", "start"]):
                                    response_message = "💪 Welcome to HustleMode.ai! I'm your digital David Goggins, here to push you beyond your limits! Tell me what you need motivation for - goals, workouts, life challenges - and I'll give you the mental ammunition to DOMINATE! Type 'motivation' to get fired up! 🔥"
                                else:
                                    response_message = f"💪 I hear you! Remember: Every master was once a disaster. Every expert was once a beginner. Whatever you're facing, you've got this! Need motivation? Just ask! STAY HARD! 🔥"
                                
                                # Send response back to WhatsApp
                                send_whatsapp_message(sender, response_message)
                            
                            else:
                                logging.info(f"📨 Received {message_type} message from {sender}")
                                # Send a generic response for non-text messages
                                send_whatsapp_message(sender, "💪 I see your message! Text me your goals or say 'motivation' for some fire! STAY HARD! 🔥")
            
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
    model="hustlemode-ai"
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
    model="hustlemode-ai"
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