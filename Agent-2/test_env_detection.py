#!/usr/bin/env python3
"""
Test script to verify .env file detection and API key loading
"""
import os
import sys
sys.path.append('/Users/aliahmed/Downloads/Upwork/Agents/Agent-2')

from app.core.config import find_env_file, settings

def test_env_detection():
    print("🔍 Testing .env file detection...")
    print("=" * 50)
    
    # Test .env file detection
    env_file = find_env_file()
    if env_file:
        print(f"✅ .env file found at: {env_file}")
        print(f"📁 File exists: {os.path.exists(env_file)}")
        print(f"📁 File size: {os.path.getsize(env_file)} bytes")
    else:
        print("❌ .env file not found!")
        return False
    
    print("\n🔑 Testing API key detection...")
    print("=" * 50)
    
    # Test key API keys
    api_keys = {
        'APOLLO_API_KEY': settings.APOLLO_API_KEY,
        'CRUNCHBASE_API_KEY': settings.CRUNCHBASE_API_KEY,
        'OPENAI_API_KEY': settings.OPENAI_API_KEY,
        'HUBSPOT_API_KEY': settings.HUBSPOT_API_KEY,
        'LINKEDIN_CLIENT_ID': settings.LINKEDIN_CLIENT_ID,
        'GMAIL_SMTP_API_KEY': settings.GMAIL_SMTP_API_KEY,
    }
    
    for key, value in api_keys.items():
        if value:
            print(f"✅ {key}: {value[:8]}...{value[-4:] if len(value) > 12 else '***'}")
        else:
            print(f"❌ {key}: Not configured")
    
    print("\n📊 Summary...")
    print("=" * 50)
    configured_keys = sum(1 for v in api_keys.values() if v)
    total_keys = len(api_keys)
    print(f"✅ Configured: {configured_keys}/{total_keys} API keys")
    
    return configured_keys > 0

if __name__ == "__main__":
    success = test_env_detection()
    sys.exit(0 if success else 1)
