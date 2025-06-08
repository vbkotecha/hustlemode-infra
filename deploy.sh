#!/bin/bash

# Exit on any error
set -e

echo "Starting deployment..."

# Install Python dependencies
echo "Installing Python dependencies..."
python -m pip install --upgrade pip
pip install -r requirements.txt

echo "Deployment complete!" 