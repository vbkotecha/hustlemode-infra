"""Tests for the HustleMode.ai API"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../src'))

from api.main import app

client = TestClient(app)


def test_root():
    """Test the root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HustleMode.ai WhatsApp Bot is running"
    assert data["message"] == "STAY HARD"
    assert "version" in data


def test_webhook_verify():
    """Test WhatsApp webhook verification"""
    verify_token = "fa22d4e7-cba4-48cf-9b36-af6190bf9c67"
    challenge = "test_challenge_123"
    
    response = client.get(
        "/webhook/whatsapp",
        params={
            "hub.mode": "subscribe",
            "hub.verify_token": verify_token,
            "hub.challenge": challenge
        }
    )
    
    assert response.status_code == 200
    assert response.text == challenge


def test_webhook_verify_invalid_token():
    """Test WhatsApp webhook verification with invalid token"""
    response = client.get(
        "/webhook/whatsapp",
        params={
            "hub.mode": "subscribe",
            "hub.verify_token": "invalid_token",
            "hub.challenge": "test_challenge"
        }
    )
    
    assert response.status_code == 403
    assert response.text == "Verification failed"