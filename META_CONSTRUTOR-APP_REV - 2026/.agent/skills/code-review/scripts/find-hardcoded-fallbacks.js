#!/usr/bin/env node

/**
 * Script para encontrar fallbacks hardcoded e dados fictícios no código
 */

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
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', '.agent', 'test', '__tests__', 'tests'];

// Padrões suspeitos
const PATTERNS = [
  {
    name: 'mock data',
    regex: /\b(mock|fake|dummy|sample)[A-Za-z]*\s*=\s*\[/gi,
    description: 'Array mock encontrado'
  },
  {
    name: 'fallback com objeto hardcoded',
    regex: /\|\|\s*\{\s*(id|nome|title|descrição):\s*[0-9"'`]/gi,
    description: 'Fallback com objeto hardcoded'
  },
  {
    name: 'contador hardcoded',
    regex: /(atividades|equipamentos|notas|total|count)\s*=\s*\{\s*[0-9]+\s*\}/gi,
    description: 'Contador com valor fixo'
  },
  {
    name: 'dados de exemplo',
    regex: /(exemplo|teste|sample|demo)\s*[:=]\s*["'`][^"'`]*["'`]/gi,
    description: 'String com dado de exemplo'
  },
  {
    name: 'fallback de array vazio com dados',
    regex: /\|\|\s*\[\s*\{\s*[^\]]+\}\s*\]/gi,
    description: 'Fallback de array com objetos dentro'
  },
  {
    name: 'nomes de obras hardcoded',
    regex: /["'`](Residencial|Edifício|Obra|Prédio)\s+[A-Za-z]+\s+[A-Za-z]+["'`]/gi,
    description: 'Nome de obra hardcoded'
  }
];

// Arquivos a ignorar
const IGNORE_FILES = [
  'vite-env.d.ts',
  'index.ts',
  'main.tsx',
  'setupTests.ts'
];

let totalFiles = 0;
let findings = [];

function shouldIgnoreFile(filename) {
  return IGNORE_FILES.includes(filename) ||
    filename.endsWith('.d.ts') ||
    filename.includes('.test.') ||
    filename.includes('.spec.');
}

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    PATTERNS.forEach(pattern => {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (pattern.regex.test(line)) {
          findings.push({
            file: path.relative(process.cwd(), filePath),
            line: i + 1,
            pattern: pattern.name,
            description: pattern.description,
            code: line.trim()
          });
        }
      }
    });
  } catch (error) {
    console.error(`${colors.red}Erro ao ler arquivo ${filePath}:${colors.reset}`, error.message);
  }
}

function walkDir(dir) {
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
        if (!shouldIgnoreFile(file)) {
          totalFiles++;
          scanFile(filePath);
        }
      }
    }
  }
}

console.log(`${colors.cyan}🔍 Procurando fallbacks hardcoded e dados fictícios...${colors.reset}\n`);

if (!fs.existsSync(SRC_DIR)) {
  console.log(`${colors.red}❌ Pasta src/ não encontrada!${colors.reset}`);
  process.exit(1);
}

walkDir(SRC_DIR);

console.log(`📊 Arquivos verificados: ${totalFiles}`);

if (findings.length === 0) {
  console.log(`${colors.green}✅ Nenhum fallback hardcoded encontrado!${colors.reset}`);
} else {
  console.log(`${colors.yellow}⚠️  Encontrados ${findings.length} possíveis problemas:${colors.reset}\n`);

  findings.sort((a, b) => a.file.localeCompare(b.file));

  let currentFile = '';
  findings.forEach((f, index) => {
    if (f.file !== currentFile) {
      currentFile = f.file;
      console.log(`\n${colors.cyan}📁 ${f.file}${colors.reset}`);
    }
    console.log(`  ${colors.yellow}Linha ${f.line}:${colors.reset} ${f.description}`);
    console.log(`  ${colors.magenta}→${colors.reset} ${f.code.substring(0, 100)}${f.code.length > 100 ? '...' : ''}`);
  });

  console.log(`\n${colors.yellow}💡 Dicas de correção:${colors.reset}`);
  console.log('  - Arrays mock: remova e use dados reais do banco');
  console.log('  - Fallbacks hardcoded: substitua por empty state ou skeleton');
  console.log('  - Contadores fixos: busque do banco via query');
  console.log('  - Dados de exemplo: remova ou use apenas em ambiente de desenvolvimento');
}

process.exit(findings.length > 0 ? 1 : 0);