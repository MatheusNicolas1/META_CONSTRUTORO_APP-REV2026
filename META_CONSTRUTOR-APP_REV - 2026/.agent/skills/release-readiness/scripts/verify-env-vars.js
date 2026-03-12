#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

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

const REQUIRED_VARS = [
  { name: 'VITE_SUPABASE_URL', description: 'URL do Supabase (frontend)' },
  { name: 'VITE_SUPABASE_ANON_KEY', description: 'Chave anônima do Supabase (frontend)' },
  { name: 'VITE_APP_URL', description: 'URL da aplicação' }
];

const OPTIONAL_VARS = [
  { name: 'VITE_SENTRY_DSN', description: 'Sentry DSN (opcional)' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', description: 'Chave de serviço (backend/scripts)' },
  { name: 'STRIPE_SECRET_KEY', description: 'Chave secreta Stripe' },
  { name: 'STRIPE_WEBHOOK_SECRET', description: 'Segredo do webhook Stripe' }
];

const SENSITIVE_PATTERNS = [
  { pattern: /sk_live_/, description: 'Chave Stripe LIVE - cuidado com produção' },
  { pattern: /service_role/, description: 'Service role key - NÃO usar no frontend' },
  { pattern: /localhost/, description: 'URL apontando para localhost' }
];

async function main() {
  console.log(`${colors.cyan}🔍 Verificando variáveis de ambiente...${colors.reset}\n`);
  
  const envLocalPath = path.join(process.cwd(), '.env.local');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  if (!fs.existsSync(envLocalPath)) {
    console.log(`${colors.red}❌ Arquivo .env.local não encontrado!${colors.reset}`);
    console.log('Crie um arquivo .env.local baseado no .env.example');
    process.exit(1);
  }
  
  // Carregar variáveis do .env.local
  const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
  
  const missingRequired = [];
  const missingOptional = [];
  const warnings = [];
  const foundVars = [];
  
  // Verificar variáveis obrigatórias
  console.log(`${colors.blue}📌 Verificando variáveis obrigatórias:${colors.reset}`);
  
  for (const req of REQUIRED_VARS) {
    const value = envConfig[req.name];
    
    if (!value || value.trim() === '') {
      missingRequired.push(req);
      console.log(`   ${colors.red}❌ Faltando: ${req.name} (${req.description})${colors.reset}`);
    } else {
      foundVars.push(req.name);
      
      // Verificar placeholders
      if (value.includes('your-') || value.includes('sua-') || value === 'changeme' || value.includes('...')) {
        warnings.push({
          name: req.name,
          issue: 'Placeholder não substituído'
        });
        console.log(`   ${colors.yellow}⚠️  Placeholder: ${req.name} ainda contém valor de exemplo${colors.reset}`);
      } else {
        console.log(`   ${colors.green}✅ OK: ${req.name}${colors.reset}`);
      }
    }
  }
  
  // Verificar variáveis opcionais
  console.log(`\n${colors.blue}📌 Verificando variáveis opcionais:${colors.reset}`);
  
  for (const opt of OPTIONAL_VARS) {
    const value = envConfig[opt.name];
    
    if (!value || value.trim() === '') {
      missingOptional.push(opt);
      console.log(`   ${colors.yellow}⚠️  Não encontrada: ${opt.name} (${opt.description})${colors.reset}`);
    } else {
      console.log(`   ${colors.green}✅ OK: ${opt.name}${colors.reset}`);
      foundVars.push(opt.name);
    }
  }
  
  // Verificar padrões sensíveis
  console.log(`\n${colors.blue}📌 Verificando segurança:${colors.reset}`);
  
  for (const [name, value] of Object.entries(envConfig)) {
    if (!value) continue;
    
    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.pattern.test(value)) {
        console.log(`   ${colors.yellow}⚠️  ${name}: ${pattern.description}${colors.reset}`);
        warnings.push({
          name: name,
          issue: pattern.description
        });
      }
    }
  }
  
  // Verificar .env.example
  console.log(`\n${colors.blue}📌 Verificando .env.example:${colors.reset}`);
  
  if (!fs.existsSync(envExamplePath)) {
    console.log(`   ${colors.yellow}⚠️  .env.example não encontrado - crie um template para novos devs${colors.reset}`);
  } else {
    const exampleContent = fs.readFileSync(envExamplePath, 'utf8');
    const missingInExample = [];
    
    for (const req of REQUIRED_VARS) {
      if (!exampleContent.includes(req.name)) {
        missingInExample.push(req.name);
      }
    }
    
    for (const opt of OPTIONAL_VARS) {
      if (!exampleContent.includes(opt.name)) {
        missingInExample.push(opt.name);
      }
    }
    
    if (missingInExample.length > 0) {
      console.log(`   ${colors.yellow}⚠️  Variáveis faltando no .env.example:${colors.reset}`);
      missingInExample.slice(0, 5).forEach(v => console.log(`      - ${v}`));
    } else {
      console.log(`   ${colors.green}✅ .env.example contém todas as variáveis${colors.reset}`);
    }
  }
  
  // Resumo
  console.log(`\n${colors.blue}=== RESUMO ===${colors.reset}`);
  console.log(`✅ Variáveis encontradas: ${foundVars.length}`);
  console.log(`❌ Obrigatórias faltando: ${missingRequired.length}`);
  console.log(`⚠️  Opcionais faltando: ${missingOptional.length}`);
  console.log(`⚠️  Avisos de segurança: ${warnings.length}`);
  
  if (missingRequired.length > 0) {
    console.log(`\n${colors.red}❌ BLOQUEADOR: Variáveis obrigatórias faltando. Corrija antes do deploy.${colors.reset}`);
    process.exit(1);
  }
  
  if (warnings.length > 0) {
    console.log(`\n${colors.yellow}⚠️  Avisos encontrados. Revise antes do deploy.${colors.reset}`);
  } else {
    console.log(`\n${colors.green}✅ Todas as verificações concluídas!${colors.reset}`);
  }
  
  process.exit(0);
}

main().catch((error) => {
  console.error(`${colors.red}Erro fatal:${colors.reset}`, error);
  process.exit(1);
});