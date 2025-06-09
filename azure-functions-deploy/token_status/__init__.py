import azure.functions as func
import json
import os
import urllib.request
import urllib.error
from datetime import datetime

def main(req: func.HttpRequest) -> func.HttpResponse:
    """Check WhatsApp Business API token validity and status."""
    
    try:
        # Get WhatsApp credentials
        whatsapp_token = os.getenv("WHATSAPP_TOKEN")
        whatsapp_phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
        
        if not whatsapp_token or not whatsapp_phone_number_id:
            return func.HttpResponse(
                json.dumps({
                    "status": "error",
                    "message": "Missing WhatsApp credentials",
                    "token_present": bool(whatsapp_token),
                    "phone_id_present": bool(whatsapp_phone_number_id),
                    "timestamp": datetime.utcnow().isoformat()
                }),
                status_code=500,
                mimetype="application/json"
            )
        
        # Test token validity by getting phone number info
        url = f"https://graph.facebook.com/v22.0/{whatsapp_phone_number_id}"
        
        request = urllib.request.Request(
            url=url,
            headers={
                "Authorization": f"Bearer {whatsapp_token}",
                "Content-Type": "application/json"
            }
        )
        
        try:
            with urllib.request.urlopen(request, timeout=10) as response:
                response_status = response.getcode()
                response_text = response.read().decode('utf-8')
                
                if response_status == 200:
                    phone_info = json.loads(response_text)
                    
                    # Additional check: Test sending capabilities
                    messaging_test = test_messaging_endpoint(whatsapp_phone_number_id, whatsapp_token)
                    
                    return func.HttpResponse(
                        json.dumps({
                            "status": "success",
                            "message": "WhatsApp token is valid and active",
                            "token_valid": True,
                            "phone_number_id": whatsapp_phone_number_id,
                            "phone_info": phone_info,
                            "messaging_endpoint": messaging_test,
                            "timestamp": datetime.utcnow().isoformat(),
                            "token_length": len(whatsapp_token),
                            "api_version": "v22.0"
                        }),
                        status_code=200,
                        mimetype="application/json"
                    )
                else:
                    return func.HttpResponse(
                        json.dumps({
                            "status": "error",
                            "message": f"Token validation failed: HTTP {response_status}",
                            "token_valid": False,
                            "response": response_text,
                            "timestamp": datetime.utcnow().isoformat()
                        }),
                        status_code=response_status,
                        mimetype="application/json"
                    )
                    
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8') if e.fp else "No error details"
            error_data = {}
            
            try:
                error_data = json.loads(error_body)
            except:
                error_data = {"raw_error": error_body}
            
            return func.HttpResponse(
                json.dumps({
                    "status": "error",
                    "message": f"HTTP Error {e.code}: {e.reason}",
                    "token_valid": False,
                    "error_details": error_data,
                    "timestamp": datetime.utcnow().isoformat(),
                    "error_code": e.code
                }),
                status_code=400,
                mimetype="application/json"
            )
            
        except urllib.error.URLError as e:
            return func.HttpResponse(
                json.dumps({
                    "status": "error",
                    "message": f"Network Error: {str(e)}",
                    "token_valid": False,
                    "timestamp": datetime.utcnow().isoformat()
                }),
                status_code=500,
                mimetype="application/json"
            )
            
    except Exception as e:
        return func.HttpResponse(
            json.dumps({
                "status": "error",
                "message": f"Unexpected error: {str(e)}",
                "timestamp": datetime.utcnow().isoformat()
            }),
            status_code=500,
            mimetype="application/json"
        )

def test_messaging_endpoint(phone_number_id: str, token: str) -> dict:
    """Test if the messaging endpoint is accessible."""
    try:
        url = f"https://graph.facebook.com/v22.0/{phone_number_id}/messages"
        
        # Create a test request (we won't send it, just validate endpoint access)
        request = urllib.request.Request(
            url=url,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )
        
        # Try to access the endpoint with a HEAD-like approach
        # We'll use a minimal payload that won't actually send a message
        test_payload = json.dumps({
            "messaging_product": "whatsapp",
            "to": "test",  # Invalid recipient - won't send
            "type": "text",
            "text": {"body": "test"}
        }).encode('utf-8')
        
        request.data = test_payload
        
        try:
            urllib.request.urlopen(request, timeout=5)
            return {
                "endpoint_accessible": True,
                "message": "Messaging endpoint is accessible"
            }
        except urllib.error.HTTPError as e:
            # Even if we get an error, if it's not 401/403, the endpoint is accessible
            if e.code in [400, 404]:  # Bad request or not found means endpoint is accessible
                return {
                    "endpoint_accessible": True,
                    "message": f"Messaging endpoint accessible (HTTP {e.code} expected for test request)"
                }
            else:
                return {
                    "endpoint_accessible": False,
                    "message": f"Messaging endpoint error: HTTP {e.code}"
                }
        except Exception as e:
            return {
                "endpoint_accessible": False,
                "message": f"Messaging endpoint test failed: {str(e)}"
            }
            
    except Exception as e:
        return {
            "endpoint_accessible": False,
            "message": f"Messaging test error: {str(e)}"
        } 