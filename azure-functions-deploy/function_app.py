import json
import logging
import azure.functions as func

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)

# Azure Functions app configuration

# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.function_name("health")
@app.route(route="health", methods=["GET"])
def health_check(req: func.HttpRequest) -> func.HttpResponse:
    """Health check endpoint."""
    
    health_status = {
        "status": "healthy",
        "message": "HustleMode.ai API is running",
        "version": "2.0.0",
        "platform": "Azure Functions v2 + OpenAI Extension"
    }
    
    return func.HttpResponse(
        json.dumps(health_status, indent=2),
        status_code=200,
        mimetype="application/json"
    )

# ============================================================================
# ASSISTANT API - Using OpenAI Extension
# ============================================================================

@app.function_name("CreateAssistant")
@app.route(route="assistants/{chatId}", methods=["PUT"])
def create_assistant(req: func.HttpRequest) -> func.HttpResponse:
    """Create AI assistant with personality instructions."""
    
    try:
        chatId = req.route_params.get("chatId")
        input_json = req.get_json()
        
        # Get personality from input (default to Goggins)
        personality = input_json.get("personality", "goggins") if input_json else "goggins"
        
        logging.info(f"Creating assistant {chatId} with {personality} personality")
        
        # Store the personality in a simple format (we'll use this in message processing)
        # In a real implementation, you'd store this in Azure Storage/Database
        
        return func.HttpResponse(
            json.dumps({"chatId": chatId, "personality": personality, "status": "created"}),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"❌ Error creating assistant: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": "Failed to create assistant"}),
            status_code=500,
            mimetype="application/json"
        )

@app.function_name("PostMessage")
@app.route(route="assistants/{chatId}", methods=["POST"])
def post_message(req: func.HttpRequest) -> func.HttpResponse:
    """Send message to AI assistant and return response."""
    
    try:
        import os
        from openai import AzureOpenAI
        
        chatId = req.route_params.get("chatId")
        input_json = req.get_json()
        
        if not input_json or "message" not in input_json:
            return func.HttpResponse(
                json.dumps({"error": "Message is required"}),
                status_code=400,
                mimetype="application/json"
            )
        
        user_message = input_json["message"]
        
        # Get personality from request body, default to goggins
        personality = input_json.get("personality", "goggins")
        
        # Define personality instructions
        personality_instructions = {
            "goggins": """You are David Goggins, the ultimate mental toughness coach. Your role is to provide intense, no-nonsense motivation and accountability.

Core principles:
- Push people beyond their comfort zone
- No excuses, no shortcuts
- Mental toughness is everything
- Pain is temporary, quitting lasts forever
- Use your signature phrases like "STAY HARD", "Who's gonna carry the boats?", "Good"

When users share their goals or challenges:
1. Acknowledge their courage to reach out
2. Challenge their mindset if they're making excuses
3. Provide specific, actionable advice
4. End with powerful motivation

Keep responses under 200 words but pack maximum impact.
Be tough but supportive - you're here to help them win.""",
            
            "zen": """You are a wise Zen master who provides calm, mindful guidance. Your role is to offer peaceful wisdom and balanced perspective on goals and challenges.

Core principles:
- Speak with calm, centered wisdom
- Focus on inner peace and balance
- Use metaphors from nature and meditation
- Emphasize the journey over the destination
- Help find clarity through mindfulness

Keep responses serene, wise, and under 200 words.
The path to success begins with inner peace.""",
            
            "cheerleader": """You are an enthusiastic, positive cheerleader coach who celebrates every win and encourages through setbacks. Your role is to provide uplifting, energetic motivation that makes people feel capable and supported.

Core principles:
- Celebrate every small win with genuine excitement
- Use lots of emojis and exclamation points! 
- Turn setbacks into comebacks with positive reframing
- Focus on what they CAN do, not what they can't
- Use encouraging phrases like "You've got this!", "Amazing progress!", "I believe in you!"

When users share their goals or challenges:
1. Celebrate their courage to share with you
2. Highlight their strengths and past successes
3. Break big goals into exciting, achievable steps
4. End with enthusiastic encouragement

Keep responses upbeat, supportive, and under 200 words.
Every step forward deserves celebration! 🎉""",
            
            "comedian": """You are a witty, humorous motivational coach who uses laughter to inspire and help people overcome challenges. Your role is to provide motivation through humor, clever observations, and light-hearted perspectives.

Core principles:
- Use appropriate humor to lighten heavy situations
- Make clever observations about human nature and habits
- Use funny analogies and metaphors
- Help people laugh at their own excuses and fears
- Keep it positive - humor should uplift, not tear down

When users share their goals or challenges:
1. Find the humor in the situation (gently!)
2. Use funny analogies to reframe their perspective
3. Make them laugh at their own excuses
4. Provide actionable advice wrapped in humor

Keep responses funny but genuinely helpful, under 200 words.
Laughter is the best medicine, but action is the best cure! 😄"""
        }
        
        system_message = personality_instructions.get(personality, personality_instructions["goggins"])
        
        # Initialize Azure OpenAI client (same as test_openai.py)
        client = AzureOpenAI(
            api_key=os.environ["AZURE_OPENAI_API_KEY"],
            api_version="2024-02-01",
            azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"]
        )
        
        # Make the completion request
        response = client.chat.completions.create(
            model="gpt-4o",  # Direct model name like test_openai.py
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ],
            max_tokens=200
        )
        
        assistant_response = response.choices[0].message.content
        
        logging.info(f"🤖 AI assistant responded to chat {chatId}")
        
        return func.HttpResponse(
            json.dumps({
                "chatId": chatId,
                "response": assistant_response,
                "success": True
            }),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"❌ Error in post_message: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": f"Failed to process message: {str(e)}"}),
            status_code=500,
            mimetype="application/json"
        )

@app.function_name("GetChatState")
@app.route(route="assistants/{chatId}", methods=["GET"])
def get_chat_state(req: func.HttpRequest) -> func.HttpResponse:
    """Get chat conversation history."""
    
    try:
        chatId = req.route_params.get("chatId")
        
        # For now, return simple status (in real app, retrieve from storage)
        return func.HttpResponse(
            json.dumps({
                "chatId": chatId,
                "messages": [],
                "totalMessages": 0,
                "status": "Chat history not implemented yet",
                "success": True
            }),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"❌ Error in get_chat_state: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": "Failed to retrieve chat state"}),
            status_code=500,
            mimetype="application/json"
        )

# ============================================================================
# SIMPLE COMPLETION ENDPOINT (for testing)
# ============================================================================

@app.function_name("ask")
@app.route(route="ask", methods=["POST"])
def ask(req: func.HttpRequest) -> func.HttpResponse:
    """Simple ask completion endpoint for testing."""
    
    try:
        import os
        from openai import AzureOpenAI
        
        # Get the prompt from request
        data = req.get_json()
        prompt = data.get("prompt", "")
        
        if not prompt:
            return func.HttpResponse(
                json.dumps({"error": "Prompt is required"}),
                status_code=400,
                mimetype="application/json"
            )
        
        # Use same configuration as test_openai.py
        client = AzureOpenAI(
            api_key=os.environ["AZURE_OPENAI_API_KEY"],
            api_version="2024-02-01",
            azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"]
        )
        
        # Make the completion request
        response = client.chat.completions.create(
            model="gpt-4o",  # Direct model name like test_openai.py
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_tokens=500
        )
        
        content = response.choices[0].message.content
        
        logging.info(f"✅ Ask endpoint successful for prompt: {prompt[:50]}...")
        
        return func.HttpResponse(
            json.dumps({
                "response": content,
                "success": True
            }),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"❌ Error in ask: {str(e)}")
        return func.HttpResponse(
            json.dumps({
                "response": "STAY HARD! Even when tech fails, your determination doesn't!",
                "success": False,
                "error": str(e)
            }),
            status_code=500,
            mimetype="application/json"
        )

# ============================================================================
# WHATSAPP WEBHOOK (Simple passthrough to assistant)
# ============================================================================

@app.function_name("whatsapp_webhook")
@app.route(route="messaging/whatsapp", methods=["GET", "POST"])
def whatsapp_webhook(req: func.HttpRequest) -> func.HttpResponse:
    """WhatsApp webhook handler."""
    
    logging.info('📱 WhatsApp webhook called')
    
    try:
        if req.method == "GET":
            # Webhook verification
            verify_token = req.params.get('hub.verify_token')
            challenge = req.params.get('hub.challenge')
            
            # You should validate the verify_token here
            if verify_token == "your_verify_token":  # Replace with your actual token
                logging.info("✅ WhatsApp webhook verified")
                return func.HttpResponse(challenge, status_code=200)
            else:
                logging.warning("❌ WhatsApp webhook verification failed")
                return func.HttpResponse("Forbidden", status_code=403)
                
        elif req.method == "POST":
            # Handle incoming messages
            data = req.get_json()
            
            if not data:
                return func.HttpResponse("OK", status_code=200)
            
            logging.info(f"📥 Received WhatsApp data: {json.dumps(data)}")
            
            # Extract message details (simplified - you'll need to implement proper parsing)
            try:
                if "entry" in data and len(data["entry"]) > 0:
                    entry = data["entry"][0]
                    if "changes" in entry and len(entry["changes"]) > 0:
                        change = entry["changes"][0]
                        if "value" in change and "messages" in change["value"]:
                            messages = change["value"]["messages"]
                            if len(messages) > 0:
                                message = messages[0]
                                phone_number = message["from"]
                                text = message.get("text", {}).get("body", "")
                                
                                logging.info(f"📥 Message from {phone_number}: {text}")
                                
                                # TODO: Send to assistant API
                                # For now, just log it
                                
            except Exception as parse_error:
                logging.error(f"❌ Error parsing WhatsApp message: {str(parse_error)}")
            
            return func.HttpResponse("OK", status_code=200)
            
    except Exception as e:
        logging.error(f"❌ Error in WhatsApp webhook: {str(e)}")
        return func.HttpResponse("Error", status_code=500) 