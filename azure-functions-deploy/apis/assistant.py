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
        
        # Get personality from input (default to Taskmaster)
        personality = input_json.get("personality", "taskmaster") if input_json else "taskmaster"
        
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
        # Get personality from request body, default to taskmaster
        personality = input_json.get("personality", "taskmaster")
        
        personality_prompts = get_personality_prompts()
        system_message = personality_prompts.get(personality, personality_prompts["taskmaster"])
        
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
            "personality": "taskmaster",  # Default personality
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