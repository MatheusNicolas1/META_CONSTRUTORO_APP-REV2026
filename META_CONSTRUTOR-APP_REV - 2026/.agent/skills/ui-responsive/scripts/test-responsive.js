#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Verificar se puppeteer está instalado
let puppeteer;
try {
  puppeteer = await import('puppeteer');
} catch (error) {
  console.error('❌ Puppeteer não está instalado. Execute: npm install --save-dev puppeteer');
  process.exit(1);
}

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

// Breakpoints a testar
const BREAKPOINTS = [
  { name: 'mobile-360', width: 360, height: 800 },
  { name: 'mobile-480', width: 480, height: 900 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1024', width: 1024, height: 768 },
  { name: 'desktop-1366', width: 1366, height: 768 }
];

// Páginas a testar
const PAGES = [
  { path: '/', name: 'home' },
  { path: '/login', name: 'login' },
  { path: '/app/dashboard', name: 'dashboard', requiresAuth: true },
  { path: '/app/obras', name: 'obras-lista', requiresAuth: true },
  { path: '/app/obras/nova', name: 'obras-form', requiresAuth: true },
  { path: '/app/rdo', name: 'rdo-lista', requiresAuth: true }
];

// Credenciais de teste (se necessário)
const TEST_EMAIL = 'admin@teste.com';
const TEST_PASSWORD = 'senha123';

async function login(page) {
  try {
    await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle2' });
    
    await page.type('input[type="email"]', TEST_EMAIL);
    await page.type('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    return true;
  } catch (error) {
    console.log(`${colors.yellow}⚠️  Não foi possível fazer login: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testOverflow(page) {
  return page.evaluate(() => {
    const html = document.documentElement;
    
    const overflowX = html.scrollWidth > html.clientWidth;
    const overflowY = html.scrollHeight > html.clientHeight;
    
    return {
      overflowX,
      overflowY,
      scrollWidth: html.scrollWidth,
      clientWidth: html.clientWidth,
      scrollHeight: html.scrollHeight,
      clientHeight: html.clientHeight
    };
  });
}

async function testMenuMobile(page) {
  return page.evaluate(() => {
    // Procurar botão de menu hambúrguer (seletor comum)
    const menuButton = document.querySelector('button[aria-label="Menu"]') ||
                       document.querySelector('.menu-button') ||
                       document.querySelector('[data-testid="menu-button"]') ||
                       document.querySelector('.hamburger');
    
    if (!menuButton) {
      return { hasMenu: false };
    }
    
    // Clicar no menu
    menuButton.click();
    
    // Aguardar um pouco para o menu abrir
    return new Promise((resolve) => {
      setTimeout(() => {
        // Verificar se algum menu apareceu
        const menuVisible = document.querySelector('[role="dialog"]') ||
                            document.querySelector('.sheet-content') ||
                            document.querySelector('.menu-open');
        
        resolve({
          hasMenu: true,
          menuVisible: !!menuVisible
        });
      }, 500);
    });
  });
}

async function testTables(page) {
  return page.evaluate(() => {
    const tables = document.querySelectorAll('table');
    const results = [];
    
    tables.forEach((table, index) => {
      const parent = table.parentElement;
      const hasOverflow = parent ? parent.scrollWidth > parent.clientWidth : false;
      
      results.push({
        index: index + 1,
        hasOverflow,
        width: table.offsetWidth,
        parentWidth: parent ? parent.clientWidth : 0
      });
    });
    
    return results;
  });
}

async function main() {
  console.log(`${colors.cyan}📱 Testando responsividade...${colors.reset}\n`);
  
  // Criar diretório de screenshots se não existir
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };
  
  try {
    for (const breakpoint of BREAKPOINTS) {
      console.log(`\n${colors.blue}=== Breakpoint: ${breakpoint.name} (${breakpoint.width}px) ===${colors.reset}`);
      
      const page = await browser.newPage();
      await page.setViewport(breakpoint);
      
      for (const pageConfig of PAGES) {
        console.log(`\n📄 Testando: ${pageConfig.name}`);
        
        const testResult = {
          page: pageConfig.name,
          breakpoint: breakpoint.name,
          width: breakpoint.width,
          overflow: null,
          menu: null,
          tables: null,
          errors: []
        };
        
        try {
          // Navegar para a página
          await page.goto(`${APP_URL}${pageConfig.path}`, {
            waitUntil: 'networkidle2',
            timeout: 10000
          });
          
          // Se requer autenticação e não está logado, tentar login
          if (pageConfig.requiresAuth) {
            const currentUrl = page.url();
            if (currentUrl.includes('/login')) {
              const isLoggedIn = await login(page);
              if (!isLoggedIn) {
                testResult.errors.push('Falha no login');
              }
            }
          }
          
          // Aguardar um pouco para renderização completa
          await page.waitForTimeout(1000);
          
          // Testar overflow
          const overflow = await testOverflow(page);
          testResult.overflow = overflow;
          
          if (overflow.overflowX) {
            console.log(`   ${colors.red}❌ Overflow horizontal detectado (${overflow.scrollWidth} > ${overflow.clientWidth})${colors.reset}`);
            testResult.errors.push('Overflow horizontal');
          } else {
            console.log(`   ${colors.green}✅ Sem overflow${colors.reset}`);
          }
          
          // Testar menu mobile (apenas em mobile)
          if (breakpoint.width <= 768) {
            const menu = await testMenuMobile(page);
            testResult.menu = menu;
            
            if (menu.hasMenu && !menu.menuVisible) {
              console.log(`   ${colors.yellow}⚠️  Menu existe mas não abriu${colors.reset}`);
              testResult.errors.push('Menu não abre');
            } else if (!menu.hasMenu) {
              console.log(`   ${colors.yellow}⚠️  Menu mobile não encontrado${colors.reset}`);
            } else {
              console.log(`   ${colors.green}✅ Menu funcional${colors.reset}`);
            }
          }
          
          // Testar tabelas
          const tables = await testTables(page);
          testResult.tables = tables;
          
          const tablesWithIssues = tables.filter(t => t.hasOverflow);
          if (tablesWithIssues.length > 0) {
            console.log(`   ${colors.yellow}⚠️  ${tablesWithIssues.length} tabela(s) com overflow${colors.reset}`);
          }
          
          // Capturar screenshot
          const screenshotPath = path.join(
            SCREENSHOTS_DIR,
            `${breakpoint.name}-${pageConfig.name}.png`
          );
          await page.screenshot({ path: screenshotPath, fullPage: true });
          
          results.tests.push(testResult);
          
        } catch (error) {
          console.log(`   ${colors.red}❌ Erro: ${error.message}${colors.reset}`);
          testResult.errors.push(error.message);
          results.tests.push(testResult);
        }
      }
      
      await page.close();
    }
    
    // Gerar relatório
    const reportPath = path.join(process.cwd(), 'responsive-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    
    console.log(`\n${colors.blue}=== RESUMO ===${colors.reset}`);
    
    const totalTests = results.tests.length;
    const testsWithErrors = results.tests.filter(t => t.errors.length > 0).length;
    
    console.log(`📊 Total de testes: ${totalTests}`);
    console.log(`❌ Com erros: ${testsWithErrors}`);
    
    if (testsWithErrors === 0) {
      console.log(`\n${colors.green}✅ Todos os testes de responsividade passaram!${colors.reset}`);
    } else {
      console.log(`\n${colors.yellow}⚠️  Problemas de responsividade encontrados. Verifique o relatório.${colors.reset}`);
    }
    
    console.log(`📁 Relatório: ${reportPath}`);
    console.log(`📁 Screenshots: ${SCREENSHOTS_DIR}`);
    
  } finally {
    await browser.close();
  }
  
  process.exit(0);
}

main().catch((error) => {
  console.error(`${colors.red}Erro fatal:${colors.reset}`, error);
  process.exit(1);
});