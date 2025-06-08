from fastapi import FastAPI, Request
from fastapi.responses import PlainTextResponse
import os

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
    """Handle incoming WhatsApp messages."""
    try:
        data = await request.json()
        print(f"Received WhatsApp webhook: {data}")
        
        # For now, just acknowledge receipt
        # We'll add full message processing once the webhook is set up
        return {"status": "success", "message": "Webhook received"}
        
    except Exception as e:
        print(f"Error processing webhook: {str(e)}")
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 