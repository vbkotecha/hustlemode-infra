import azure.functions as func
import json

def main(req: func.HttpRequest) -> func.HttpResponse:
    """Health check endpoint for HustleMode.ai WhatsApp Bot."""
    
    response_data = {
        "status": "HustleMode.ai WhatsApp Bot is running", 
        "message": "STAY HARD",
        "version": "2.0.0-functions",
        "platform": "Azure Functions"
    }
    
    return func.HttpResponse(
        json.dumps(response_data),
        status_code=200,
        mimetype="application/json"
    ) 