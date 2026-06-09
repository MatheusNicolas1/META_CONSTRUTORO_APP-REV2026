#!/usr/bin/env python3
"""
Enriquecer sites de construtoras - Batch 2 (linhas 120-239).
Acessa cada site via HTTP direto, extrai email e telefone com regex mais precisos.
"""
import json, re, time, urllib.request, urllib.error, ssl, sys, os
from urllib.parse import urlparse

WORKDIR = os.path.dirname(os.path.abspath(__file__)) or '.'
INPUT_FILE = os.path.join(WORKDIR, 'sites_para_enriquecer.txt')
OUTPUT_FILE = os.path.join(WORKDIR, 'enriquecidos_batch2.json')
PROGRESS_FILE = os.path.join(WORKDIR, 'enriquecidos_batch2_progress.json')

def log(msg):
    sys.stdout.write(str(msg) + '\n')
    sys.stdout.flush()

def extract_emails(text):
    """
    Extract REAL email addresses (not Wix/Sentry garbage).
    Uses stricter validation.
    """
    if not text: return []
    # Standard email regex but we'll filter aggressively
    emails = re.findall(r'[a-zA-Z0-9._%+\-]{2,}@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}', text)
    
    # Blacklist domains that are NOT real contact emails
    BLACKLIST_DOMAINS = [
        'sentry', 'wixpress', 'sentry-next', 'sentry.io',
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
        'icloud.com', 'live.com', 'bol.com.br', 'uol.com.br',
        'terra.com.br', 'ig.com.br', 'example.com', 'example.org',
        'domain.com', 'yoursite.com', 'email.com', 'mail.com',
        'localhost', 'local', 'test.com', 'testing.com',
        'wordpress.com', 'gravatar.com', 'facebook.com',
        'twitter.com', 'instagram.com', 'linkedin.com',
        'google.com', 'googlemail.com',
        'microsoft.com', 'apple.com',
        'noreply', 'no-reply', 'donotreply',
    ]
    
    seen = set()
    result = []
    for e in emails:
        e_lower = e.lower().strip()
        # Skip if too short
        if len(e_lower) < 6: continue
        # Skip if contains blacklisted domain
        skip = False
        for b in BLACKLIST_DOMAINS:
            if b in e_lower:
                skip = True
                break
        if skip: continue
        # Skip if it looks like a hash (hex strings or UUID-like)
        local_part = e_lower.split('@')[0]
        if re.match(r'^[a-f0-9]{20,}$', local_part): continue
        if re.match(r'^[a-f0-9]{8}-[a-f0-9]{4}-', local_part): continue
        
        if e_lower not in seen:
            seen.add(e_lower)
            result.append(e_lower)
    
    return result[:5]

def extract_phones(text):
    """
    Extract Brazilian phone numbers with careful validation.
    Must have proper Brazilian formatting (XX) XXXX-XXXX or similar.
    """
    if not text: return []
    
    phones = []
    seen = set()
    
    # Pattern: (XX) XXXX-XXXX or (XX) XXXXX-XXXX or XX XXXX-XXXX or +55 XX XXXX-XXXX
    # Very specific to avoid random numbers
    patterns = [
        # (11) 99999-9999 or (11) 9999-9999
        r'\(\d{2}\)\s*\d{4,5}-\d{4}',
        # 11 99999-9999 or 11 9999-9999
        r'(?<![/\d])\d{2}\s*\d{4,5}-\d{4}(?![/\d-])',
        # +55 (11) 99999-9999
        r'\+\s*55\s*\(\d{2}\)\s*\d{4,5}-\d{4}',
        # 11999999999 (11 digits, mobile)
        r'(?<![\d/])(1[1-9][1-9]9\d{7})(?![\d/])',
    ]
    
    for pattern in patterns:
        for m in re.findall(pattern, text):
            # Clean and validate
            digits = re.sub(r'\D', '', m)
            
            # Brazilian phone validation
            # Must be 10 (landline) or 11 (mobile) digits
            if len(digits) not in [10, 11]: continue
            # Must start with valid Brazilian area code (11-99)
            if len(digits) >= 2:
                ddd = int(digits[:2])
                if ddd < 11 or ddd > 99: continue
            # Must have valid mobile prefix (9) if 11 digits
            if len(digits) == 11 and digits[2] != '9': continue
            
            if digits not in seen:
                seen.add(digits)
                # Format nicely
                if len(digits) == 11:
                    formatted = f"({digits[:2]}) {digits[2]} {digits[3:7]}-{digits[7:]}"
                else:
                    formatted = f"({digits[:2]}) {digits[2:6]}-{digits[6:]}"
                phones.append(formatted)
    
    return phones[:5]

def fetch_url(url, timeout=8):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    })
    try:
        resp = urllib.request.urlopen(req, timeout=timeout, context=ctx)
        return resp.read().decode('utf-8', errors='replace'), None
    except Exception as e:
        return None, str(e)

def extract_domain_name(url):
    domain = urlparse(url).netloc.replace('www.', '')
    name = re.sub(r'\..+$', '', domain)
    return name.replace('-', ' ').replace('_', ' ').title().strip()

def process_site(url):
    url = url.strip()
    
    if not url.startswith('http'):
        url = 'https://' + url
    
    html, error = fetch_url(url)
    if error:
        http_url = url.replace('https://', 'http://')
        html, error = fetch_url(http_url)
    
    if error:
        log(f"  [{url}] ERRO: {error[:80]}")
        return {"site": url, "nome": extract_domain_name(url), "estado": "", "cidade": "",
                "emails_encontrados": [], "telefones_encontrados": [], "status": "erro", "erro": str(error)[:100]}
    
    log(f"  [{url}] OK ({len(html)} bytes)")
    
    emails = extract_emails(html)
    phones = extract_phones(html)
    
    # Also check mailto: links
    mailto_emails = re.findall(r'href=[\'"]mailto:([^\'"]+)[\'"]', html, re.IGNORECASE)
    for e in mailto_emails:
        e = e.lower().strip()
        if '@' in e and e not in emails and all(b not in e for b in ['sentry', 'wixpress', 'example.com']):
            if len(e.split('@')[0]) >= 2:
                emails.append(e)
    emails = emails[:5]
    
    if not emails and not phones:
        # Try contact page
        base = url.rstrip('/')
        contact_paths = ['/contato', '/fale-conosco', '/contact', '/faleconosco']
        for path in contact_paths:
            try:
                c_html, c_err = fetch_url(base + path, timeout=5)
                if not c_err and c_html:
                    e2 = extract_emails(c_html)
                    p2 = extract_phones(c_html)
                    emails.extend(e2)
                    phones.extend(p2)
                    if emails or phones:
                        log(f"    -> Contato encontrado em {path}")
                        break
            except:
                pass
            time.sleep(0.2)
    
    if not emails and not phones:
        return {"site": url, "nome": extract_domain_name(url), "estado": "", "cidade": "",
                "emails_encontrados": [], "telefones_encontrados": [], "status": "erro", "erro": "sem contato"}
    
    return {"site": url, "nome": extract_domain_name(url), "estado": "", "cidade": "",
            "emails_encontrados": list(dict.fromkeys(emails)),
            "telefones_encontrados": list(dict.fromkeys(phones)), "status": "ok"}

def main():
    log("=== Enriquecendo Batch 2 (linhas 120-239) ===")
    log(f"Input: {INPUT_FILE}")
    
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        log(f"FATAL: Cannot read input: {e}")
        return
    
    log(f"Total lines: {len(lines)}")
    
    # Lines 120-239 (1-indexed) = indices 119-238
    site_urls = [line.strip() for line in lines[119:239] if line.strip()]
    log(f"Sites in batch (raw): {len(site_urls)}")
    
    # Deduplicate preserving order
    seen = set()
    unique_urls = []
    for s in site_urls:
        if s not in seen:
            seen.add(s)
            unique_urls.append(s)
    
    log(f"Unique sites: {len(unique_urls)}")
    
    # Check for previous progress
    results = []
    processed_urls = set()
    if os.path.exists(PROGRESS_FILE):
        try:
            with open(PROGRESS_FILE, 'r', encoding='utf-8') as f:
                state = json.load(f)
            results = state.get('results', [])
            processed_urls = {r['site'] for r in results}
            log(f"Previous progress: {len(results)} sites done, resuming...")
        except:
            log("Could not load progress file, starting fresh")
    
    success_count = sum(1 for r in results if r.get('status') == 'ok')
    error_count = sum(1 for r in results if r.get('status') != 'ok')
    
    remaining = [u for u in unique_urls if u not in processed_urls]
    log(f"Remaining to process: {len(remaining)}")
    
    if not remaining:
        log("All sites already processed!")
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        log(f"Saved: {OUTPUT_FILE}")
        return
    
    idx = len(results)
    for i, url in enumerate(remaining, 1):
        idx += 1
        log(f"\n[{idx}/{len(unique_urls)}] {url}")
        result = process_site(url)
        results.append(result)
        
        if result['status'] == 'ok':
            success_count += 1
            if result['emails_encontrados']:
                log(f"  -> Emails: {result['emails_encontrados']}")
            if result['telefones_encontrados']:
                log(f"  -> Telefones: {result['telefones_encontrados']}")
        else:
            error_count += 1
            log(f"  -> {result.get('erro', 'erro')}")
        
        # Save progress every 5 sites
        if i % 5 == 0 or i == len(remaining):
            with open(PROGRESS_FILE, 'w', encoding='utf-8') as f:
                json.dump({'results': results}, f, ensure_ascii=False)
            with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
                json.dump(results, f, ensure_ascii=False, indent=2)
            log(f"  [SAVED: {len(results)}/{len(unique_urls)}]")
        
        time.sleep(0.5)
    
    # Clean up progress file
    if os.path.exists(PROGRESS_FILE):
        os.remove(PROGRESS_FILE)
    
    log(f"\n{'='*40}")
    log(f"RESUMO FINAL")
    log(f"{'='*40}")
    log(f"Total únicos: {len(unique_urls)}")
    log(f"Sucesso (contato encontrado): {success_count}")
    log(f"Erro (sem contato): {error_count}")
    log(f"Arquivo: {OUTPUT_FILE}")

if __name__ == '__main__':
    main()
