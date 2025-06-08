from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import PlainTextResponse
import os
import json
import httpx
from typing import Dict, Optional
import re

app = FastAPI(title="HustleMode.ai WhatsApp Bot")

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "HustleMode.ai WhatsApp Bot is running", 
        "message": "STAY HARD",
        "version": "1.0.0"
    }

@app.get("/webhook/whatsapp")
async def verify_webhook(request: Request):
    """WhatsApp webhook verification endpoint."""
    params = dict(request.query_params)
    verify_token = os.getenv("WHATSAPP_VERIFY_TOKEN", "fa22d4e7-cba4-48cf-9b36-af6190bf9c67")
    
    if (
        params.get("hub.mode") == "subscribe"
        and params.get("hub.verify_token") == verify_token
    ):
        return PlainTextResponse(params.get("hub.challenge"), status_code=200)
    return PlainTextResponse("Verification failed", status_code=403)

@app.post("/webhook/whatsapp")
async def whatsapp_webhook(request: Request):
    """Handle incoming WhatsApp messages with GOGGINS-STYLE responses."""
    try:
        data = await request.json()
        print(f"💪 Received WhatsApp webhook: {json.dumps(data, indent=2)}")
        
        # Process each entry in the webhook
        if "entry" in data:
            for entry in data["entry"]:
                if "changes" in entry:
                    for change in entry["changes"]:
                        if change["field"] == "messages" and "value" in change:
                            await process_whatsapp_message(change["value"])
        
        return {"status": "success", "message": "STAY HARD - Message processed"}
        
    except Exception as e:
        print(f"🚨 Error processing webhook: {str(e)}")
        return {"status": "error", "message": f"Error: {str(e)}"}

async def process_whatsapp_message(message_data: Dict) -> None:
    """Process incoming WhatsApp messages with GOGGINS-STYLE brutal honesty."""
    try:
        # Extract message details
        messages = message_data.get("messages", [])
        if not messages:
            print("🚨 No messages found in webhook data")
            return
            
        for message in messages:
            from_number = message.get("from")
            message_type = message.get("type")
            timestamp = message.get("timestamp")
            
            print(f"📱 Message from {from_number}, type: {message_type}")
            
            if message_type == "text":
                text_content = message.get("text", {}).get("body", "").strip()
                await handle_text_message(from_number, text_content)
            elif message_type == "interactive":
                await handle_interactive_message(from_number, message)
            else:
                # Handle other message types with default Goggins response
                await send_whatsapp_message(from_number, get_default_goggins_response())
                
    except Exception as e:
        print(f"🚨 Error processing message: {str(e)}")

async def handle_text_message(from_number: str, content: str) -> None:
    """Handle text messages with BRUTAL Goggins-style responses."""
    try:
        content_lower = content.lower().strip()
        print(f"💬 Processing message: '{content}' from {from_number}")
        
        # Goal Setting Triggers
        if any(trigger in content_lower for trigger in ["set goal", "new goal", "goal", "target", "achieve"]):
            response = get_goal_setting_response(content)
            
        # Progress Check-in Triggers  
        elif any(trigger in content_lower for trigger in ["progress", "check in", "update", "how am i doing", "status"]):
            response = get_progress_check_response(content)
            
        # Setback/Failure Triggers
        elif any(trigger in content_lower for trigger in ["failed", "setback", "can't do it", "giving up", "too hard", "quit"]):
            response = get_setback_response(content)
            
        # Motivation/Encouragement Triggers
        elif any(trigger in content_lower for trigger in ["motivate", "encourage", "help", "stuck", "motivation", "tired"]):
            response = get_motivation_response(content)
            
        # Greeting Triggers
        elif any(trigger in content_lower for trigger in ["hi", "hello", "hey", "start", "begin"]):
            response = get_welcome_response()
            
        # Default Goggins Response
        else:
            response = get_default_goggins_response()
            
        await send_whatsapp_message(from_number, response)
        
    except Exception as e:
        print(f"🚨 Error handling text message: {str(e)}")
        await send_whatsapp_message(from_number, "STAY HARD. Something went wrong but that's no excuse!")

def get_goal_setting_response(content: str) -> str:
    """Generate Goggins-style goal setting response."""
    return f"""🔥 GOAL SETTING TIME - NO WEAK TARGETS ALLOWED!

You said: "{content}"

Listen up! Your mind is gonna quit on you 1000 times before your body does. But that's where champions are made.

Here's what we're gonna do:
1️⃣ DEFINE your target (be SPECIFIC - no vague bullshit)
2️⃣ SET a timeline (deadlines create diamonds)  
3️⃣ IDENTIFY what you're willing to SACRIFICE
4️⃣ PLAN for when you want to QUIT (because you will)

Remember: You don't know what you're capable of until you push past what you thought was possible.

WHO'S GONNA CARRY THE BOATS? YOU ARE!

Reply with your SPECIFIC goal and I'll help you build an UNBREAKABLE plan.

STAY HARD! 💪"""

def get_progress_check_response(content: str) -> str:
    """Generate Goggins-style progress check response."""
    return f"""📊 PROGRESS CHECK - NO SUGAR COATING!

You're checking in... that's already better than 99% of people who just talk.

But here's the TRUTH:
• Are you REALLY pushing yourself?
• Or are you staying in your comfort zone?
• What did you do TODAY that you didn't want to do?

Excellence is not a skill, it's an ATTITUDE. Every single day you have a choice:
- Stay comfortable and weak
- Or embrace the SUCK and get stronger

Tell me EXACTLY what you've accomplished and what you're struggling with. No lies, no excuses.

The only person you're fooling is YOURSELF.

ACCOUNTABILITY IS EVERYTHING!

STAY HARD! 🔥"""

def get_setback_response(content: str) -> str:
    """Generate Goggins-style setback response.""" 
    return f"""⚡ SETBACK DETECTED - TIME TO GET REAL!

You hit a wall? GOOD! That's where the real work begins.

Listen: Every champion has failed. Every warrior has been knocked down. The difference? They got back up and kept swinging.

This setback is NOT your enemy - it's your TEACHER:
• What did it show you about your preparation?
• Where were you cutting corners?
• What excuses were you making?

You have TWO choices right now:
1️⃣ Let this break you (like most people)
2️⃣ Use it as FUEL to become unstoppable

Remember: Pain is temporary. Quitting lasts forever.

Your next move determines who you really are. Champions are built in these moments.

GET BACK IN THERE AND SHOW LIFE WHO'S BOSS!

STAY HARD! ⚡"""

def get_motivation_response(content: str) -> str:
    """Generate Goggins-style motivation response."""
    return f"""💥 MOTIVATION? MOTIVATION IS BULLSHIT!

You don't need motivation - you need DISCIPLINE. Motivation gets you started, but discipline keeps you going when motivation is nowhere to be found.

Here's what you need to understand:
• Nobody's coming to save you
• This life is 100% your responsibility  
• Stop looking for shortcuts
• Start embracing the GRIND

The strongest people don't look strong. They look tired. Why? Because they're doing the work when everyone else is making excuses.

You want to change your life? Stop talking and start DOING:
- Do something hard EVERY day
- Stop listening to that weak voice in your head
- Callous your mind through suffering

You are capable of SO much more than you know. But you'll never find out if you keep choosing the easy path.

EMBRACE THE SUCK!

STAY HARD! 💥"""

def get_welcome_response() -> str:
    """Generate Goggins-style welcome response."""
    return f"""🔥 WELCOME TO HUSTLEMODE.AI - WHERE EXCUSES COME TO DIE!

I'm not here to be your friend. I'm here to be your ACCOUNTABILITY PARTNER.

This is how we work:
• NO EXCUSES, only results
• NO SHORTCUTS, only hard work  
• NO VICTIM MENTALITY, only ownership

What I can help you with:
📈 Goal Setting (with BRUTAL honesty)
💪 Progress Check-ins (no sugar coating)
⚡ Setback Recovery (turning pain into power)
🔥 Daily Motivation (when you need that push)

Remember: Your biggest enemy lives between your ears. We're going to rewire that voice from weak to WARRIOR.

Tell me what you want to achieve, and I'll help you build the MENTAL TOUGHNESS to get there.

WHO'S GONNA CARRY THE BOATS?

STAY HARD! 🔥"""

def get_default_goggins_response() -> str:
    """Generate default Goggins-style response."""
    responses = [
        "STAY HARD! What's your next move? Don't just talk - EXECUTE! 🔥",
        "Stop making excuses and start making PROGRESS. You know what you need to do! 💪",
        "Your mind is playing tricks on you. Push through the noise and DO THE WORK! ⚡",
        "Nobody's coming to save you. This is YOUR fight. What are you gonna do about it? 🔥",
        "Embrace the SUCK. That's where champions are made. STAY HARD! 💥"
    ]
    import random
    return random.choice(responses)

async def send_whatsapp_message(to_number: str, message: str) -> None:
    """Send message back to WhatsApp user via WhatsApp Business API."""
    try:
        print(f"📤 SENDING GOGGINS RESPONSE to {to_number}:")
        print(f"📝 {message}")
        print("-" * 50)
        
        # Get WhatsApp Business API credentials
        whatsapp_token = os.getenv("WHATSAPP_TOKEN")
        whatsapp_business_account_id = os.getenv("WHATSAPP_BUSINESS_ACCOUNT_ID")
        from_number = os.getenv("WHATSAPP_PHONE_NUMBER")
        
        if not all([whatsapp_token, whatsapp_business_account_id, from_number]):
            print("🚨 Missing WhatsApp Business API credentials - message logged only")
            return
            
        # WhatsApp Business API endpoint
        url = f"https://graph.facebook.com/v21.0/{whatsapp_business_account_id}/messages"
        
        # Prepare message payload
        payload = {
            "messaging_product": "whatsapp",
            "to": to_number,
            "type": "text",
            "text": {
                "body": message
            }
        }
        
        # Headers with authorization
        headers = {
            "Authorization": f"Bearer {whatsapp_token}",
            "Content-Type": "application/json"
        }
        
        # Send message via WhatsApp Business API
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers)
            
        if response.status_code == 200:
            response_data = response.json()
            message_id = response_data.get("messages", [{}])[0].get("id", "unknown")
            print(f"✅ GOGGINS MESSAGE SENT successfully via WhatsApp Business API! Message ID: {message_id}")
        else:
            print(f"🚨 WhatsApp Business API error: {response.status_code} - {response.text}")
            print("📝 GOGGINS RESPONSE logged but not sent")
            
    except Exception as e:
        print(f"🚨 Error sending message via WhatsApp Business API: {str(e)}")
        print("📝 GOGGINS RESPONSE logged but not sent - user will see response in logs")

async def handle_interactive_message(from_number: str, message: Dict) -> None:
    """Handle interactive messages (buttons, lists) with Goggins responses."""
    try:
        interactive = message.get("interactive", {})
        response_type = interactive.get("type")
        
        if response_type == "button_reply":
            button_id = interactive.get("button_reply", {}).get("id")
            response = f"🔥 You selected: {button_id}\n\nGOOD! Now let's get to WORK! No more clicking buttons - time for ACTION!\n\nSTAY HARD! 💪"
            
        elif response_type == "list_reply":
            list_id = interactive.get("list_reply", {}).get("id")
            response = f"💪 You chose: {list_id}\n\nChoice made! Now EXECUTE. Talking is easy, DOING is where champions separate themselves.\n\nSTAY HARD! 🔥"
            
        else:
            response = get_default_goggins_response()
            
        await send_whatsapp_message(from_number, response)
        
    except Exception as e:
        print(f"🚨 Error handling interactive message: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 