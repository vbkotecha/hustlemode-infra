#!/bin/bash
# Startup script for HustleMode.ai API

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Start the API
cd src/api && uvicorn main:app --host 0.0.0.0 --port ${API_PORT:-8000} 