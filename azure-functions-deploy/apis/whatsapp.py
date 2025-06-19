import json
import logging
import azure.functions as func
import whatsapp_api
from constants import *
from assistant_utils import (
    is_personality_command,
    get_user_context,
    save_user_context,
    send_message_to_platform,
    get_ai_response
)

# Create blueprint for WhatsApp endpoints
whatsapp_bp = func.Blueprint()

@whatsapp_bp.function_name("whatsapp_webhook")
@whatsapp_bp.route(route="messaging/whatsapp", methods=["GET", "POST"])
def whatsapp_webhook(req: func.HttpRequest) -> func.HttpResponse:
    """WhatsApp webhook handler that processes messages and responds with AI."""
    
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
                
                # Get user context
                user_context = get_user_context(phone_number)
                current_personality = user_context.get("current_personality", DEFAULT_PERSONALITY)
                
                # Check for personality switch commands
                is_personality_cmd, new_personality = is_personality_command(message)
                
                if is_personality_cmd:
                    # Handle personality switch
                    personality_name = PERSONALITY_NAMES.get(new_personality, new_personality)
                    confirmation_message = f"✅ Switched to {personality_name} mode! How can I help you today?"
                    
                    # Send confirmation
                    success = send_message_to_platform(phone_number, confirmation_message, DEFAULT_PLATFORM)
                    
                    # Save the personality switch
                    save_user_context(phone_number, new_personality, message, confirmation_message)
                    
                    logging.info(f"🔄 Personality switched to {new_personality} for {phone_number}")
                else:
                    # Get AI response with current personality
                    ai_response = get_ai_response(message, current_personality)
                    
                    # Send response to user
                    success = send_message_to_platform(phone_number, ai_response, DEFAULT_PLATFORM)
                    
                    # Save conversation
                    save_user_context(phone_number, current_personality, message, ai_response)
                    
                    logging.info(f"🤖 AI assistant ({current_personality}) responded to {phone_number}")
            
            return func.HttpResponse("OK", status_code=200)
            
    except Exception as e:
        logging.error(f"❌ Error in WhatsApp webhook: {str(e)}")
        # Try emergency fallback
        try:
            if 'phone_number' in locals() and phone_number:
                send_message_to_platform(phone_number, ASSISTANT_NOT_AVAILABLE, DEFAULT_PLATFORM)
        except:
            pass
        return func.HttpResponse("Error", status_code=500)

@whatsapp_bp.function_name("send_whatsapp_message")
@whatsapp_bp.route(route="messaging/send", methods=["POST"])
def send_whatsapp_message_endpoint(req: func.HttpRequest) -> func.HttpResponse:
    """Send message to WhatsApp with AI assistant integration."""
    
    try:
        data = req.get_json()
        
        if not data or "phone" not in data or "message" not in data:
            return func.HttpResponse(
                json.dumps({"error": "Phone number and message are required"}),
                status_code=400,
                mimetype="application/json"
            )
        
        phone_number = data["phone"]
        message = data["message"]
        personality = data.get("personality", DEFAULT_PERSONALITY)
        platform = data.get("platform", DEFAULT_PLATFORM)
        
        # Check for personality switch commands
        is_personality_cmd, new_personality = is_personality_command(message)
        
        if is_personality_cmd:
            # Handle personality switch
            personality_name = PERSONALITY_NAMES.get(new_personality, new_personality)
            confirmation_message = f"✅ Switched to {personality_name} mode! How can I help you today?"
            
            # Send confirmation
            success = send_message_to_platform(phone_number, confirmation_message, platform)
            
            return func.HttpResponse(
                json.dumps({
                    "sent": success, 
                    "personality_switched": True, 
                    "new_personality": new_personality,
                    "response": confirmation_message
                }),
                status_code=200,
                mimetype="application/json"
            )
        
        # Get AI response
        ai_response = get_ai_response(message, personality)
        
        # Send response to user
        success = send_message_to_platform(phone_number, ai_response, platform)
        
        # Save conversation
        save_user_context(phone_number, personality, message, ai_response)
        
        logging.info(f"💬 Assistant ({personality}) responded to {phone_number}")
        
        return func.HttpResponse(
            json.dumps({
                "sent": success,
                "personality": personality,
                "response": ai_response
            }),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"❌ Error in send_whatsapp_message: {str(e)}")
        
        # Emergency fallback
        try:
            phone_number = data.get("phone") if data else ""
            platform = data.get("platform", DEFAULT_PLATFORM) if data else DEFAULT_PLATFORM
            success = send_message_to_platform(phone_number, ASSISTANT_NOT_AVAILABLE, platform)
            
            return func.HttpResponse(
                json.dumps({"sent": success, "error": True}),
                status_code=200 if success else 500,
                mimetype="application/json"
            )
        except:
            return func.HttpResponse(
                json.dumps({"sent": False, "error": "Failed to process message"}),
                status_code=500,
                mimetype="application/json"
            ) 