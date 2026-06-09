#!/usr/bin/env python3
"""
Enriquecer sites de construtoras - Batch 2 (linhas 120-239).
Acessa cada site via HTTP direto, extrai email e telefone.
Salva incrementalmente a cada 5 sites.
"""
import json, re, time, urllib.request, urllib.error, ssl, sys, os

WORKDIR = os.path.dirname(os.path.abspath(__file__)) or '.'
INPUT_FILE = os.path.join(WORKDIR, 'sites_para_enriquecer.txt')
OUTPUT_FILE = os.path.join(WORKDIR, 'enriquecidos_batch2.json')
STATE_FILE = os.path.join(WORKDIR, 'enriquecidos_batch2_progress.json')

def log(msg):
    sys.stdout.write(str(msg) + '\n')
    sys.stdout.flush()

def extract_emails(text):
    if not text: return []
    emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    seen = set()
    result = []
    for e in emails:
        e = e.lower()
        if e not in seen:
            seen.add(e)
            result.append(e)
    return result[:5]

def extract_phones(text):
    if not text: return []
    phones = []
    seen = set()
    for pattern in [r'(?:\+55\s?)?\(?\d{2}\)?\s*9?\d{4}-?\d{4}',
                     r'\(\d{2}\)\s*\d{4,5}-\d{4}',
                     r'\d{2}\s*\d{4,5}-\d{4}']:
        for m in re.findall(pattern, text):
            digits = re.sub(r'\D', '', m)
            if 10 <= len(digits) <= 13 and digits not in seen:
                seen.add(digits)
                phones.append(m.strip())
    return phones[:5]

def fetch_url(url, timeout=8):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,*/*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
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
    log(f"  [{url}]")
    if not url.startswith('http'):
        url = 'https://' + url
    html, error = fetch_url(url)
    if error:
        http_url = url.replace('https://', 'http://')
        html, error = fetch_url(http_url)
    if error:
        return {"site": url, "nome": extract_domain_name(url), "estado": "", "cidade": "",
                "emails_encontrados": [], "telefones_encontrados": [], "status": "erro", "erro": str(error)[:100]}
    
    emails = extract_emails(html)
    phones = extract_phones(html)
    
    # Also check mailto: links
    mailto_emails = re.findall(r'href=[\'"]mailto:([^\'"]+)[\'"]', html, re.IGNORECASE)
    for e in mailto_emails:
        e = e.lower().strip()
        if e not in emails:
            emails.append(e)
    emails = emails[:5]
    
    if not emails and not phones:
        base = url.rstrip('/')
        for path in ['/contato', '/fale-conosco', '/contact', '/faleconosco', '/fale-conosco.php']:
            try:
                c_html, c_err = fetch_url(base + path, timeout=5)
                if not c_err and c_html:
                    e2 = extract_emails(c_html)
                    p2 = extract_phones(c_html)
                    emails.extend(e2)
                    phones.extend(p2)
                    if emails or phones:
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
    from urllib.parse import urlparse
    
    log("=== Enriquecendo Batch 2 (linhas 120-239) ===")
    log(f"Input: {INPUT_FILE}")
    log(f"Output: {OUTPUT_FILE}")
    log(f"Workdir: {WORKDIR}")
    
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        log(f"ERROR reading input: {e}")
        return
    
    log(f"Total lines: {len(lines)}")
    
    site_urls = [line.strip() for line in lines[119:239] if line.strip()]
    log(f"Raw sites in batch: {len(site_urls)}")
    
    seen = set()
    unique_urls = []
    for s in site_urls:
        if s not in seen:
            seen.add(s)
            unique_urls.append(s)
    
    log(f"Unique sites: {len(unique_urls)}")
    
    # Check for progress file
    results = []
    processed_urls = set()
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, 'r', encoding='utf-8') as f:
                state = json.load(f)
            results = state.get('results', [])
            processed_urls = {r['site'] for r in results}
            log(f"Resuming: {len(results)} already done")
        except:
            pass
    
    success_count = sum(1 for r in results if r.get('status') == 'ok')
    error_count = sum(1 for r in results if r.get('status') != 'ok')
    
    remaining = [u for u in unique_urls if u not in processed_urls]
    log(f"Remaining: {len(remaining)}")
    
    idx = len(results)
    for i, url in enumerate(remaining, 1):
        idx += 1
        log(f"\n[{idx}/{len(unique_urls)}]")
        result = process_site(url)
        results.append(result)
        if result['status'] == 'ok':
            success_count += 1
        else:
            error_count += 1
        
        # Save incremental progress every 5 sites
        if i % 5 == 0 or i == len(remaining):
            with open(STATE_FILE, 'w', encoding='utf-8') as f:
                json.dump({'results': results}, f, ensure_ascii=False)
            with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
                json.dump(results, f, ensure_ascii=False, indent=2)
            log(f"  -> Saved progress: {len(results)}/{len(unique_urls)}")
        
        time.sleep(0.5)
    
    # Final save
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    if os.path.exists(STATE_FILE):
        os.remove(STATE_FILE)
    
    log(f"\n=== Resumo ===")
    log(f"Total: {len(unique_urls)} | Sucesso: {success_count} | Erro: {error_count}")
    log(f"Arquivo: {OUTPUT_FILE}")

if __name__ == '__main__':
    main()
