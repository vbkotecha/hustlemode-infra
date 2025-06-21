import json
import logging
import os
import azure.functions as func
from openai import AzureOpenAI
from personalities import get_personality_prompts

# Create blueprint for assistant endpoints
assistant_bp = func.Blueprint()

@assistant_bp.function_name("create_assistant")
@assistant_bp.route(route="assistants", methods=["PUT"])
def create_assistant(req: func.HttpRequest) -> func.HttpResponse:
    """Create assistant with specified personality."""
    
    try:
        input_json = req.get_json()
        
        # Get personality from input (default to Goggins)
        personality = input_json.get("personality", "goggins") if input_json else "goggins"
        
        logging.info(f"🤖 Created assistant with {personality} personality")
        
        return func.HttpResponse(
            json.dumps({
                "assistant_id": f"assistant_{personality}",
                "personality": personality,
                "status": "created"
            }),
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

@assistant_bp.function_name("post_message")
@assistant_bp.route(route="assistants/{chatId}", methods=["POST"])
def post_message(req: func.HttpRequest) -> func.HttpResponse:
    """Send message to assistant and get response."""
    
    try:
        chatId = req.route_params.get('chatId')
        input_json = req.get_json()
        
        if not input_json or 'message' not in input_json:
            return func.HttpResponse(
                json.dumps({"error": "Message is required"}),
                status_code=400,
                mimetype="application/json"
            )
        
        message = input_json['message']
        # Get personality from request body, default to goggins
        personality = input_json.get("personality", "goggins")
        
        personality_prompts = get_personality_prompts()
        system_message = personality_prompts.get(personality, personality_prompts["goggins"])
        
        # Initialize Azure OpenAI client
        client = AzureOpenAI(
            api_key=os.environ["AZURE_OPENAI_API_KEY"],
            api_version="2024-02-01",
            azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"]
        )
        
        # Make the completion request
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": message}
            ],
            max_tokens=200
        )
        
        ai_response = response.choices[0].message.content
        
        logging.info(f"🤖 Assistant ({personality}) responded to chat {chatId}")
        
        return func.HttpResponse(
            json.dumps({
                "chatId": chatId,
                "personality": personality,
                "response": ai_response,
                "success": True
            }),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"❌ Error in assistant post_message: {str(e)}")
        return func.HttpResponse(
            json.dumps({
                "chatId": chatId,
                "error": "Failed to process message",
                "success": False
            }),
            status_code=500,
            mimetype="application/json"
        )

@assistant_bp.function_name("get_assistant_state")
@assistant_bp.route(route="assistants/{chatId}/state", methods=["GET"])
def get_assistant_state(req: func.HttpRequest) -> func.HttpResponse:
    """Get current assistant state and conversation history."""
    
    try:
        chatId = req.route_params.get('chatId')
        
        # In production, this would fetch from Azure Storage
        # For now, return mock state
        state = {
            "chatId": chatId,
            "personality": "goggins",  # Default personality
            "message_count": 0,
            "conversation_history": []
        }
        
        return func.HttpResponse(
            json.dumps(state),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"❌ Error getting assistant state: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": "Failed to get assistant state"}),
            status_code=500,
            mimetype="application/json"
        )

@assistant_bp.function_name("assistant_chat")
@assistant_bp.route(route="assistant/chat", methods=["POST"])
def assistant_chat(req: func.HttpRequest) -> func.HttpResponse:
    """Chat with assistant using phone number for context."""
    
    try:
        input_json = req.get_json()
        
        if not input_json or 'phone_number' not in input_json or 'message' not in input_json:
            return func.HttpResponse(
                json.dumps({"error": "phone_number and message are required"}),
                status_code=400,
                mimetype="application/json"
            )
        
        phone_number = input_json['phone_number']
        message = input_json['message']
        personality = input_json.get("personality", "goggins")
        
        # Import assistant utilities when needed
        from assistant_utils import get_user_context, get_ai_response, save_user_context
        
        # Get user context and conversation history
        user_context = get_user_context(phone_number)
        
        # Get AI response with conversation context (returns tuple: response, request_id)
        ai_response, azure_request_id = get_ai_response(
            message=message,
            personality=personality,
            conversation_context=user_context.get('conversation_history', [])
        )
        
        # Save conversation to database
        save_success = save_user_context(
            phone_number=phone_number,
            personality=personality,
            message=message,
            response=ai_response,
            azure_openai_request_id=azure_request_id
        )
        
        logging.info(f"🤖 Assistant chat for {phone_number}: {message[:50]}...")
        
        return func.HttpResponse(
            json.dumps({
                "phone_number": phone_number,
                "personality": personality,
                "response": ai_response,
                "conversation_saved": save_success,
                "success": True
            }),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"❌ Error in assistant chat: {str(e)}")
        return func.HttpResponse(
            json.dumps({
                "error": "Failed to process chat message",
                "success": False
            }),
            status_code=500,
            mimetype="application/json"
        ) 