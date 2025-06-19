import json
import logging
import os
import azure.functions as func
from openai import AzureOpenAI

# Create blueprint for completion endpoints
completion_bp = func.Blueprint()

@completion_bp.function_name("ask")
@completion_bp.route(route="ask", methods=["POST"])
def ask(req: func.HttpRequest) -> func.HttpResponse:
    """Simple ask completion endpoint for testing."""
    
    try:
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