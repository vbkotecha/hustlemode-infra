#!/usr/bin/env python3

from openai import AzureOpenAI
import os

# Configuration
os.environ['AZURE_OPENAI_ENDPOINT'] = 'https://hustlemode-ai.openai.azure.com/'
os.environ['AZURE_OPENAI_API_KEY'] = 'PLACEHOLDER_AZURE_OPENAI_KEY'

print("Testing Azure OpenAI deployment...")
print(f"Endpoint: {os.environ['AZURE_OPENAI_ENDPOINT']}")
print(f"Deployment: gpt-4o")

try:
    client = AzureOpenAI(
        api_key=os.environ['AZURE_OPENAI_API_KEY'],
        api_version='2024-02-01',
        azure_endpoint=os.environ['AZURE_OPENAI_ENDPOINT']
    )
    
    response = client.chat.completions.create(
        model='gpt-4o',
        messages=[{'role': 'user', 'content': 'Say hello'}],
        max_tokens=50
    )
    
    print("✅ SUCCESS!")
    print(f"Response: {response.choices[0].message.content}")
    
except Exception as e:
    print(f"❌ ERROR: {str(e)}") 