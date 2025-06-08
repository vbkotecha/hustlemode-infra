from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, PlainTextResponse
import hmac
import hashlib
import os
from typing import Dict, Optional
from .whatsapp_service import WhatsAppService

app = FastAPI()
whatsapp_service = WhatsAppService()

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "HustleMode.ai WhatsApp Bot is running", "message": "STAY HARD"}

def verify_webhook_signature(request_body: bytes, signature: str) -> bool:
    """Verify WhatsApp webhook signature."""
    try:
        # Get the app secret from environment
        app_secret = os.getenv("WHATSAPP_APP_SECRET")
        if not app_secret:
            raise ValueError("WHATSAPP_APP_SECRET not set")
        
        # Calculate expected signature
        expected_signature = hmac.new(
            app_secret.encode(),
            request_body,
            hashlib.sha256
        ).hexdigest()
        
        # Compare signatures
        return hmac.compare_digest(signature, expected_signature)
    except Exception as e:
        print(f"Error verifying webhook signature: {str(e)}")
        return False

@app.post("/webhook/whatsapp")
async def whatsapp_webhook(request: Request):
    """Handle incoming WhatsApp messages."""
    try:
        # Get request body and signature
        body = await request.body()
        signature = request.headers.get("X-Hub-Signature-256", "")
        
        # Verify webhook signature
        if not verify_webhook_signature(body, signature):
            raise HTTPException(status_code=401, detail="Invalid signature")
        
        # Parse request body
        data = await request.json()
        
        # Process message
        if "entry" in data and "changes" in data["entry"][0]:
            for change in data["entry"][0]["changes"]:
                if change["field"] == "messages":
                    await process_message(change["value"])
        
        return JSONResponse(content={"status": "success"})
        
    except Exception as e:
        print(f"Error processing webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/webhook/whatsapp")
async def verify_webhook(request: Request):
    params = dict(request.query_params)
    verify_token = os.getenv("WHATSAPP_VERIFY_TOKEN")
    if (
        params.get("hub.mode") == "subscribe"
        and params.get("hub.verify_token") == verify_token
    ):
        return PlainTextResponse(params.get("hub.challenge"), status_code=200)
    return PlainTextResponse("Verification failed", status_code=403)

async def process_message(message_data: Dict) -> None:
    """Process incoming WhatsApp message."""
    try:
        # Extract message details
        message = message_data.get("messages", [{}])[0]
        from_number = message.get("from")
        message_type = message.get("type")
        message_content = message.get("text", {}).get("body", "")
        
        if not from_number or not message_content:
            print("Invalid message format")
            return
        
        # Process message based on type
        if message_type == "text":
            await handle_text_message(from_number, message_content)
        elif message_type == "interactive":
            await handle_interactive_message(from_number, message)
            
    except Exception as e:
        print(f"Error processing message: {str(e)}")
        raise

async def handle_text_message(from_number: str, content: str) -> None:
    """Handle text messages with Goggins-style responses."""
    try:
        # Convert content to lowercase for easier matching
        content = content.lower()
        
        # Check for goal setting
        if "set goal" in content or "new goal" in content:
            # Extract goal details (simplified for example)
            goal_type = "fitness" if "fitness" in content else "general"
            goal_details = {
                "description": content,
                "target": "TBD - Set a real target!",
                "timeline": "ASAP - No time to waste!"
            }
            await whatsapp_service.send_goal_setting_message(from_number, goal_type, goal_details)
            
        # Check for check-in
        elif "check in" in content or "progress" in content:
            progress = {
                "status": "In Progress",
                "progress": "50% - Push harder!",
                "challenges": "Not pushing hard enough!"
            }
            await whatsapp_service.send_check_in_message(from_number, progress)
            
        # Check for setback
        elif "setback" in content or "failed" in content:
            setback = {
                "description": content,
                "impact": "Major - Face it!",
                "next_steps": "Push harder - No excuses!"
            }
            await whatsapp_service.send_setback_message(from_number, setback)
            
        # Default response
        else:
            await whatsapp_service.send_message(
                from_number,
                "STAY HARD. What's your next move? Set a goal, check in, or face a setback?"
            )
            
    except Exception as e:
        print(f"Error handling text message: {str(e)}")
        raise

async def handle_interactive_message(from_number: str, message: Dict) -> None:
    """Handle interactive messages (buttons, lists)."""
    try:
        # Extract interactive response
        interactive = message.get("interactive", {})
        response_type = interactive.get("type")
        
        if response_type == "button_reply":
            button_id = interactive.get("button_reply", {}).get("id")
            await handle_button_response(from_number, button_id)
            
        elif response_type == "list_reply":
            list_id = interactive.get("list_reply", {}).get("id")
            await handle_list_response(from_number, list_id)
            
    except Exception as e:
        print(f"Error handling interactive message: {str(e)}")
        raise

async def handle_button_response(from_number: str, button_id: str) -> None:
    """Handle button responses with Goggins-style accountability."""
    try:
        if button_id == "set_goal":
            await whatsapp_service.send_message(
                from_number,
                "STAY HARD. What's your goal? No soft targets allowed."
            )
        elif button_id == "check_in":
            await whatsapp_service.send_message(
                from_number,
                "PROGRESS CHECK. Face the truth - how are you really doing?"
            )
        elif button_id == "report_setback":
            await whatsapp_service.send_message(
                from_number,
                "SETBACK DETECTED. No hiding - what happened?"
            )
            
    except Exception as e:
        print(f"Error handling button response: {str(e)}")
        raise

async def handle_list_response(from_number: str, list_id: str) -> None:
    """Handle list responses with Goggins-style motivation."""
    try:
        if list_id == "goal_type":
            await whatsapp_service.send_message(
                from_number,
                "STAY HARD. Choose your battle - but choose wisely."
            )
        elif list_id == "check_in_type":
            await whatsapp_service.send_message(
                from_number,
                "PROGRESS CHECK. No sugar coating - what's your status?"
            )
            
    except Exception as e:
        print(f"Error handling list response: {str(e)}")
        raise 