#!/usr/bin/env python3
"""
Scraper do portal Construtoras Brasil (construtorasbrasil.com.br)
Extrai: nome, site, cidade, estado de todas as construtoras listadas por estado
"""

import re
import json
import urllib.request
import urllib.error
import ssl
import time
import os

# Estados e suas URLs
ESTADOS = {
    'sp': ('sao-paulo', 'SP'),
    'rj': ('rio-de-janeiro', 'RJ'),
    'mg': ('minas-gerais', 'MG'),
    'es': ('espirito-santo', 'ES'),
    'rs': ('rio-grande-do-sul', 'RS'),
    'sc': ('santa-catarina', 'SC'),
    'pr': ('parana', 'PR'),
    'ba': ('bahia', 'BA'),
    'se': ('sergipe', 'SE'),
    'pe': ('pernambuco', 'PE'),
    'al': ('alagoas', 'AL'),
    'pb': ('paraiba', 'PB'),
    'rn': ('rio-grande-do-norte', 'RN'),
    'ce': ('ceara', 'CE'),
    'pi': ('piaui', 'PI'),
    'ma': ('maranhao', 'MA'),
    'pa': ('para', 'PA'),
    'am': ('amazonas', 'AM'),
    'ap': ('amapa', 'AP'),
    'ro': ('rondonia', 'RO'),
    'rr': ('roraima', 'RR'),
    'to': ('tocantins', 'TO'),
    'ac': ('acre', 'AC'),
    'mt': ('mato-grosso', 'MT'),
    'ms': ('mato-grosso-do-sul', 'MS'),
    'go': ('goias', 'GO'),
    'df': ('distrito-federal', 'DF'),
}

BASE_URL = "https://www.construtorasbrasil.com.br/construtoras/{uf}/{estado}/"

def fetch_page(url, max_retries=3):
    """Fetch a page with retries"""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(
                url,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                }
            )
            with urllib.request.urlopen(req, context=ctx, timeout=30) as response:
                raw = response.read()
                # Try utf-8 first, fallback to latin1
                try:
                    return raw.decode('utf-8')
                except UnicodeDecodeError:
                    return raw.decode('latin-1')
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(2)
                continue
            print(f"  [!] Failed after {max_retries} attempts: {e}")
            return None

def extract_listings(html, sigla_estado):
    """Extract construtoras from HTML page"""
    listings = []
    
    # Remove \r characters that break regex
    html = html.replace('\r', '')
    
    # Split into blocks by h2 (each listing starts with h2)
    # Pattern: <h2 ...><a href="URL">NAME</a></h2> ... <cite>...SITE...</cite> ... Construtora em CIDADE - ESTADO
    blocks = re.split(r'<h2 style="font-size: 18px; margin-bottom: 5px;">', html)
    
    for block in blocks[1:]:  # Skip first block (before first listing)
        # Extract name and URL from h2 > a
        name_match = re.search(r'<a href="([^"]+)"[^>]*>\s*([^<]+?)\s*</a>', block)
        if not name_match:
            continue
        
        site_url = name_match.group(1).strip().rstrip('/ \t\r\n')
        nome = name_match.group(2).strip()
        
        # Extract site from cite
        cite_match = re.search(r'<cite><a[^>]*>([^<]+)</a></cite>', block)
        if cite_match:
            site = cite_match.group(1).strip().rstrip('/ \t\r\n')
        else:
            site = site_url
        
        # Extract city from "Construtora em" pattern
        loc_match = re.search(r'Construtora em\s+([^-]+?)\s*-\s*([^<\n]+)', block)
        if loc_match:
            cidade = loc_match.group(1).strip()
            estado = loc_match.group(2).strip()
        else:
            cidade = ""
            estado = sigla_estado
        
        # Fix encoding issues
        cidade = fix_encoding(cidade)
        estado = fix_encoding(estado)
        
        listings.append({
            'nome': nome,
            'site': site,
            'site_url': site_url,
            'cidade': cidade,
            'estado': estado,
            'estado_sigla': sigla_estado,
        })
    
    return listings

def fix_encoding(text):
    """Fix common encoding issues"""
    replacements = {
        'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
        'Ã£': 'ã', 'Ãµ': 'õ', 'Ã¢': 'â', 'Ãª': 'ê', 'Ã´': 'ô',
        'Ã§': 'ç', 'Ã ': 'à', 'Ã ': 'Á', 'Ã ': 'É', 'Ã ': 'Í',
        'Ã ': 'Ó', 'Ã ': 'Ú', 'Ã ': 'Ã', 'Ã ': 'Õ', 'Ã ': 'Â',
        'Ã ': 'Ê', 'Ã ': 'Ô', 'Ã‡': 'Ç', 'SÃ£o': 'São', 'SÃ£': 'Sã',
        'SÃ¡': 'Sá', 'SÃ­': 'Sí', 'SÃ³': 'Só',
    }
    for wrong, correct in replacements.items():
        text = text.replace(wrong, correct)
    return text.strip()

def main():
    all_listings = []
    
    for uf, (estado_nome, sigla) in ESTADOS.items():
        url = BASE_URL.format(uf=uf, estado=estado_nome)
        print(f"[*] Scraping {sigla} ({estado_nome})... ", end="", flush=True)
        
        html = fetch_page(url)
        if not html:
            print("FAILED")
            continue
        
        listings = extract_listings(html, sigla)
        print(f"{len(listings)} construtoras")
        all_listings.extend(listings)
        
        time.sleep(1)  # Be respectful
    
    # Save results
    output = {
        'fonte': 'https://www.construtorasbrasil.com.br',
        'total_construtoras': len(all_listings),
        'construtoras': all_listings
    }
    
    # Determine output directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, '.firecrawl', 'prospeccao-inicial')
    os.makedirs(output_dir, exist_ok=True)
    
    output_path = os.path.join(output_dir, 'construtorasbrasil.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"\n[✓] Total: {len(all_listings)} construtoras salvas em {output_path}")
    
    # Summary by state
    from collections import Counter
    state_count = Counter(l['estado_sigla'] for l in all_listings)
    print("\n--- Resumo por estado ---")
    for sigla in sorted(state_count.keys()):
        print(f"  {sigla}: {state_count[sigla]} construtoras")

if __name__ == '__main__':
    main()
