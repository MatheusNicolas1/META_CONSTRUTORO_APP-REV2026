#!/usr/bin/env python3
"""Gera os comandos para criar os 26 cronjobs de envio de email.

Uso:
  python campanha-26-dias/gerar-cronjobs.py

Isso gera uma lista de comandos que você copia e executa no Hermes.
Cada cronjob envia para matheusnicolas.org@gmail.com (teste).

Quando o DNS do Resend estiver configurado, os cronjobs precisam ser
recriados com --to alterado ou substituídos por envio em lote.
"""

import os
from datetime import datetime, timedelta

# Start from tomorrow at 09:00 BRT
start = datetime.now()
if start.hour >= 9:
    start = start.replace(hour=9, minute=0, second=0, microsecond=0) + timedelta(days=1)
else:
    start = start.replace(hour=9, minute=0, second=0, microsecond=0)

TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)))

# Read template names
templates = []
for i in range(1, 27):
    fname = f"dia-{i:02d}"
    files = [f for f in os.listdir(TEMPLATES_DIR) if f.startswith(fname) and f.endswith('.html')]
    if files:
        # Extract topic from filename
        parts = files[0].replace('.html', '').split('-')
        tone_map = {'tecnico': '[Técnico]', 'humor': '[Humor]', 'reportagem': '[Reportagem]',
                    'usabilidade': '[Usabilidade]', 'emocional': '[Emocional]'}
        tone = ''
        topic_parts = []
        for p in parts[2:]:
            if p in tone_map:
                tone = tone_map[p]
            else:
                topic_parts.append(p.capitalize())
        topic = ' '.join(topic_parts)
        templates.append({
            'day': i,
            'file': files[0],
            'date': start + timedelta(days=i-1),
            'topic': topic,
            'tone': tone
        })

print("=" * 60)
print("📅 CAMPANHA META CONSTRUTOR — 26 DIAS")
print(f"Início: {templates[0]['date'].strftime('%d/%m/%Y')}")
print(f"Término: {templates[-1]['date'].strftime('%d/%m/%Y')}")
print(f"Destino: matheusnicolas.org@gmail.com (teste)")
print("=" * 60)

print()
print("Para criar os cronjobs manualmente no Hermes, use os comandos abaixo:")
print()

for t in templates:
    date_str = t['date'].strftime('%Y-%m-%dT09:00:00')
    template_path = os.path.join(TEMPLATES_DIR, t['file']).replace('\\', '/')
    print(f"# Dia {t['day']:2d}/26 — {t['topic']} {t['tone']} — {t['date'].strftime('%d/%m')}")
    print(f'cronjob action=create schedule={date_str} name="camp-dia-{t["day"]:02d}" prompt="Enviar email da campanha Meta Construtor dia {t["day"]}/26"')
    print()

print("=== OU, via Python diretamente ===")
print(f"python {__file__}")
print()

# Also output JSON for programmatic use
import json
plan = []
for t in templates:
    plan.append({
        'day': t['day'],
        'date': t['date'].isoformat(),
        'topic': t['topic'],
        'tone': t['tone'],
        'template': t['file'],
        'subject': f"[Meta Construtor - Dia {t['day']}/26] {t['topic']} {t['tone']}".strip()
    })
print(f"JSON: {json.dumps(plan, ensure_ascii=False, indent=2)}")
