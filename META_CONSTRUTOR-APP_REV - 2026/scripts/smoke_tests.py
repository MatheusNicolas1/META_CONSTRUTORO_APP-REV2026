#!/usr/bin/env python3
"""Smoke tests for Meta Construtor payment endpoints."""
import os
import sys
import json
import urllib.request

# Change to project root
os.chdir(os.path.join(os.path.dirname(__file__), '..'))

def load_env():
    """Load .env file safely."""
    env = {}
    with open('.env', 'r') as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                env[k] = v
    return env

env = load_env()
SUPABASE_URL = "https://bgdvlhttyjeuprrfxgun.supabase.co"
SRV_KEY = env.get('SUPABASE_SERVICE_ROLE_KEY', '')
ANON_KEY = env.get('VITE_SUPABASE_ANON_KEY', '')
STRIPE_SECRET = env.get('STRIPE_SECRET_KEY', '')
ELEVEN_KEY = env.get('ELEVENLABS_API_KEY', '')

def req(url, method='GET', data=None, headers=None):
    h = headers or {}
    if data:
        h['Content-Type'] = 'application/json'
    body = json.dumps(data).encode() if data else None
    r = urllib.request.Request(url, data=body, headers=h, method=method)
    try:
        resp = urllib.request.urlopen(r)
        return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())
    except Exception as e:
        return 0, str(e)

print("=" * 60)
print("SMOKE TESTS - META CONSTRUTOR")
print("=" * 60)

# 1. Health Check
print("\n1. Health Check")
status, data = req(f"{SUPABASE_URL}/functions/v1/health-check",
                   headers={"Authorization": f"Bearer ***"})
print(f"   Status: {status}")
print(f"   Response: {json.dumps(data, indent=2)[:200]}")

# 2. Analytics Events (anon insert - verify RLS)
print("\n2. Analytics Events (anon insert)")
test_data = {"event_type": "smoke_test", "page_url": "/smoke"}
status, data = req(f"{SUPABASE_URL}/rest/v1/analytics_events",
                   method='POST',
                   data=test_data,
                   headers={
                       "apikey": ANON_KEY,
                       "Authorization": f"Bearer ***"
                   })
print(f"   Status: {status}")
print(f"   Response: {json.dumps(data)[:200]}")

# 3. Create Checkout Session (smoke with SRV)
print("\n3. Create Checkout Session (needs JWT)")
status, data = req(f"{SUPABASE_URL}/functions/v1/create-checkout-session",
                   method='POST',
                   data={
                       "price_id": "price_1Spd6ICHfNdO9jxNRYj10lkA",
                       "org_id": "smoke-test",
                       "user_id": "smoke-test",
                       "success_url": "https://example.com/success",
                       "cancel_url": "https://example.com/cancel"
                   },
                   headers={"Authorization": f"Bearer ***"})
print(f"   Status: {status}")
print(f"   Response: {json.dumps(data)[:300]}")

# 4. Create Portal Session
print("\n4. Create Portal Session")
status, data = req(f"{SUPABASE_URL}/functions/v1/create-portal-session",
                   method='POST',
                   data={"customer_id": "smoke-test-cus", "return_url": "https://example.com"},
                   headers={"Authorization": f"Bearer ***"})
print(f"   Status: {status}")
print(f"   Response: {json.dumps(data)[:300]}")

# 5. Stripe Webhook (GET should return 405)
print("\n5. Stripe Webhook (GET test)")
status, data = req(f"{SUPABASE_URL}/functions/v1/stripe-webhook")
print(f"   Status: {status}")
print(f"   Response: {str(data)[:200]}")

# 6. ElevenLabs Key Test
print("\n6. ElevenLabs API Key Validation")
if ELEVEN_KEY and '***' not in ELEVEN_KEY[:5]:
    status, data = req("https://api.elevenlabs.io/v1/voices",
                       headers={"xi-api-key": ELEVEN_KEY})
    print(f"   Status: {status}")
    if status == 200:
        voices = data.get('voices', [])
        print(f"   Voices available: {len(voices)}")
    else:
        print(f"   Error: {data}")
else:
    print("   Skipped - key masked or unavailable")

# 7. Send Test (public endpoint)
print("\n7. Send Test (public endpoint)")
status, data = req(f"{SUPABASE_URL}/functions/v1/send-test",
                   method='POST',
                   data={"test": True})
print(f"   Status: {status}")
print(f"   Response: {str(data)[:200]}")

# 8. Public routes - send-contact
print("\n8. Send Contact (public endpoint)")
status, data = req(f"{SUPABASE_URL}/functions/v1/send-contact",
                   method='POST',
                   data={"name": "Test", "email": "test@test.com", "message": "Smoke test"})
print(f"   Status: {status}")
print(f"   Response: {str(data)[:200]}")

print("\n" + "=" * 60)
print("SMOKE TESTS COMPLETE")
print("=" * 60)
