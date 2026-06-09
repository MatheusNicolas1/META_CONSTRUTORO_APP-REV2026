const https = require('https');

function fetch(url) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'GET',
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    };
    const req = https.request(opts, res => {
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
  const bad = ['example.com', 'domain.com', 'yoursite.com', 'email.com', 'sinduscon-mg.org.br', 'sindusconpe.com.br', 'sinduscon.com', 'hostinger', 'facebook.com', 'twitter.com', 'instagram.com', 'youtube.com', 'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'uol.com.br', 'bol.com.br', 'ig.com.br', 'terra.com.br'];
  return [...new Set((text.match(regex) || []).filter(e => {
    const domain = e.split('@')[1];
    return !bad.includes(domain);
  }))];
}

async function extractConstrutoras(text, state, source) {
  // Tentar encontrar pares nome+email
  const emails = extractEmails(text);
  return emails.map(email => ({
    name: `Construtora (${source})`,
    city: state,
    uf: state,
    email: email.toLowerCase(),
    source: source,
    type: 'construtora'
  }));
}

async function main() {
  const allResults = [];

  // URLS de sindicatos de construção civil no Brasil com listas de associados
  const alvos = [
    // Sindicatos regionais
    { url: 'https://sinduscon-mg.org.br/', state: 'MG', source: 'Sinduscon-MG' },
    { url: 'https://www.sindusconsp.com.br/institucional/sinduscon/', state: 'SP', source: 'Sinduscon-SP' },
    { url: 'https://sinduscon-rs.com.br/associados/', state: 'RS', source: 'Sinduscon-RS' },
    { url: 'https://sinduscon-sc.com.br/', state: 'SC', source: 'Sinduscon-SC' },
    { url: 'https://sinduscon-pr.com.br/', state: 'PR', source: 'Sinduscon-PR' },
    
    // CREAs regionais (páginas de transparência)
    { url: 'https://www.confea.org.br/transparencia', state: 'BR', source: 'Confea' },
    
    // CBIC - Câmara Brasileira da Indústria da Construção
    { url: 'https://cbic.org.br/sindicatos-filiados/', state: 'BR', source: 'CBIC' },
    
    // Outras fontes de construtoras
    { url: 'https://www.sindusconba.com.br/', state: 'BA', source: 'Sinduscon-BA' },
    { url: 'https://www.sindusconpe.com.br/associados/', state: 'PE', source: 'Sinduscon-PE' },
    { url: 'https://www.sindusgo.com.br/', state: 'GO', source: 'Sinduscon-GO' },
  ];

  for (const alvo of alvos) {
    const r = await fetch(alvo.url);
    if (r.status === 200) {
      const leads = await extractConstrutoras(r.data, alvo.state, alvo.source);
      console.log(`[${alvo.state}] ${alvo.source} - ${alvo.url} -> ${leads.length} emails`);
      allResults.push(...leads);
    } else {
      console.log(`[${alvo.state}] ${alvo.source} - ${alvo.url} (${r.status})`);
    }
  }

  // Buscar associacoes de arquitetos
  console.log('\n--- ASSOCIAÇÕES DE ARQUITETOS ---');
  const assocArqs = [
    { url: 'https://www.asbea.org.br/associados/', state: 'BR', source: 'ASBEA' },
    { url: 'https://www.caubr.gov.br/consulta/', state: 'BR', source: 'CAU/BR' },
    { url: 'https://www.iab.org.br/', state: 'BR', source: 'IAB' },
  ];
  for (const alvo of assocArqs) {
    const r = await fetch(alvo.url);
    if (r.status === 200) {
      const emails = extractEmails(r.data);
      console.log(`[${alvo.state}] ${alvo.source} - ${alvo.url} -> ${emails.length} emails`);
      for (const email of emails) {
        allResults.push({
          name: `Arquiteto (${alvo.source})`,
          city: alvo.state,
          uf: alvo.state,
          email: email.toLowerCase(),
          source: alvo.source,
          type: 'autonomo'
        });
      }
    } else {
      console.log(`[${alvo.state}] ${alvo.source} - ${alvo.url} (${r.status})`);
    }
  }

  console.log(`\nTotal: ${allResults.length} novos leads`);
  console.log(JSON.stringify(allResults, null, 2));
}

main().catch(console.error);
