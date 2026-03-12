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

const SRC_DIR = path.join(process.cwd(), 'src');
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', '.agent', 'test', '__tests__'];

// Padrões de mutação direta
const MUTATION_PATTERNS = [
  {
    pattern: /\.insert\(/,
    type: 'INSERT',
    severity: 'MÉDIO',
    description: 'Insert direto no frontend'
  },
  {
    pattern: /\.update\(/,
    type: 'UPDATE',
    severity: 'ALTO',
    description: 'Update direto no frontend'
  },
  {
    pattern: /\.delete\(/,
    type: 'DELETE',
    severity: 'CRÍTICO',
    description: 'Delete direto no frontend'
  },
  {
    pattern: /\.upsert\(/,
    type: 'UPSERT',
    severity: 'ALTO',
    description: 'Upsert direto no frontend'
  }
];

// Padrões de query sem where
const UNSAFE_WHERE_PATTERNS = [
  {
    pattern: /\.delete\(\s*\)/,
    type: 'DELETE_NO_WHERE',
    severity: 'CRÍTICO',
    description: 'Delete sem cláusula WHERE'
  }
];

// Padrões de service role no frontend
const SERVICE_ROLE_PATTERNS = [
  {
    pattern: /SUPABASE_SERVICE_ROLE_KEY/,
    type: 'SERVICE_ROLE',
    severity: 'CRÍTICO',
    description: 'Service role key no frontend'
  },
  {
    pattern: /service_role/,
    type: 'SERVICE_ROLE',
    severity: 'CRÍTICO',
    description: 'Referência a service_role no frontend'
  }
];

let totalFiles = 0;
let findings = [];

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const fileName = path.relative(process.cwd(), filePath);
    
    // Ignorar arquivos de configuração do Supabase
    if (fileName.includes('supabase/client') || fileName.includes('supabase/server')) {
      return;
    }
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Verificar padrões de mutação
      for (const pattern of MUTATION_PATTERNS) {
        if (line.match(pattern.pattern)) {
          findings.push({
            file: fileName,
            line: i + 1,
            type: pattern.type,
            severity: pattern.severity,
            description: pattern.description,
            code: line.trim()
          });
        }
      }
      
      // Verificar padrões inseguros (delete/update sem where)
      for (const pattern of UNSAFE_WHERE_PATTERNS) {
        if (line.match(pattern.pattern)) {
          findings.push({
            file: fileName,
            line: i + 1,
            type: pattern.type,
            severity: pattern.severity,
            description: pattern.description,
            code: line.trim()
          });
        }
      }
      
      // Verificar service role
      for (const pattern of SERVICE_ROLE_PATTERNS) {
        if (line.match(pattern.pattern)) {
          findings.push({
            file: fileName,
            line: i + 1,
            type: pattern.type,
            severity: pattern.severity,
            description: pattern.description,
            code: line.trim()
          });
        }
      }
    }
  } catch (error) {
    console.log(`${colors.yellow}⚠️  Erro ao ler ${filePath}: ${error.message}${colors.reset}`);
  }
}

function walkDir(dir) {
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        if (!IGNORE_DIRS.includes(file)) {
          walkDir(filePath);
        }
      } else {
        if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
          totalFiles++;
          scanFile(filePath);
        }
      }
    }
  } catch (error) {
    console.log(`${colors.yellow}⚠️  Erro ao acessar diretório ${dir}: ${error.message}${colors.reset}`);
  }
}

async function main() {
  console.log(`${colors.cyan}🔍 Detectando mutações diretas no frontend...${colors.reset}\n`);
  
  if (!fs.existsSync(SRC_DIR)) {
    console.log(`${colors.red}❌ Pasta src/ não encontrada!${colors.reset}`);
    console.log(`Caminho procurado: ${SRC_DIR}`);
    process.exit(1);
  }
  
  walkDir(SRC_DIR);
  
  console.log(`📊 Arquivos verificados: ${totalFiles}`);
  console.log(`🔍 Problemas encontrados: ${findings.length}\n`);
  
  // Agrupar por severidade
  const critical = findings.filter(f => f.severity === 'CRÍTICO');
  const high = findings.filter(f => f.severity === 'ALTO');
  const medium = findings.filter(f => f.severity === 'MÉDIO');
  
  if (critical.length > 0) {
    console.log(`${colors.red}🔴 PROBLEMAS CRÍTICOS (${critical.length}):${colors.reset}`);
    critical.slice(0, 10).forEach(f => {
      console.log(`   - ${f.file}:${f.line} - ${f.description}`);
      console.log(`     ${f.code.substring(0, 80)}`);
    });
    if (critical.length > 10) {
      console.log(`   ... e mais ${critical.length - 10}`);
    }
    console.log('');
  }
  
  if (high.length > 0) {
    console.log(`${colors.yellow}🟠 PROBLEMAS ALTOS (${high.length}):${colors.reset}`);
    high.slice(0, 10).forEach(f => {
      console.log(`   - ${f.file}:${f.line} - ${f.description}`);
    });
    if (high.length > 10) {
      console.log(`   ... e mais ${high.length - 10}`);
    }
    console.log('');
  }
  
  if (medium.length > 0) {
    console.log(`${colors.blue}🟡 PROBLEMAS MÉDIOS (${medium.length}):${colors.reset}`);
    medium.slice(0, 10).forEach(f => {
      console.log(`   - ${f.file}:${f.line} - ${f.description}`);
    });
    if (medium.length > 10) {
      console.log(`   ... e mais ${medium.length - 10}`);
    }
    console.log('');
  }
  
  // Resumo
  console.log(`${colors.blue}=== RESUMO ===${colors.reset}`);
  console.log(`🔴 Críticos: ${critical.length}`);
  console.log(`🟠 Altos: ${high.length}`);
  console.log(`🟡 Médios: ${medium.length}`);
  console.log(`📊 Total: ${findings.length}`);
  
  // Salvar resultados em arquivo
  try {
    const reportPath = path.join(process.cwd(), 'security-monitor-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      totalFiles,
      findings,
      summary: {
        critical: critical.length,
        high: high.length,
        medium: medium.length,
        total: findings.length
      }
    }, null, 2));
    
    console.log(`\n📁 Relatório salvo em: ${reportPath}`);
  } catch (error) {
    console.log(`${colors.yellow}⚠️  Erro ao salvar relatório: ${error.message}${colors.reset}`);
  }
  
  if (critical.length > 0) {
    console.log(`\n${colors.red}❌ BLOQUEADOR: Problemas críticos encontrados. Corrija antes do deploy.${colors.reset}`);
    process.exit(1);
  }
  
  if (findings.length > 0) {
    console.log(`\n${colors.yellow}⚠️  Problemas de segurança encontrados. Planeje migração para Edge Functions.${colors.reset}`);
    process.exit(0);
  }
  
  console.log(`\n${colors.green}✅ Nenhuma mutação direta perigosa encontrada!${colors.reset}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(`${colors.red}Erro fatal:${colors.reset}`, error);
  process.exit(1);
});