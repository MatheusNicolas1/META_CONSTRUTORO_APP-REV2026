#!/usr/bin/env python3
"""Envia um dia específico da campanha. Chamado pelos cronjobs."""
import sys, os, json

BASE = r"C:/Users/nicol/OneDrive/Documentos/META CONSTRUTOR/META CONSTRUTOR - APP/META_CONSTRUTOR-APP_REV - 2026/campanha-26-dias"
DAY = int(sys.argv[1]) if len(sys.argv) > 1 else 0
TO = sys.argv[2] if len(sys.argv) > 2 else "matheusnicolas.org@gmail.com"

# Read the .env for API key
env_path = os.path.join(os.path.dirname(os.path.dirname(BASE)), '.env')
api_key = None
from_email = "Meta Construtor <onboarding@resend.dev>"
if os.path.exists(env_path):
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line.startswith('RESEND_API_KEY='):
                val = line.split('=', 1)[1].strip().strip('"\'')
                if val and val != '***':
                    api_key = val

if not api_key:
    print("CRITICAL: RESEND_API_KEY not found in .env")
    sys.exit(1)

# Find the template
import glob
pattern = os.path.join(BASE, f"dia-{DAY:02d}*.html")
matched = glob.glob(pattern)
if not matched:
    print(f"CRITICAL: Template for day {DAY} not found")
    sys.exit(1)

with open(matched[0], 'r', encoding='utf-8') as f:
    html = f.read()

# Build subject
fname = os.path.basename(matched[0])
parts = fname.replace('.html','').split('-')
tone_map = { 'tecnico': '[Técnico]', 'humor': '[Humor]', 'reportagem': '[Reportagem]',
             'usabilidade': '[Usabilidade]', 'emocional': '[Emocional]' }
tone = ''
topic_parts = []
for p in parts[2:]:
    if p in tone_map:
        tone = tone_map[p]
    else:
        topic_parts.append(p.capitalize())
topic = ' '.join(topic_parts)
subject = f"[Meta Construtor - Dia {DAY}/26] {topic} {tone}".strip()

# Send via Resend
import urllib.request, urllib.error

payload = json.dumps({
    'from': from_email,
    'to': [TO],
    'subject': subject,
    'html': html,
    'tags': [{'name': 'campaign', 'value': 'lancamento_2026'}]
}).encode('utf-8')

req = urllib.request.Request(
    'https://api.resend.com/emails',
    data=payload,
    headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {api_key}'},
    method='POST'
)

try:
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read())
    print(f"✅ Dia {DAY}/26 enviado! ID: {data.get('id')}")
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f"❌ Dia {DAY}/26 ERRO HTTP {e.code}: {body}")
    sys.exit(1)
