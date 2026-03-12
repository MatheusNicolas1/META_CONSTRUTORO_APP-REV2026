#!/usr/bin/env node

/**
 * Script para verificar erros de tipo TypeScript no projeto
 */

import { exec } from 'child_process';
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

console.log(`${colors.cyan}🔍 Verificando tipos TypeScript...${colors.reset}\n`);

// Verificar se TypeScript está instalado
exec('npx tsc --version', (error) => {
  if (error) {
    console.log(`${colors.red}❌ TypeScript não encontrado. Instale com: npm install -D typescript${colors.reset}`);
    process.exit(1);
  }
  
  // Executar type check
  exec('npx tsc --noEmit', { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    const output = stdout || stderr;
    
    if (!output) {
      console.log(`${colors.green}✅ Nenhum erro de tipo encontrado!${colors.reset}`);
      process.exit(0);
    }
    
    // Separar erros por categoria
    const lines = output.split('\n');
    const errors = {
      any: [],
      property: [],
      module: [],
      other: []
    };
    
    lines.forEach(line => {
      if (line.includes('implicitly has an any type') || line.includes('any')) {
        errors.any.push(line);
      } else if (line.includes('Property') && line.includes('does not exist')) {
        errors.property.push(line);
      } else if (line.includes('Cannot find module')) {
        errors.module.push(line);
      } else if (line.trim()) {
        errors.other.push(line);
      }
    });
    
    // Estatísticas
    const totalErrors = errors.any.length + errors.property.length + 
                        errors.module.length + errors.other.length;
    
    console.log(`${colors.yellow}⚠️  Encontrados ${totalErrors} erros de tipo${colors.reset}\n`);
    
    if (errors.any.length > 0) {
      console.log(`${colors.magenta}📌 'any' implícito (${errors.any.length}):${colors.reset}`);
      errors.any.slice(0, 5).forEach(err => {
        console.log(`  ${err.substring(0, 200)}`);
      });
      if (errors.any.length > 5) {
        console.log(`  ... e mais ${errors.any.length - 5} erros`);
      }
      console.log('');
    }
    
    if (errors.property.length > 0) {
      console.log(`${colors.magenta}📌 Propriedades inexistentes (${errors.property.length}):${colors.reset}`);
      errors.property.slice(0, 5).forEach(err => {
        console.log(`  ${err.substring(0, 200)}`);
      });
      if (errors.property.length > 5) {
        console.log(`  ... e mais ${errors.property.length - 5} erros`);
      }
      console.log('');
    }
    
    if (errors.module.length > 0) {
      console.log(`${colors.magenta}📌 Módulos não encontrados (${errors.module.length}):${colors.reset}`);
      errors.module.slice(0, 5).forEach(err => {
        console.log(`  ${err.substring(0, 200)}`);
      });
      if (errors.module.length > 5) {
        console.log(`  ... e mais ${errors.module.length - 5} erros`);
      }
      console.log('');
    }
    
    if (errors.other.length > 0) {
      console.log(`${colors.magenta}📌 Outros erros (${errors.other.length}):${colors.reset}`);
      errors.other.slice(0, 5).forEach(err => {
        console.log(`  ${err.substring(0, 200)}`);
      });
      if (errors.other.length > 5) {
        console.log(`  ... e mais ${errors.other.length - 5} erros`);
      }
      console.log('');
    }
    
    // Sugestões de correção
    console.log(`${colors.blue}💡 Sugestões de correção:${colors.reset}`);
    
    if (errors.any.length > 0) {
      console.log('  - Para "any" implícito: defina tipos explícitos nas funções e variáveis');
      console.log('  - Exemplo: function (param: any) → function (param: string)');
    }
    
    if (errors.property.length > 0) {
      console.log('  - Para propriedades inexistentes: verifique se a interface/type tem o campo');
      console.log('  - Ou use optional chaining: objeto?.propriedade');
    }
    
    if (errors.module.length > 0) {
      console.log('  - Para módulos não encontrados: instale as dependências (@types/)');
      console.log('  - Exemplo: npm install -D @types/nome-do-modulo');
    }
    
    process.exit(1);
  });
});