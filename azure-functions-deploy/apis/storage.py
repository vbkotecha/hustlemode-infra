import json
import logging
from datetime import datetime
import azure.functions as func

# Create blueprint for storage endpoints
storage_bp = func.Blueprint()

@storage_bp.function_name("storage_metrics")
@storage_bp.route(route="storage", methods=["GET"])
def get_storage_metrics(req: func.HttpRequest) -> func.HttpResponse:
    """Get conversation storage metrics and growth projections."""
    
    try:
        import os
        import pg8000.native
        
        logging.info("🔍 Testing direct PostgreSQL connection...")
        
        # Connect directly to PostgreSQL
        host = os.environ.get('DATABASE_HOST')
        database = os.environ.get('DATABASE_NAME') 
        user = os.environ.get('DATABASE_USER')
        password = os.environ.get('DATABASE_PASSWORD')
        port = int(os.environ.get('DATABASE_PORT', 5432))
        
        logging.info(f"📊 Connecting to: {host}:{port}/{database} as {user}")
        
        conn = pg8000.native.Connection(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password,
            ssl_context=True
        )
        
        # Simple test query
        result = conn.run("SELECT COUNT(*) as total_messages FROM conversation_history")
        total_messages = result[0][0] if result else 0
        
        # Get table size
        size_result = conn.run("SELECT pg_size_pretty(pg_total_relation_size('conversation_history')) as table_size")
        table_size = size_result[0][0] if size_result else "Unknown"
        
        # Get users count
        users_result = conn.run("SELECT COUNT(DISTINCT user_id) as unique_users FROM conversation_history")
        unique_users = users_result[0][0] if users_result else 0
        
        conn.close()
        
        # Create response
        metrics = {
            "table_size": table_size,
            "total_messages": total_messages,
            "unique_users": unique_users,
            "recommendation": "Current storage levels are optimal",
            "priority": "low",
            "current_phase": "Phase 1 (0-5K Users)",
            "phase_status": "optimal",
            "success": True,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "source": "Direct PostgreSQL connection"
        }
        
        return func.HttpResponse(
            json.dumps(metrics, indent=2),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"Storage metrics error: {str(e)}")
        
        # Fallback response with error info
        fallback_metrics = {
            "success": False,
            "error": f"Database unavailable: {str(e)}",
            "fallback_data": {
                "message": "Using fallback metrics - database connection failed",
                "table_size": "Unknown",
                "total_messages": 0,
                "unique_users": 0,
                "recent_messages_30d": 0,
                "retention_needed": False,
                "recommendation": "Check database connection",
                "priority": "high"
            },
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "source": "fallback_error_handler"
        }
        
        return func.HttpResponse(
            json.dumps(fallback_metrics, indent=2),
            status_code=500,
            mimetype="application/json"
        ) 