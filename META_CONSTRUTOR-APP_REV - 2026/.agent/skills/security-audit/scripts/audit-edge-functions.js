#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

const FUNCTIONS_DIR = path.join(process.cwd(), 'supabase', 'functions');

// Padrões de segurança a procurar
const SECURITY_PATTERNS = [
  {
    pattern: /requireAuth|getAuthUser|auth\.uid/,
    description: 'Autenticação',
    required: true
  },
  {
    pattern: /z\.object|validate|schema\.parse/,
    description: 'Validação de input',
    required: true
  },
  {
    pattern: /rateLimit|RateLimiter|retryAfter/,
    description: 'Rate limiting',
    required: false
  },
  {
    pattern: /cors\.ts|CORS/,
    description: 'CORS configurado',
    required: true
  },
  {
    pattern: /try.*catch|\.catch\(/,
    description: 'Tratamento de erros',
    required: true
  }
];

// Funções que são naturalmente públicas (webhooks, etc)
const PUBLIC_FUNCTIONS = ['stripe-webhook', 'health-check'];

async function main() {
  console.log(`${colors.cyan}🔍 Auditando Edge Functions...${colors.reset}\n`);
  
  if (!fs.existsSync(FUNCTIONS_DIR)) {
    console.log(`${colors.yellow}⚠️  Pasta supabase/functions/ não encontrada.${colors.reset}`);
    process.exit(0);
  }
  
  const functions = fs.readdirSync(FUNCTIONS_DIR)
    .filter(f => fs.statSync(path.join(FUNCTIONS_DIR, f)).isDirectory());
  
  if (functions.length === 0) {
    console.log(`${colors.yellow}⚠️  Nenhuma edge function encontrada.${colors.reset}`);
    process.exit(0);
  }
  
  console.log(`📊 Edge functions encontradas: ${functions.length}\n`);
  
  const results = {
    vulnerable: [],
    missingAuth: [],
    missingValidation: [],
    missingRateLimit: [],
    insecure: []
  };
  
  for (const func of functions) {
    const indexPath = path.join(FUNCTIONS_DIR, func, 'index.ts');
    const sharedPath = path.join(FUNCTIONS_DIR, '_shared');
    
    if (!fs.existsSync(indexPath)) continue;
    
    const content = fs.readFileSync(indexPath, 'utf8');
    const isPublic = PUBLIC_FUNCTIONS.includes(func);
    
    console.log(`📁 Analisando: ${func}${isPublic ? ' (pública)' : ''}`);
    
    const findings = [];
    
    // Verificar cada padrão de segurança
    for (const pattern of SECURITY_PATTERNS) {
      const hasPattern = pattern.pattern.test(content);
      
      if (!hasPattern && pattern.required && !isPublic) {
        findings.push({
          type: pattern.description,
          severity: 'high'
        });
        
        if (pattern.description === 'Autenticação') {
          results.missingAuth.push(func);
        } else if (pattern.description === 'Validação de input') {
          results.missingValidation.push(func);
        } else if (pattern.description === 'Rate limiting') {
          results.missingRateLimit.push(func);
        }
      }
    }
    
    // Verificar imports de shared (segurança)
    if (!content.includes('_shared') && !isPublic) {
      findings.push({
        type: 'Não usa shared utilities',
        severity: 'medium'
      });
    }
    
    // Verificar uso direto de service role sem validação
    if (content.includes('SUPABASE_SERVICE_ROLE_KEY') && !content.includes('requireAuth')) {
      findings.push({
        type: 'Service role sem autenticação',
        severity: 'critical'
      });
      results.insecure.push(func);
    }
    
    if (findings.length > 0) {
      results.vulnerable.push({ func, findings });
      console.log(`   ${colors.yellow}⚠️  ${findings.length} problema(s) encontrado(s)${colors.reset}`);
    } else {
      console.log(`   ${colors.green}✅ OK${colors.reset}`);
    }
  }
  
  // Resultados
  console.log(`\n${colors.blue}=== RESUMO ===${colors.reset}`);
  
  if (results.insecure.length > 0) {
    console.log(`\n${colors.red}🔴 CRÍTICO - Funções com service role sem autenticação:${colors.reset}`);
    results.insecure.forEach(f => console.log(`   - ${f}`));
  }
  
  if (results.missingAuth.length > 0) {
    console.log(`\n${colors.red}🔴 Funções sem autenticação:${colors.reset}`);
    results.missingAuth.forEach(f => console.log(`   - ${f}`));
  }
  
  if (results.missingValidation.length > 0) {
    console.log(`\n${colors.yellow}🟡 Funções sem validação de input:${colors.reset}`);
    results.missingValidation.slice(0, 5).forEach(f => console.log(`   - ${f}`));
  }
  
  if (results.missingRateLimit.length > 0) {
    console.log(`\n${colors.yellow}🟡 Funções sem rate limiting:${colors.reset}`);
    results.missingRateLimit.slice(0, 5).forEach(f => console.log(`   - ${f}`));
  }
  
  console.log(`\n✅ Funções seguras: ${functions.length - results.vulnerable.length}`);
  console.log(`⚠️  Funções com problemas: ${results.vulnerable.length}`);
  
  if (results.insecure.length > 0 || results.missingAuth.length > 0) {
    console.log(`\n${colors.red}❌ BLOQUEADOR: Problemas críticos de segurança em edge functions.${colors.reset}`);
    process.exit(1);
  }
  
  if (results.vulnerable.length > 0) {
    console.log(`\n${colors.yellow}⚠️  Problemas de segurança encontrados. Revise antes do deploy.${colors.reset}`);
    process.exit(0);
  }
  
  console.log(`\n${colors.green}✅ Edge functions estão seguras!${colors.reset}`);
  process.exit(0);
}

main().catch(console.error);