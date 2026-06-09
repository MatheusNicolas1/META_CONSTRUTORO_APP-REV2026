"""Get the Resend API key from Supabase secrets via Management API."""
import urllib.request
import json
import os

# Read env
env = {}
with open('.env', 'r') as f:
    for line in f:
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            parts = line.split('=', 1)
            env[parts[0].strip()] = parts[1].strip().strip('"\'')

service_key = env.get('SUPABASE_SERVICE_ROLE_KEY', '')
supabase_url = env.get('SUPABASE_URL', '')
anon_key = env.get('VITE_SUPABASE_ANON_KEY', '')

print(f"Anon key: {len(anon_key)} chars - starts {anon_key[:10]}")
print(f"Service key: {len(service_key)} chars - starts {service_key[:10]}")

# Try to call a small Edge Function that reads the Resend API key
# Or try the Management API
# The Management API requires a PAT (sbp_xxx), not the service_role key

# Alternative: try to use the Vault API
# https://supabase.com/docs/reference/api/vault-get-secrets

proj_ref = "bgdvlhttyjeuprrfxgun"

# Option 1: Try vault API
url = f"https://api.supabase.com/v1/projects/{proj_ref}/secrets"
print(f"\nAttempting Management API...")
print(f"URL: {url}")

# For Management API we need a PAT token
# Let me check if it's stored in the environment
pat = os.environ.get('SUPABASE_ACCESS_TOKEN', '')

if pat:
    req = urllib.request.Request(url)
    req.add_header('Authorization', f'Bearer {pat}')
    req.add_header('Content-Type', 'application/json')
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read())
        print(f"Secrets: {json.dumps(data, indent=2)}")
    except Exception as e:
        print(f"Error: {e}")
else:
    print("No SUPABASE_ACCESS_TOKEN found in environment")
    
    # Option 2: Try via the Supabase Auth API (REST)
    # Create a function URL to call
    # We can call a minimal edge function that echoes a secret
    # But we don't have one deployed...
    
    # Option 3: Try to get it from the local Supabase config
    # supabase CLI caches settings locally
    config_file = 'supabase/config.toml'
    if os.path.exists(config_file):
        with open(config_file, 'r') as f:
            for line in f:
                if 'resend' in line.lower():
                    print(f"Config has resend ref: {line.strip()}")
    
    print("\nNota: A chave real está nos secrets do Supabase.")
    print("Para acessá-la, você precisa de um SUPABASE_ACCESS_TOKEN (sbp_xxx).")
    print("Ou, você pode fornecer manualmente a chave Resend.")
