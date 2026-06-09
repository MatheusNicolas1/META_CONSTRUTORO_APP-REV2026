const https = require('https');

function fetch(url) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : require('http');
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

function extractEmails(text) {
  const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const badDomains = ['example.com', 'domain.com', 'yoursite.com', 'png', 'jpg', 'gif', 'svg', 'ico',
    'sinduscon-mg.org.br', 'sindusconpe.com.br', 'sinduscon-rs.com.br',
    'hostinger', 'facebook.com', 'twitter.com', 'instagram.com', 'youtube.com',
    'google.com', 'googlemail.com', 'wordpress.com', 'blogspot.com', 'wixpress.com',
    'linkedin.com', 'whatsapp.com', 'github.com', 'medium.com'];
  return [...new Set((text.match(regex) || []).filter(e => {
    const [local, domain] = e.split('@');
    if (badDomains.includes(domain)) return false;
    if (/\.(png|jpg|jpeg|gif|svg|ico|css|js|json|xml|woff|ttf|eot)$/i.test(domain)) return false;
    if (/^\d/.test(domain)) return false; // IP addresses
    if (!domain.includes('.')) return false;
    return true;
  }))];
}

async function checkAndExtract(url, state, source, type) {
  const r = await fetch(url);
  if (r.status === 200 && r.data.length > 100) {
    const emails = extractEmails(r.data);
    console.log(`[OK] ${source} - ${url} (${r.data.length} chars) -> ${emails.length} emails`);
    return emails.map(e => ({ name: `Construtora (${source})`, city: state, uf: state, email: e.toLowerCase(), source, type }));
  }
  console.log(`[${r.status}] ${source} - ${url}`);
  return [];
}

async function main() {
  let allResults = [];

  // SINDUSCONS REGIONAIS - tentar páginas reais com listas
  const sinduscons = [
    // SC - tentar site oficial
    { url: 'https://sindusconsc.com.br/associados/', state: 'SC', source: 'Sinduscon-SC' },
    { url: 'https://sindusconsc.com.br/filiados/', state: 'SC', source: 'Sinduscon-SC' },
    // ES
    { url: 'https://sinduscones.com.br/', state: 'ES', source: 'Sinduscon-ES' },
    // GO
    { url: 'https://sindusgo.com.br/', state: 'GO', source: 'Sinduscon-GO' },
    // BA - tentar com www
    { url: 'https://www.sindusconba.com.br/filiados/', state: 'BA', source: 'Sinduscon-BA' },
    // CE
    { url: 'https://sindusconce.com.br/', state: 'CE', source: 'Sinduscon-CE' },
    // RS - já funcionou parcialmente
    { url: 'https://sinduscon-rs.com.br/', state: 'RS', source: 'Sinduscon-RS' },
  ];

  for (const item of sinduscons) {
    const leads = await checkAndExtract(item.url, item.state, item.source, 'construtora');
    allResults.push(...leads);
  }

  // IAB (Instituto de Arquitetos) - tem filiados regionais
  console.log('\n--- IAB REGIONAIS ---');
  const iabs = [
    { url: 'https://www.iab.org.br/filiados/', state: 'BR', source: 'IAB Nacional' },
    { url: 'https://www.iabsp.org.br/associados/', state: 'SP', source: 'IAB-SP' },
    { url: 'https://www.iabrj.org.br/associados/', state: 'RJ', source: 'IAB-RJ' },
  ];
  for (const item of iabs) {
    const leads = await checkAndExtract(item.url, item.state, item.source, 'autonomo');
    allResults.push(...leads);
  }

  // SOLUTUDO - expandir para mais estados 
  console.log('\n--- SOLUTUDO MAIS ESTADOS ---');
  const solutudoStates = [
    { url: 'https://www.solutudo.com.br/empresas/mg/belo-horizonte/construtoras', state: 'MG', source: 'Solutudo MG' },
    { url: 'https://www.solutudo.com.br/empresas/rj/rio-de-janeiro/construtoras', state: 'RJ', source: 'Solutudo RJ' },
    { url: 'https://www.solutudo.com.br/empresas/pr/curitiba/construtoras', state: 'PR', source: 'Solutudo PR' },
    { url: 'https://www.solutudo.com.br/empresas/rs/porto-alegre/construtoras', state: 'RS', source: 'Solutudo RS' },
    { url: 'https://www.solutudo.com.br/empresas/sc/florianopolis/construtoras', state: 'SC', source: 'Solutudo SC' },
    { url: 'https://www.solutudo.com.br/empresas/ba/salvador/construtoras', state: 'BA', source: 'Solutudo BA' },
    { url: 'https://www.solutudo.com.br/empresas/ce/fortaleza/construtoras', state: 'CE', source: 'Solutudo CE' },
    { url: 'https://www.solutudo.com.br/empresas/es/vitoria/construtoras', state: 'ES', source: 'Solutudo ES' },
    { url: 'https://www.solutudo.com.br/empresas/go/goiania/construtoras', state: 'GO', source: 'Solutudo GO' },
    { url: 'https://www.solutudo.com.br/empresas/pe/recife/construtoras', state: 'PE', source: 'Solutudo PE' },
  ];
  for (const item of solutudoStates) {
    const leads = await checkAndExtract(item.url, item.state, item.source, 'construtora');
    allResults.push(...leads);
  }

  console.log(`\n=== TOTAL NOVOS LEADS: ${allResults.length} ===`);
  console.log(JSON.stringify(allResults, null, 2));
}

main().catch(console.error);
