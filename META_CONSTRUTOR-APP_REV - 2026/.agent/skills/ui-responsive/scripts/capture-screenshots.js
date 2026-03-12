#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const APP_URL = process.env.VITE_APP_URL || 'http://localhost:5173';
const SCREENSHOTS_DIR = path.join(process.cwd(), 'screenshots');

// Breakpoints para captura
const BREAKPOINTS = [
  { name: 'mobile', width: 360, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1366, height: 768 }
];

// Páginas para capturar
const PAGES = [
  { path: '/', name: 'home' },
  { path: '/login', name: 'login' },
  { path: '/preco', name: 'precos' },
  { path: '/sobre', name: 'sobre' },
  { path: '/contato', name: 'contato' },
  { path: '/app/dashboard', name: 'dashboard', requiresAuth: true },
  { path: '/app/obras', name: 'obras-lista', requiresAuth: true },
  { path: '/app/obras/nova', name: 'obras-form', requiresAuth: true },
  { path: '/app/rdo', name: 'rdo-lista', requiresAuth: true },
  { path: '/app/rdo/visualizar/1', name: 'rdo-visualizar', requiresAuth: true },
  { path: '/app/equipes', name: 'equipes', requiresAuth: true },
  { path: '/app/equipamentos', name: 'equipamentos', requiresAuth: true },
  { path: '/app/fornecedores', name: 'fornecedores', requiresAuth: true }
];

// Credenciais de teste
const TEST_EMAIL = 'admin@teste.com';
const TEST_PASSWORD = 'senha123';

async function login(page) {
  try {
    await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle2' });
    
    await page.type('input[type="email"]', TEST_EMAIL);
    await page.type('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log(`   ${colors.green}✅ Login realizado${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`   ${colors.yellow}⚠️  Não foi possível fazer login: ${error.message}${colors.reset}`);
    return false;
  }
}

async function main() {
  console.log(`${colors.cyan}📸 Capturando screenshots para análise de responsividade...${colors.reset}\n`);
  
  // Criar diretório de screenshots se não existir
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    console.log(`📁 Pasta criada: ${SCREENSHOTS_DIR}`);
  }
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  let totalScreenshots = 0;
  
  try {
    for (const breakpoint of BREAKPOINTS) {
      console.log(`\n${colors.blue}=== Breakpoint: ${breakpoint.name} (${breakpoint.width}px) ===${colors.reset}`);
      
      const breakpointDir = path.join(SCREENSHOTS_DIR, breakpoint.name);
      if (!fs.existsSync(breakpointDir)) {
        fs.mkdirSync(breakpointDir, { recursive: true });
      }
      
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport(breakpoint);
      
      for (const pageConfig of PAGES) {
        console.log(`\n📄 Capturando: ${pageConfig.name}`);
        
        try {
          // Navegar para a página
          await page.goto(`${APP_URL}${pageConfig.path}`, {
            waitUntil: 'networkidle2',
            timeout: 10000
          }).catch(() => {
            // Ignorar erro de timeout
          });
          
          // Se requer autenticação, tentar login
          if (pageConfig.requiresAuth) {
            const isLoggedIn = await login(page);
            if (!isLoggedIn) {
              console.log(`   ${colors.yellow}⚠️  Pulando (requer login)${colors.reset}`);
              continue;
            }
          }
          
          // Aguardar um pouco para renderização completa
          await page.waitForTimeout(1000);
          
          // Capturar screenshot
          const filename = `${pageConfig.name}.png`;
          const filepath = path.join(breakpointDir, filename);
          
          await page.screenshot({
            path: filepath,
            fullPage: true,
            captureBeyondViewport: true
          });
          
          console.log(`   ${colors.green}✅ Salvo: ${breakpoint.name}/${filename}${colors.reset}`);
          totalScreenshots++;
          
        } catch (error) {
          console.log(`   ${colors.red}❌ Erro: ${error.message}${colors.reset}`);
        }
      }
      
      await context.close();
    }
    
    console.log(`\n${colors.green}✅ Captura concluída!${colors.reset}`);
    console.log(`📊 Total de screenshots: ${totalScreenshots}`);
    console.log(`📁 Pasta: ${SCREENSHOTS_DIR}`);
    
    // Criar arquivo de índice
    const indexFile = path.join(SCREENSHOTS_DIR, 'index.html');
    const html = generateIndexHTML();
    fs.writeFileSync(indexFile, html);
    
    console.log(`📁 Índice HTML: ${indexFile}`);
    
  } finally {
    await browser.close();
  }
  
  process.exit(0);
}

function generateIndexHTML() {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Screenshots - UI Responsive</title>
  <style>
    body { font-family: Arial; margin: 20px; background: #f5f5f5; }
    h1 { color: #333; }
    .breakpoint { margin: 30px 0; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .breakpoint h2 { margin-top: 0; color: #2196F3; }
    .screenshots { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .screenshot { border: 1px solid #ddd; border-radius: 4px; overflow: hidden; background: white; }
    .screenshot img { width: 100%; height: auto; display: block; }
    .screenshot .caption { padding: 10px; background: #f9f9f9; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
    .screenshot .caption .page { font-weight: bold; color: #333; display: block; margin-bottom: 4px; }
  </style>
</head>
<body>
  <h1>📸 Screenshots - Análise de Responsividade</h1>
  
  ${BREAKPOINTS.map(bp => {
    const files = fs.readdirSync(path.join(SCREENSHOTS_DIR, bp.name))
      .filter(f => f.endsWith('.png'))
      .sort();
    
    return `
    <div class="breakpoint">
      <h2>${bp.name.toUpperCase()} (${bp.width}x${bp.height})</h2>
      <div class="screenshots">
        ${files.map(f => {
          const pageName = f.replace('.png', '');
          return `
          <div class="screenshot">
            <img src="${bp.name}/${f}" alt="${pageName}">
            <div class="caption">
              <span class="page">📄 ${pageName}</span>
              ${bp.width}x${bp.height}
            </div>
          </div>
          `;
        }).join('')}
      </div>
    </div>
    `;
  }).join('')}
</body>
</html>`;
}

main().catch((error) => {
  console.error(`${colors.red}Erro fatal:${colors.reset}`, error);
  process.exit(1);
});