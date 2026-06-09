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

function extractEmails(text, source) {
  const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const badDomains = [
    'example.com', 'domain.com', 'yoursite.com', 
    'png', 'jpg', 'gif', 'svg', 'ico', 'css', 'js', 'json', 'xml', 'woff', 'ttf', 'eot',
    'facebook.com', 'twitter.com', 'instagram.com', 'youtube.com', 'linkedin.com',
    'google.com', 'googlemail.com', 'wordpress.com', 'blogspot.com', 'wixpress.com',
    'whatsapp.com', 'github.com', 'medium.com', 'hostinger',
    'solutudo.com.br', 'sinduscon-mg.org.br', 'sindusconpe.com.br', 'sinduscon-rs.com.br'
  ];
  const unique = [...new Set((text.match(regex) || []))].filter(e => {
    const [local, domain] = e.toLowerCase().split('@');
    if (badDomains.includes(domain)) return false;
    if (/\.(png|jpg|jpeg|gif|svg|ico|css|js|json|xml|woff|ttf|eot)$/i.test(domain)) return false;
    if (!domain.includes('.') || domain.startsWith('www.') || /^\d/.test(domain)) return false;
    return true;
  });
  return unique;
}

async function scrapeSource(url, label, state, type) {
  const r = await fetch(url);
  if (r.status === 200 && r.data.length > 200) {
    const emails = extractEmails(r.data, label);
    console.log(`[${r.status}] ${label}: ${r.data.length} chars, ${emails.length} emails`);
    return emails.map(e => ({ name: `Construtora (${label})`, city: state, uf: state, email: e.toLowerCase(), source: label, type }));
  }
  console.log(`[${r.status}] ${label} - ${r.data?.substring(0, 100)}`);
  return [];
}

async function main() {
  let allResults = [];

  // 1. LISTA DE FORNECEDORES - sites com emails visíveis no HTML
  const fornSites = [
    // GuiaMais já funcionou antes para SP, tentar RJ/MG
    { url: 'https://www.guiamais.com.br/rj/rio-de-janeiro/construtoras', label: 'GuiaMais RJ', state: 'RJ', type: 'construtora' },
    { url: 'https://www.guiamais.com.br/mg/belo-horizonte/construtoras', label: 'GuiaMais MG', state: 'MG', type: 'construtora' },
    { url: 'https://www.guiamais.com.br/pr/curitiba/construtoras', label: 'GuiaMais PR', state: 'PR', type: 'construtora' },
    { url: 'https://www.guiamais.com.br/sc/florianopolis/construtoras', label: 'GuiaMais SC', state: 'SC', type: 'construtora' },
    { url: 'https://www.guiamais.com.br/ba/salvador/construtoras', label: 'GuiaMais BA', state: 'BA', type: 'construtora' },
    { url: 'https://www.guiamais.com.br/ce/fortaleza/construtoras', label: 'GuiaMais CE', state: 'CE', type: 'construtora' },
    { url: 'https://www.guiamais.com.br/es/vitoria/construtoras', label: 'GuiaMais ES', state: 'ES', type: 'construtora' },
    { url: 'https://www.guiamais.com.br/go/goiania/construtoras', label: 'GuiaMais GO', state: 'GO', type: 'construtora' },
    { url: 'https://www.guiamais.com.br/pe/recife/construtoras', label: 'GuiaMais PE', state: 'PE', type: 'construtora' },

    // Apontador - tem emails visíveis
    { url: 'https://www.apontador.com.br/busca/mg/belo_horizonte/construtoras', label: 'Apontador MG', state: 'MG', type: 'construtora' },
    { url: 'https://www.apontador.com.br/busca/sp/sao_paulo/construtoras', label: 'Apontador SP', state: 'SP', type: 'construtora' },
    { url: 'https://www.apontador.com.br/busca/rj/rio_de_janeiro/construtoras', label: 'Apontador RJ', state: 'RJ', type: 'construtora' },
    { url: 'https://www.apontador.com.br/busca/sc/florianopolis/construtoras', label: 'Apontador SC', state: 'SC', type: 'construtora' },

    // OMeuAnuncioBrasil
    { url: 'https://www.omeuanunciobrasil.com.br/anuncios/construtoras/', label: 'O Meu Anúncio BR', state: 'BR', type: 'construtora' },

    // Infoisinfo
    { url: 'https://www.infoisinfo.com.br/pesquisa/construtoras', label: 'Infoisinfo BR', state: 'BR', type: 'construtora' },
  ];

  for (const site of fornSites) {
    const leads = await scrapeSource(site.url, site.label, site.state, site.type);
    allResults.push(...leads);
    // Pausa pequena entre requisições
    await new Promise(r => setTimeout(r, 500));
  }

  // 2. Buscar arquitetos/engenheiros em diretórios

  console.log('\n--- AUTONOMOS (Arquitetos/Engenheiros) ---');
  const autoSites = [
    // Arquivo Nacional de Arquitetura
    { url: 'https://www.arquivo.arq.br/arquitetos/', label: 'Arquivo Arq BR', state: 'BR', type: 'autonomo' },
    // Habitissimo
    { url: 'https://www.habitissimo.com.br/profissionais/arquitetos', label: 'Habitissimo Arq', state: 'BR', type: 'autonomo' },
    { url: 'https://www.habitissimo.com.br/profissionais/engenheiros_civis', label: 'Habitissimo Eng', state: 'BR', type: 'autonomo' },
    // GetNinjas
    { url: 'https://www.getninjas.com.br/arquitetos', label: 'GetNinjas Arq', state: 'BR', type: 'autonomo' },
    // Construção & Reforma
    { url: 'https://www.construcaoereforma.com.br/profissionais/arquitetos', label: 'ConstReforma Arq', state: 'BR', type: 'autonomo' },
    { url: 'https://www.construcaoereforma.com.br/profissionais/engenheiros', label: 'ConstReforma Eng', state: 'BR', type: 'autonomo' },
  ];

  for (const site of autoSites) {
    const leads = await scrapeSource(site.url, site.label, site.state, site.type);
    allResults.push(...leads);
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n=== TOTAL NOVOS LEADS: ${allResults.length} ===`);
  console.log(JSON.stringify(allResults, null, 2));
}

main().catch(console.error);
