import json
import logging
import azure.functions as func

# Create blueprint for health endpoints
health_bp = func.Blueprint()

@health_bp.function_name("health")
@health_bp.route(route="health", methods=["GET"])
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