#!/usr/bin/env python3
"""
Enrich construtoras data by scraping individual websites for email and phone.
"""
import re
import json
import urllib.request
import urllib.error
import ssl
import time
import sys
import os

# Load the data
script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, '.firecrawl', 'prospeccao-inicial', 'construtorasbrasil.json')

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

EMAIL_RE = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
PHONE_RE = re.compile(r'(?:\(\d{2}\)\s*)?\d{4,5}-?\d{4}')
WHATSAPP_RE = re.compile(r'(?:whatsapp|whats)[^\d]*(\d{10,13})', re.IGNORECASE)

def fetch_site(url, max_retries=2):
    """Fetch a page and extract emails/phones"""
    emails = set()
    phones = set()
    
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(
                url,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml',
                    'Accept-Language': 'pt-BR,pt;q=0.9',
                    'Connection': 'keep-alive',
                },
                timeout=15
            )
            with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
                raw = resp.read()
            
            try:
                html = raw.decode('utf-8')
            except:
                try:
                    html = raw.decode('latin-1')
                except:
                    html = raw.decode('utf-8', errors='replace')
            
            # Find emails
            found_emails = EMAIL_RE.findall(html)
            for e in found_emails:
                # Filter out image filenames and common false positives
                lower = e.lower()
                if not any(x in lower for x in ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.css', '.js',
                                                 '.webp', '@example.com', '@domain.com', 'user@', 'admin@local']):
                    if not e.endswith(('.png', '.jpg', '.jpeg', '.gif', '.svg')):
                        emails.add(e.lower())
            
            # Find phones
            # More specific Brazilian phone patterns
            phone_patterns = [
                r'\(?\d{2}\)?[\s.-]?\d{4,5}[\s.-]?\d{4}',
                r'(?:tel|telefone|fone|phone|contato)[:\s]*\(?\d{2}\)?[\s.-]?\d{4,5}[\s.-]?\d{4}',
            ]
            for pat in phone_patterns:
                found = re.findall(pat, html, re.IGNORECASE)
                for p in found:
                    phones.add(p.strip())
            
            return emails, phones, True
            
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(2)
                continue
            return emails, phones, False
    
    return emails, phones, False

def try_contact_pages(base_url, max_pages=2):
    """Try to find /contato or /fale-conosco pages"""
    common_paths = ['/contato', '/fale-conosco', '/contact', '/quem-somos', '/sobre']
    all_emails = set()
    all_phones = set()
    
    for path in common_paths[:max_pages]:
        url = base_url.rstrip('/') + path
        emails, phones, ok = fetch_site(url)
        all_emails.update(emails)
        all_phones.update(phones)
        if ok and (emails or phones):
            break
        time.sleep(0.5)
    
    return all_emails, all_phones

def main():
    enriched = 0
    total = len(data['construtoras'])
    
    for i, construtora in enumerate(data['construtoras']):
        site = construtora.get('site', '').strip()
        if not site:
            construtora['email'] = ''
            construtora['telefone'] = ''
            continue
        
        # Try the main page first
        emails, phones, ok = fetch_site(site)
        
        # If no emails found, try contact pages
        if not emails:
            contact_emails, contact_phones = try_contact_pages(site)
            emails.update(contact_emails)
            phones.update(contact_phones)
        
        construtora['email'] = ', '.join(sorted(emails)) if emails else ''
        construtora['telefone'] = ', '.join(sorted(phones)) if phones else ''
        
        if construtora['email'] or construtora['telefone']:
            enriched += 1
        
        # Progress
        if (i + 1) % 20 == 0 or i == 0:
            progress = f"\r[{i+1}/{total}] Enriched: {enriched} | Last: {construtora['nome'][:30]:30s} email={construtoras['email'][:30] if construtora['email'] else 'N/A'}"
            print(progress, end='', flush=True)
        
        time.sleep(1)  # Be respectful - 1 req per second
    
    print(f"\n\nDone! {enriched}/{total} construtoras with email or phone found.")
    
    # Save enriched data
    output = {
        'fonte': data['fonte'],
        'total_construtoras': total,
        'com_email_ou_telefone': enriched,
        'construtoras': data['construtoras']
    }
    
    enriched_path = os.path.join(script_dir, '.firecrawl', 'prospeccao-inicial', 'construtorasbrasil_enriquecido.json')
    with open(enriched_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"Saved to {enriched_path}")
    
    # Summary stats
    with_email = sum(1 for c in data['construtoras'] if c.get('email'))
    with_phone = sum(1 for c in data['construtoras'] if c.get('telefone'))
    print(f"  With email: {with_email}")
    print(f"  With phone: {with_phone}")

if __name__ == '__main__':
    main()
