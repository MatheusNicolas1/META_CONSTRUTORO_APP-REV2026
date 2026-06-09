#!/usr/bin/env node
/**
 * Script para adicionar links de tracking UTM + redirect em todos os templates de email.
 * 
 * Transforma links do tipo:
 *   href="https://www.metaconstrutor.app.br/home"
 * Em:
 *   href="https://www.metaconstrutor.app.br/l/dia-01?c={{CONTACT_ID}}&d=https%3A%2F%2Fwww.metaconstrutor.app.br%2Fhome&ct=cta-principal"
 * 
 * Uso: node add-tracking-links.js
 * 
 * Regras:
 *   - Links para metaconstrutor.app.br (página de destino) são tracking
 *   - Links para descadastrar/unsubscribe continuam sem tracking
 *   - Links externos não são modificados
 *   - Cada template recebe utm_content baseado no assunto
 */

const fs = require('fs');
const path = require('path');

const CAMPANHA_DIR = path.join(__dirname, '..', 'campanha-26-dias');
const DOMAIN = 'www.metaconstrutor.app.br';
const BASE_URL = `https://${DOMAIN}`;

// Mapeamento: filename prefix => campaign day
function getDayFromFilename(filename) {
  const match = filename.match(/^dia-(\d+)/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  return `dia-${String(num).padStart(2, '0')}`;
}

// Mapeia assuntos/content para utm_content descritivo
function getUTMContent(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes('rdo-tecnico')) return 'rdo-tecnico';
  if (lower.includes('rdo-humor')) return 'rdo-humor';
  if (lower.includes('gestao-obras-reportagem')) return 'gestao-obras';
  if (lower.includes('gestao-obras-usabilidade')) return 'gestao-obras-usabilidade';
  if (lower.includes('checklists-tecnico')) return 'checklists';
  if (lower.includes('checklists-reportagem')) return 'checklists-reportagem';
  if (lower.includes('documentos-emocional')) return 'documentos';
  if (lower.includes('documentos-usabilidade')) return 'documentos-usabilidade';
  if (lower.includes('relatorios-tecnico')) return 'relatorios';
  if (lower.includes('relatorios-reportagem')) return 'relatorios-reportagem';
  if (lower.includes('equipes-humor')) return 'equipes';
  if (lower.includes('equipes-emocional')) return 'equipes-emocional';
  if (lower.includes('contratos-tecnico')) return 'contratos';
  if (lower.includes('contratos-reportagem')) return 'contratos-reportagem';
  if (lower.includes('fluxo-caixa-tecnico')) return 'fluxo-caixa';
  if (lower.includes('fluxo-caixa-emocional')) return 'fluxo-caixa-emocional';
  if (lower.includes('portal-cliente-emocional')) return 'portal-cliente';
  if (lower.includes('portal-cliente-humor')) return 'portal-cliente-humor';
  if (lower.includes('whatsapp-bot-usabilidade')) return 'whatsapp-bot';
  if (lower.includes('whatsapp-bot-reportagem')) return 'whatsapp-bot-reportagem';
  if (lower.includes('integracoes-tecnico')) return 'integracoes';
  if (lower.includes('integracoes-reportagem')) return 'integracoes-reportagem';
  if (lower.includes('seguranca-tecnico')) return 'seguranca';
  if (lower.includes('seguranca-emocional')) return 'seguranca-emocional';
  if (lower.includes('planos-humor')) return 'planos';
  if (lower.includes('planos-emocional')) return 'planos-emocional';
  return 'link-generico';
}

function processTemplate(filePath) {
  const filename = path.basename(filePath);
  const campaignDay = getDayFromFilename(filename);
  if (!campaignDay) {
    console.log(`  ⏭️  Ignorando (não identificou dia): ${filename}`);
    return false;
  }

  const utmContent = getUTMContent(filename);
  let html = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // Regex para encontrar links internos (metaconstrutor.app.br)
  // Exclui links de descadastrar e email
  const linkRegex = /href="(https?:\/\/www\.metaconstrutor\.app\.br[^"]*)"/g;
  
  let match;
  let result = html;
  let offset = 0;

  // Primeiro encontra todos os matches
  const matches = [];
  while ((match = linkRegex.exec(html)) !== null) {
    const fullMatch = match[0]; // href="..."
    const url = match[1];       // the URL
    
    // Pula links de descadastrar/unsubscribe
    if (url.includes('descadastrar') || url.includes('unsubscribe')) {
      continue;
    }

    matches.push({ fullMatch, url });
  }

  if (matches.length === 0) {
    console.log(`  ⏭️  Sem links internos: ${filename}`);
    return false;
  }

  // Processa de trás pra frente pra não bagunçar os offsets
  for (const { fullMatch, url } of matches) {
    const encodedDest = encodeURIComponent(url);
    const trackingUrl = `${BASE_URL}/l/${campaignDay}?c={{CONTACT_ID}}&d=${encodedDest}&ct=${utmContent}`;
    const oldHref = `href="${url}"`;
    const newHref = `href="${trackingUrl}"`;
    
    // Troca no resultado
    const idx = result.indexOf(oldHref, offset > 0 ? offset - 100 : 0);
    if (idx !== -1) {
      result = result.substring(0, idx) + newHref + result.substring(idx + oldHref.length);
      offset = idx + newHref.length;
      modified = true;
      console.log(`  🔗 ${filename}: ${url.substring(0, 50)}... → /${campaignDay}/`);
    }
  }

  if (modified) {
    // Também adiciona UTM na imagem de marketing (se houver)
    const imgRegex = /src="(https?:\/\/www\.metaconstrutor\.app\.br\/marketing\/[^"]*)"/g;
    result = result.replace(imgRegex, (fullImg, imgUrl) => {
      if (imgUrl.includes('utm_')) return fullImg; // já tem UTM
      const imgWithUtm = `${imgUrl}${imgUrl.includes('?') ? '&' : '?'}utm_source=email&utm_medium=campanha26&utm_campaign=${campaignDay}`;
      return `src="${imgWithUtm}"`;
    });

    fs.writeFileSync(filePath, result, 'utf-8');
    console.log(`  ✅ ${filename} atualizado (${matches.length} links)`);
    return true;
  }

  return false;
}

function main() {
  console.log('🚀 Adicionando links de tracking nos templates...\n');

  const files = fs.readdirSync(CAMPANHA_DIR)
    .filter(f => f.endsWith('.html'))
    .sort();

  let totalModified = 0;
  let totalLinks = 0;

  for (const file of files) {
    const filePath = path.join(CAMPANHA_DIR, file);
    const result = processTemplate(filePath);
    if (result) totalModified++;
  }

  console.log(`\n📊 Resumo: ${totalModified}/${files.length} templates com tracking`);
  console.log(`📝 Lembrar: precisa substituir {{CONTACT_ID}} pelo contato real no envio`);
  console.log(`🌐 URLs tracking: ${BASE_URL}/l/dia-XX?c=CONTACT_ID&d=URL_ENCODED&ct=CONTENT_TYPE`);
}

main();
