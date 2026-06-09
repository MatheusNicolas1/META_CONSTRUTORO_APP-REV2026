const https = require('https');
const http = require('http');

function fetch(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'GET',
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    };
    const req = mod.request(opts, res => {
      let data = '';
      res.on('data', c => data += c.toString());
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', e => resolve({ status: 0, data: '', error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, data: '', error: 'timeout' }); });
    req.end();
  });
}

async function extractEmails(text) {
  const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return [...new Set((text.match(regex) || []).filter(e => {
    // Filtrar emails genéricos/falsos
    const bad = ['example.com', 'domain.com', 'yoursite.com', 'email.com', '@nothing'];
    return !bad.some(b => e.includes(b));
  }))];
}

async function main() {
  const results = [];

  // 1. Sinduscon-MG (tentar variações de URL)
  const urls = [
    { url: 'https://sinduscon-mg.org.br/filiados/', state: 'MG', source: 'Sinduscon-MG' },
    { url: 'https://sinduscon-mg.org.br/associados/', state: 'MG', source: 'Sinduscon-MG' },
    { url: 'https://www.sindusconpr.com.br/associados/', state: 'PR', source: 'Sinduscon-PR' },
    { url: 'https://sinduscon-ce.org.br/associados/', state: 'CE', source: 'Sinduscon-CE' },
    { url: 'https://www.sindusconba.com.br/filiados/', state: 'BA', source: 'Sinduscon-BA' },
    { url: 'https://www.sindusconpe.com.br/', state: 'PE', source: 'Sinduscon-PE' },
    { url: 'https://www.sindusgo.com.br/associados/', state: 'GO', source: 'Sinduscon-GO' },
  ];

  for (const item of urls) {
    const r = await fetch(item.url);
    const emails = await extractEmails(r.data);
    const status = r.status;
    console.log(`[${item.state}] ${item.source} - ${item.url} (${status}) -> ${emails.length} emails`);
    
    // Extrair nomes de empresas e emails
    if (emails.length > 0) {
      for (const email of emails) {
        results.push({
          name: `Construtora (${item.source})`,
          city: item.state,
          uf: item.state,
          email: email.toLowerCase(),
          source: item.source.replace('Sinduscon-', 'Sinduscon ') + ' - ' + (item.state === 'MG' ? 'MG' : item.state),
          type: 'construtora'
        });
      }
    }
  }

  // 2. Buscar no Google via texto para mais leads
  console.log('\n--- Resultados ---');
  console.log(JSON.stringify(results, null, 2));
  console.log(`\nTotal novos leads: ${results.length}`);
}

main().catch(console.error);
