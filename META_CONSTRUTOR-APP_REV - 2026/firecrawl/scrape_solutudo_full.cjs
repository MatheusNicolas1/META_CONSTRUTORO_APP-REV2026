const https = require('https');
const fs = require('fs');
const path = require('path');

const LEADS_DIR = path.join(__dirname, '..', '.firecrawl', 'leads');
if (!fs.existsSync(LEADS_DIR)) fs.mkdirSync(LEADS_DIR, { recursive: true });

function fetch(url) {
  return new Promise((resolve, reject) => {
    const opts = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Connection': 'keep-alive',
      },
      timeout: 15000
    };
    https.get(url, opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('Timeout')); });
  });
}

function extractLinks(html) {
  const links = [];
  const regex = /<a[^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    links.push({ href: match[1], text: match[2].trim() });
  }
  return links;
}

function extractCompanyUrls(html, baseCategory) {
  const urls = [];
  // Match company detail pages: /empresas/uf/city/category/company-name-id
  const regex = /href="(https:\/\/www\.solutudo\.com\.br\/empresas\/[a-z]{2}\/[^\/]+\/[^\/]+\/[a-z0-9\-]+-\d+)"/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    urls.push(match[1]);
  }
  return [...new Set(urls)];
}

function extractEmail(html) {
  // Emails encoded or plain
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = html.match(emailRegex);
  if (matches) return [...new Set(matches.filter(e => !e.includes('example.com') && !e.includes('solutudo')))];
  return [];
}

function extractPhone(html) {
  const phoneRegexes = [
    /\(\d{2}\)\s*\d{4,5}-?\d{4}/g,
    /\d{2}\s*\d{4,5}-?\d{4}/g,
  ];
  const phones = [];
  for (const rx of phoneRegexes) {
    const matches = html.match(rx);
    if (matches) phones.push(...matches);
  }
  return [...new Set(phones)];
}

function extractCompanyName(html) {
  // Try to get company name from structured data
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (titleMatch) return titleMatch[1].trim();
  return null;
}

function extractState(html) {
  const stateMatch = html.match(/em ([A-Z]{2})[<,]/);
  if (stateMatch) return stateMatch[1];
  return null;
}

async function getPaginationUrls(categoryUrl) {
  const html = await fetch(categoryUrl);
  const links = extractLinks(html);
  const paginationUrls = [];
  for (const link of links) {
    if (link.href.includes('?pagina=') || link.href.includes('&pagina=')) {
      const fullUrl = link.href.startsWith('http') ? link.href : `https://www.solutudo.com.br${link.href}`;
      paginationUrls.push(fullUrl);
    }
  }
  // Extract "10000 empresas" count
  const countMatch = html.match(/Encontramos:.*?(\d+)\s*empresas/i);
  const count = countMatch ? parseInt(countMatch[1]) : null;
  return [...new Set(paginationUrls)].sort(), count;
}

async function scrapeCompanyDetail(url) {
  try {
    const html = await fetch(url);
    const name = extractCompanyName(html);
    const emails = extractEmail(html);
    const phones = extractPhone(html);
    return {
      url,
      name,
      emails,
      phones,
      hasEmail: emails.length > 0,
      success: true
    };
  } catch (err) {
    return { url, error: err.message, success: false };
  }
}

function extractNameFromUrl(url) {
  const parts = url.split('/');
  const last = parts[parts.length-1];
  // Remove trailing ID number
  return last.replace(/-\d+$/, '').replace(/[-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

async function main() {
  const cities = [
    { uf: 'sp', city: 'sao-paulo', category: 'construtoras' },
    { uf: 'sp', city: 'sao-paulo', category: 'engenheiros' },
    { uf: 'sp', city: 'sao-paulo', category: 'arquitetos' },
    { uf: 'pr', city: 'curitiba', category: 'construtoras' },
    { uf: 'pr', city: 'curitiba', category: 'engenheiros' },
    { uf: 'pr', city: 'curitiba', category: 'arquitetos' },
    { uf: 'rj', city: 'rio-de-janeiro', category: 'construtoras' },
    { uf: 'mg', city: 'belo-horizonte', category: 'construtoras' },
    { uf: 'rs', city: 'porto-alegre', category: 'construtoras' },
    { uf: 'sc', city: 'florianopolis', category: 'construtoras' },
    { uf: 'sp', city: 'campinas', category: 'construtoras' },
    { uf: 'sp', city: 'sao-jose-dos-campos', category: 'construtoras' },
  ];

  let allCompanies = [];
  
  for (const cityInfo of cities) {
    const { uf, city, category } = cityInfo;
    const baseUrl = `https://www.solutudo.com.br/empresas/${uf}/${city}/${category}`;
    
    console.log(`\n=== ${category.toUpperCase()} em ${city.toUpperCase()}-${uf.toUpperCase()} ===`);
    
    try {
      const html = await fetch(baseUrl);
      const companyUrls = extractCompanyUrls(html, category);
      
      // Get total count
      const countMatch = html.match(/Encontramos:.*?(\d+)\s*empresas/i);
      const totalCount = countMatch ? parseInt(countMatch[1]) : '?';
      console.log(`Pagina 1: ${companyUrls.length} empresas (Total: ${totalCount})`);
      
      // Get all page URLs
      const allLinks = extractLinks(html);
      const pageUrls = [];
      for (const link of allLinks) {
        if (link.href.includes('pagina=')) {
          const fullUrl = link.href.startsWith('http') ? link.href : `https://www.solutudo.com.br${link.href}`;
          pageUrls.push(fullUrl);
        }
      }
      const uniquePages = [...new Set(pageUrls)];
      
      console.log(`Paginacao: ${uniquePages.length} paginas disponiveis`);
      
      // Add companies from this page
      for (const url of companyUrls) {
        allCompanies.push({
          url,
          category,
          city,
          uf,
          source: `solutudo-${category}-${city}-${uf}`
        });
      }
      
      // Scrape pages 2-5 for more companies
      const pagesToScrape = uniquePages.slice(0, 4); // pages 2,3,4,5
      for (const pageUrl of pagesToScrape) {
        try {
          const pageHtml = await fetch(pageUrl);
          const pageCompanies = extractCompanyUrls(pageHtml, category);
          console.log(`  Pagina ${pageUrl.match(/pagina=(\d+)/)[1]}: +${pageCompanies.length} empresas`);
          for (const url of pageCompanies) {
            allCompanies.push({
              url,
              category,
              city,
              uf,
              source: `solutudo-${category}-${city}-${uf}`
            });
          }
        } catch (e) {
          console.log(`  Pagina ${pageUrl}: ERRO - ${e.message}`);
        }
      }
    } catch (e) {
      console.log(`ERRO ao acessar ${baseUrl}: ${e.message}`);
    }
  }
  
  // Deduplicate
  const uniqueCompanies = [...new Map(allCompanies.map(c => [c.url, c])).values()];
  console.log(`\n\n=== TOTAL: ${uniqueCompanies.length} empresas unicas coletadas ===`);
  
  // Save to file
  fs.writeFileSync(
    path.join(LEADS_DIR, 'solutudo-empresas-coletadas.json'),
    JSON.stringify({ total: uniqueCompanies.length, companies: uniqueCompanies }, null, 2)
  );
  
  // Now scrape detail pages for emails (limit to first 30 to avoid rate limiting)
  console.log('\n=== SCRAPING EMAILS (primeiras 30 empresas) ===');
  const toScrape = uniqueCompanies.slice(0, 30);
  let withEmail = 0;
  
  for (let i = 0; i < toScrape.length; i++) {
    const company = toScrape[i];
    console.log(`[${i+1}/${toScrape.length}] ${company.url.split('/').pop()}`);
    const detail = await scrapeCompanyDetail(company.url);
    company.detail = detail;
    if (detail.hasEmail) {
      withEmail++;
      console.log(`  >> EMAIL: ${detail.emails.join(', ')}`);
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log(`\n\n=== RESUMO ===`);
  console.log(`Total empresas coletadas: ${uniqueCompanies.length}`);
  console.log(`Scraped detalhes: ${toScrape.length}`);
  console.log(`Com email: ${withEmail}`);
  
  // Save final results
  fs.writeFileSync(
    path.join(LEADS_DIR, 'solutudo-resultados.json'),
    JSON.stringify({
      totalCompanies: uniqueCompanies.length,
      scrapedDetails: toScrape.length,
      withEmails: withEmail,
      companies: uniqueCompanies.map(c => ({
        url: c.url,
        name: c.detail?.name || c.url.split('/').pop().replace(/-\d+$/, '').replace(/-/g,' '),
        emails: c.detail?.emails || [],
        phones: c.detail?.phones || [],
        category: c.category,
        city: c.city,
        uf: c.uf
      }))
    }, null, 2)
  );
  
  console.log('\nResultados salvos em .firecrawl/leads/solutudo-resultados.json');
}

main().catch(console.error);
