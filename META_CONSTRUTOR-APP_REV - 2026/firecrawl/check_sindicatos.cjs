const https = require('https');
const http = require('http');

function fetch(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const u = new URL(url);
    const opts = { hostname: u.hostname, path: u.pathname + u.search, headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000, rejectUnauthorized: false };
    mod.get(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ html: data, status: res.statusCode }));
    }).on('error', reject);
  });
}

async function main() {
  // Try to find associate lists with email data on sindicatos  
  const targets = [
    { name: 'Sinduscon-BA associados', url: 'https://www.sinduscon-ba.com.br/associados/' },
    { name: 'Sinduscon-BA', url: 'https://www.sinduscon-ba.com.br/' },
    { name: 'SEACON-SP (second try)', url: 'https://www.seconsp.com.br/associados/' },
    { name: 'SEACON-SP', url: 'https://www.seconsp.com.br/' },
  ];

  for (const t of targets) {
    try {
      const { html, status } = await fetch(t.url);
      const title = (html.match(/<title>([^<]*)<\/title>/i) || ['',''])[1].slice(0,60).trim();
      const _emails = [...new Set([...html.matchAll(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)].map(m => m[0]))];
      const clean = _emails.filter(e => !/\.(png|jpg|css|js|svg|ico|webp)([#?]|$)/i.test(e) && !e.includes('sentry'));
      console.log(t.name + ' [' + status + '] ' + 'title: ' + (title || '-'));
      if (clean.length) {
        console.log('  EMAILS: ' + clean.join(', '));
      } else {
        console.log('  emails: nenhum direto');
      }
      // Show links that might be directories
      const links = [...html.matchAll(/<a[^>]*href=["']([^"']*)["'][^>]*>/gi)].map(m => m[1]);
      const dirLinks = links.filter(l => /associado|profission|membro|parceiro|lista/i.test(l) && !/\.(css|js|png|jpg)/i.test(l));
      if (dirLinks.length) {
        console.log('  links relevantes: ' + dirLinks.slice(0,5).join(', '));
      }
    } catch(e) {
      console.log(t.name + ': ERRO ' + e.message);
    }
    console.log('---');
  }
}
main();
