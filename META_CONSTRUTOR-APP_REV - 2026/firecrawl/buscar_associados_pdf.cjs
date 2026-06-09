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
  const badDomains = [
    'example.com', 'domain.com', 'yoursite.com',
    'png', 'jpg', 'gif', 'svg', 'ico',
    'facebook.com', 'twitter.com', 'instagram.com', 'youtube.com', 'linkedin.com',
    'google.com', 'googlemail.com', 'wordpress.com', 'blogspot.com',
    'whatsapp.com', 'github.com', 'medium.com', 'hostinger',
    'solutudo.com.br'
  ];
  return [...new Set((text.match(regex) || []))].filter(e => {
    const domain = e.toLowerCase().split('@')[1];
    if (badDomains.includes(domain)) return false;
    if (/\.(png|jpg|jpeg|gif|svg|ico|css|js|json|xml|woff|ttf|eot)$/i.test(domain)) return false;
    if (!domain.includes('.') || /^\d/.test(domain)) return false;
    return true;
  });
}

async function main() {
  let allResults = [];

  // PDFs de sindicatos - procurar listas de associados em PDF
  const pdfSources = [
    // Sinduscon-SC
    { url: 'https://sindusconsc.com.br/wp-content/uploads/2024/01/associados.pdf', label: 'Sinduscon-SC PDF', state: 'SC', type: 'construtora' },
    { url: 'https://sindusconsc.com.br/associados/lista-de-associados/', label: 'Sinduscon-SC lista', state: 'SC', type: 'construtora' },
    // Sinduscon-MG
    { url: 'https://www.sinduscon-mg.org.br/associados/', label: 'Sinduscon-MG', state: 'MG', type: 'construtora' },
    // Sinduscon-ES
    { url: 'https://sinduscones.com.br/associados/', label: 'Sinduscon-ES', state: 'ES', type: 'construtora' },
    // Sinduscon-GO
    { url: 'https://sindusgo.com.br/associados/', label: 'Sinduscon-GO', state: 'GO', type: 'construtora' },
    // CBIC
    { url: 'https://cbic.org.br/associados/', label: 'CBIC Associados', state: 'BR', type: 'construtora' },
    // AsBEA (Assoc Brasileira de Escritórios de Arquitetura)
    { url: 'https://www.asbea.org.br/associados/', label: 'AsBEA', state: 'BR', type: 'autonomo' },
    { url: 'https://www.asbea.org.br/associados/busca/', label: 'AsBEA Busca', state: 'BR', type: 'autonomo' },
    // SINAENCO (Sindicato Nacional das Empresas de Arquitetura)
    { url: 'https://sinaenco.com.br/associadas/', label: 'SINAENCO', state: 'BR', type: 'autonomo' },
    // SECOVI (Sindicato de imobiliárias - tem construtoras associadas)
    { url: 'https://www.secovisp.com.br/associados/', label: 'SECOVI-SP', state: 'SP', type: 'construtora' },
    { url: 'https://www.secovirj.com.br/associados/', label: 'SECOVI-RJ', state: 'RJ', type: 'construtora' },
    { url: 'https://www.secovimg.com.br/associados/', label: 'SECOVI-MG', state: 'MG', type: 'construtora' },
    // ADEMI (Assoc Dirigentes de Empresas do Mercado Imobiliário)
    { url: 'https://www.ademi.org.br/associadas/', label: 'ADEMI', state: 'BR', type: 'construtora' },
    { url: 'https://www.ademi.org.br/associadas/associadas-2/', label: 'ADEMI2', state: 'BR', type: 'construtora' },
    // CREA-SP consulta por nome (página inicial)
    { url: 'https://creasp.org.br/consulta-profissional/', label: 'CREA-SP consulta', state: 'SP', type: 'autonomo' },
    // CAU/BR
    { url: 'https://www.caubr.gov.br/contato/', label: 'CAU/BR Contato', state: 'BR', type: 'autonomo' },
  ];

  for (const src of pdfSources) {
    const r = await fetch(src.url);
    if (r.status === 200 && r.data.length > 200) {
      const emails = extractEmails(r.data);
      console.log(`[${r.status}] ${src.label}: ${(r.data.length/1000).toFixed(0)}KB, ${emails.length} emails`);
      allResults.push(...emails.map(e => ({
        name: `Construtora (${src.label})`,
        city: src.state, uf: src.state,
        email: e.toLowerCase(),
        source: src.label,
        type: src.type
      })));
    } else {
      console.log(`[${r.status}] ${src.label}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  // TAMBÉM: buscar sindicatos que têm páginas com nomes de associados
  console.log('\n--- PÁGINAS COM NOMES DE ASSOCIADOS ---');
  const assocPages = [
    { url: 'https://www.sindusconpr.com.br/associados', label: 'Sinduscon-PR', state: 'PR', type: 'construtora' },
    { url: 'https://sindusconsp.com.br/associados', label: 'Sinduscon-SP', state: 'SP', type: 'construtora' },
    { url: 'https://sinduscon-rs.com.br/associados', label: 'Sinduscon-RS', state: 'RS', type: 'construtora' },
    { url: 'https://www.sindusconce.com.br/associados', label: 'Sinduscon-CE', state: 'CE', type: 'construtora' },
    { url: 'https://sinduscon-ba.com.br/associados', label: 'Sinduscon-BA', state: 'BA', type: 'construtora' },
    { url: 'https://sindusconpe.com.br/associados', label: 'Sinduscon-PE', state: 'PE', type: 'construtora' },
  ];

  for (const a of assocPages) {
    const r = await fetch(a.url);
    if (r.status === 200 && r.data.length > 200) {
      const emails = extractEmails(r.data);
      console.log(`[${r.status}] ${a.label}: ${(r.data.length/1000).toFixed(0)}KB, ${emails.length} emails`);
      allResults.push(...emails.map(e => ({
        name: `Construtora (${a.label})`,
        city: a.state, uf: a.state,
        email: e.toLowerCase(),
        source: a.label,
        type: a.type
      })));
    } else {
      console.log(`[${r.status}] ${a.label}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n=== TOTAL NOVOS LEADS: ${allResults.length} ===`);
  // Output unique emails only
  const seen = new Set();
  const unique = allResults.filter(l => {
    const k = l.email;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  console.log(`LEADS ÚNICOS: ${unique.length}`);
  console.log(JSON.stringify(unique, null, 2));
}

main().catch(console.error);
