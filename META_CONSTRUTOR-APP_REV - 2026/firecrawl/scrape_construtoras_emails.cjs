const https = require('https');
const fs = require('fs');
const path = require('path');

const LEADS_DIR = path.join(__dirname, '..', '.firecrawl', 'leads');
if (!fs.existsSync(LEADS_DIR)) fs.mkdirSync(LEADS_DIR, { recursive: true });

function fetch(url) {
  return new Promise((resolve, reject) => {
    const opts = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      timeout: 15000
    };
    https.get(url, opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Sites to scrape for emails - collected from Firecrawl search results
const construtorasToScrape = [
  // Curitiba/PR
  { name: 'Grupo Avantti', url: 'https://www.grupoavantti.com/contato/', city: 'Curitiba', uf: 'PR' },
  { name: 'MT Engenharia', url: 'https://mtengenharia.com.br/construtora/nossaempresa/', city: 'Curitiba', uf: 'PR' },
  { name: 'Construtora Resolucao', url: 'https://www.construtoraresolucao.com.br/', city: 'Curitiba', uf: 'PR' },
  { name: 'Artesa Construtora', url: 'https://www.artesaconstrutora.com.br/', city: 'Curitiba', uf: 'PR' },
  { name: 'Atenas Construtora', url: 'https://atenasconstrutora.com.br/contato/', city: 'Curitiba', uf: 'PR' },
  { name: 'Construtora Altar', url: 'https://www.construtoraaltar.com.br/', city: 'Curitiba', uf: 'PR' },
  { name: 'Sanches Construtora', url: 'https://sanchesconstrutora.com.br/', city: 'Curitiba', uf: 'PR' },
  { name: 'Construtora Laguna', url: 'https://www.construtoralaguna.com.br/contatos', city: 'Curitiba', uf: 'PR' },
  { name: 'Avantus Construtora', url: 'https://avantusconstrutora.com.br/contato/', city: 'Curitiba', uf: 'PR' },
  { name: 'Construtora JL', url: 'https://construtorajl.com/contato', city: 'Curitiba', uf: 'PR' },
  
  // Porto Alegre/RS
  { name: 'Costamar', url: 'https://costamar.eng.br/', city: 'Porto Alegre', uf: 'RS' },
  { name: 'Pelotense', url: 'https://pelotense.com.br/', city: 'Porto Alegre', uf: 'RS' },
  { name: 'Construl', url: 'https://www.construl.com/', city: 'Porto Alegre', uf: 'RS' },
  { name: 'Zuckhan', url: 'https://www.zuckhan.com.br/seja-nosso-fornecedor/', city: 'Porto Alegre', uf: 'RS' },
  
  // Rio de Janeiro/RJ
  { name: 'MR2 Construtora', url: 'https://mr2construtora.com.br/contato/', city: 'Rio de Janeiro', uf: 'RJ' },
  { name: 'Duo Construtora', url: 'https://duoconstrutora.com.br/contato/', city: 'Rio de Janeiro', uf: 'RJ' },
  { name: 'Construtora Santa Isabel', url: 'https://www.csisabel.com.br/', city: 'Rio de Janeiro', uf: 'RJ' },
  { name: 'Lytorânea', url: 'https://www.lytoranea.com.br/contato', city: 'Rio de Janeiro', uf: 'RJ' },
  { name: 'RJ Engenharia', url: 'https://www.rjengenharia.com/', city: 'Rio de Janeiro', uf: 'RJ' },
  
  // Belo Horizonte/MG
  { name: 'Cima Construtora', url: 'https://cimaconstrutora.com.br/contato/', city: 'Belo Horizonte', uf: 'MG' },
  { name: 'Gouv Engenharia', url: 'https://www.gouv.com.br/', city: 'Belo Horizonte', uf: 'MG' },
  { name: 'Casa Forte', url: 'https://construtoracasaforte.com.br/', city: 'Belo Horizonte', uf: 'MG' },
  { name: 'Comim Construtora', url: 'https://comimconstrutora.com.br/', city: 'Belo Horizonte', uf: 'MG' },
  { name: 'Estrutural EC', url: 'https://estruturalec.com.br/contato', city: 'Belo Horizonte', uf: 'MG' },
  { name: 'Construtora Terraco', url: 'https://construtoraterraco.com.br/contato/', city: 'Belo Horizonte', uf: 'MG' },
  { name: 'Eliger Construtora', url: 'https://www.eliger.com.br/contato/', city: 'Belo Horizonte', uf: 'MG' },
  
  // SP interior
  { name: 'Edge Construtora', url: 'https://www.edgeconstrutora.com.br/contato', city: 'Ribeirao Preto', uf: 'SP' },
  { name: 'Diase Construtora', url: 'https://www.diase.com.br/contato.php', city: 'Alphaville', uf: 'SP' },
  { name: 'Morar Construtora', url: 'https://morar.com.br/Contato', city: 'SP', uf: 'SP' },
  
  // More PR
  { name: 'Construtora Santa Helena', url: 'https://www.construtorasantahelena.com.br/contato/', city: 'Londrina', uf: 'PR' },
];

async function extractEmails(html) {
  const set = new Set();
  const rx = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  let m;
  while ((m = rx.exec(html)) !== null) set.add(m[0]);
  // Also try base64 encoded emails
  const b64rx = /([A-Za-z0-9+/]{4,40}={0,2})/g;
  return [...set].filter(e => 
    !e.includes('example') && 
    !e.toLowerCase().includes('solutudo') && 
    !e.toLowerCase().includes('wordpress') &&
    !e.toLowerCase().includes('sentry') &&
    !e.toLowerCase().includes('gstatic') &&
    e.split('@')[1] && e.split('@')[1].includes('.')
  );
}

async function main() {
  let results = [];
  
  for (let i = 0; i < construtorasToScrape.length; i++) {
    const s = construtorasToScrape[i];
    process.stdout.write(`[${i+1}/${construtorasToScrape.length}] ${s.name}... `);
    
    try {
      const html = await fetch(s.url);
      const emails = await extractEmails(html);
      
      if (emails.length > 0) {
        results.push({
          name: s.name,
          url: s.url,
          city: s.city,
          uf: s.uf,
          emails,
          phones: [...new Set([...html.matchAll(/\(\d{2}\)\s*\d{4,5}-?\d{4}/g)].map(m => m[0]))].slice(0,3)
        });
        console.log(`${emails.join(', ')}`);
      } else {
        console.log('sem email');
      }
    } catch(e) {
      console.log(`ERRO: ${e.message}`);
    }
    
    // Delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`\n\n=== TOTAL: ${results.length} construtoras com email encontradas ===`);
  
  // Save
  fs.writeFileSync(
    path.join(LEADS_DIR, 'construtoras-emails.json'),
    JSON.stringify(results, null, 2)
  );
  
  // Report
  for (const r of results) {
    console.log(`${r.name} (${r.city}-${r.uf}): ${r.emails.join(', ')}`);
  }
}

main().catch(console.error);
