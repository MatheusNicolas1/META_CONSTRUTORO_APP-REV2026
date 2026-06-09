#!/usr/bin/env python3
"""
Enriquecer sites de construtoras - Batch 2 (linhas 120-239 do arquivo original)
Acessa cada site via HTTP, extrai email e telefone via regex.
"""
import json
import re
import time
import urllib.request
import urllib.error
import ssl
from urllib.parse import urlparse

# Input / Output paths
INPUT_FILE = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\.firecrawl\prospeccao-inicial\sites_para_enriquecer.txt"
OUTPUT_FILE = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\.firecrawl\prospeccao-inicial\enriquecidos_batch2.json"

def extract_emails(text):
    """Extract email addresses from text."""
    if not text:
        return []
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    emails = re.findall(email_pattern, text)
    filtered = []
    seen = set()
    for e in emails:
        e_lower = e.lower()
        if e_lower not in seen:
            seen.add(e_lower)
            filtered.append(e_lower)
    return filtered[:5]

def extract_phones(text):
    """Extract Brazilian phone numbers from text."""
    if not text:
        return []
    phone_patterns = [
        r'\(?\d{2}\)?\s*9?\d{4}-?\d{4}',
        r'\+\s*55\s*\(?\d{2}\)?\s*9?\d{4}-?\d{4}',
    ]
    phones = []
    seen = set()
    for pattern in phone_patterns:
        matches = re.findall(pattern, text)
        for m in matches:
            digits = re.sub(r'\D', '', m)
            if len(digits) >= 10 and len(digits) <= 13:
                if digits not in seen:
                    seen.add(digits)
                    phones.append(m.strip())
    return phones[:5]

def extract_from_html(html, url):
    """Extract emails and phones from HTML content."""
    if not html:
        return [], []
    
    mailto_emails = re.findall(r'href=[\'"]mailto:([^\'"]+)[\'"]', html, re.IGNORECASE)
    text_emails = extract_emails(html)
    phones = extract_phones(html)
    
    all_emails = list(dict.fromkeys(mailto_emails + text_emails))
    
    return all_emails[:5], phones[:5]

def fetch_url(url, timeout=10):
    """Fetch a URL and return the HTML content."""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    req = urllib.request.Request(
        url,
        headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        }
    )
    try:
        resp = urllib.request.urlopen(req, timeout=timeout, context=ctx)
        html = resp.read().decode('utf-8', errors='replace')
        return html, None
    except Exception as e:
        return None, str(e)

def extract_domain_name(url):
    """Extract a readable company name from the domain."""
    parsed = urlparse(url)
    domain = parsed.netloc or parsed.path
    domain = domain.replace('www.', '')
    name = re.sub(r'\..+$', '', domain)
    name = name.replace('-', ' ').replace('_', ' ').title()
    return name.strip()

def process_site(url):
    """Process a single site: fetch, extract, return result dict."""
    url = url.strip()
    print(f"  Processing: {url}", flush=True)
    
    if not url.startswith('http'):
        url = 'https://' + url
    
    # Try HTTPS first, then HTTP
    html, error = fetch_url(url)
    if error:
        http_url = url.replace('https://', 'http://')
        html, error = fetch_url(http_url)
    
    if error:
        return {
            "site": url,
            "nome": extract_domain_name(url),
            "estado": "",
            "cidade": "",
            "emails_encontrados": [],
            "telefones_encontrados": [],
            "status": "erro",
            "erro": error[:100]
        }
    
    emails, phones = extract_from_html(html, url)
    
    if not emails and not phones:
        # Try contact page
        base = url.rstrip('/')
        for path in ['/contato', '/fale-conosco', '/contact', '/faleconosco']:
            c_html, c_err = fetch_url(base + path, timeout=5)
            if not c_err and c_html:
                e2, p2 = extract_from_html(c_html, base + path)
                emails.extend(e2)
                phones.extend(p2)
                if emails or phones:
                    break
            time.sleep(0.3)
    
    if not emails and not phones:
        return {
            "site": url,
            "nome": extract_domain_name(url),
            "estado": "",
            "cidade": "",
            "emails_encontrados": [],
            "telefones_encontrados": [],
            "status": "erro",
            "erro": "sem contato"
        }
    
    return {
        "site": url,
        "nome": extract_domain_name(url),
        "estado": "",
        "cidade": "",
        "emails_encontrados": list(dict.fromkeys(emails)),
        "telefones_encontrados": list(dict.fromkeys(phones)),
        "status": "ok"
    }

def main():
    print("=== Enriquecendo Batch 2 (linhas 120-239) ===\n")
    
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    print(f"Total lines in file: {len(lines)}")
    
    # Lines 120-239 (1-indexed) = indices 119-238 (0-indexed)
    # Each line has a URL with \r\n ending
    site_urls = []
    for line in lines[119:239]:
        url = line.strip()
        if url:
            site_urls.append(url)
    
    print(f"Total sites in batch: {len(site_urls)}")
    
    # Deduplicate
    seen = set()
    unique_urls = []
    for s in site_urls:
        if s not in seen:
            seen.add(s)
            unique_urls.append(s)
    
    print(f"Unique sites to process: {len(unique_urls)}\n")
    
    results = []
    success_count = 0
    error_count = 0
    
    for i, url in enumerate(unique_urls, 1):
        print(f"[{i}/{len(unique_urls)}]", flush=True)
        result = process_site(url)
        results.append(result)
        
        if result['status'] == 'ok':
            success_count += 1
        else:
            error_count += 1
        
        time.sleep(0.5)
    
    print(f"\n=== Resumo ===")
    print(f"Total sites únicos: {len(unique_urls)}")
    print(f"Sucesso: {success_count}")
    print(f"Erro: {error_count}")
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\nResultados salvos em: {OUTPUT_FILE}")

if __name__ == '__main__':
    main()
