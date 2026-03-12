#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log(`${colors.red}❌ Variáveis de ambiente não encontradas!${colors.reset}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ENUM_CHECKS = [
  {
    table: 'obras',
    column: 'status',
    validValues: ['DRAFT', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELED'],
    description: 'Status da obra'
  },
  {
    table: 'rdos',
    column: 'status',
    validValues: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'],
    description: 'Status do RDO'
  },
  {
    table: 'org_members',
    column: 'role',
    validValues: ['ADMIN', 'MANAGER', 'MEMBER'],
    description: 'Papel do membro'
  },
  {
    table: 'org_members',
    column: 'status',
    validValues: ['ACTIVE', 'INVITED', 'DISABLED'],
    description: 'Status do membro'
  }
];

async function main() {
  console.log(`${colors.cyan}🔍 Verificando valores de enum...${colors.reset}\n`);
  
  let totalProblems = 0;
  
  for (const check of ENUM_CHECKS) {
    try {
      const { data, error } = await supabase
        .from(check.table)
        .select(check.column)
        .not(check.column, 'is', null);
      
      if (error) {
        console.log(`${colors.yellow}⚠️  Não foi possível verificar ${check.table}.${check.column}${colors.reset}`);
        continue;
      }
      
      const values = [...new Set(data.map(item => item[check.column]))];
      const invalidValues = values.filter(v => !check.validValues.includes(v));
      
      if (invalidValues.length > 0) {
        totalProblems += invalidValues.length;
        console.log(`${colors.yellow}⚠️  ${check.table}.${check.column} (${check.description})${colors.reset}`);
        console.log(`   Valores inválidos encontrados: ${invalidValues.join(', ')}`);
        console.log(`   Valores permitidos: ${check.validValues.join(', ')}`);
        console.log('');
      }
    } catch (e) {
      console.log(`${colors.yellow}⚠️  Erro em ${check.table}: ${e.message}${colors.reset}`);
    }
  }
  
  if (totalProblems === 0) {
    console.log(`${colors.green}✅ Todos os enums estão com valores válidos!${colors.reset}`);
  } else {
    console.log(`${colors.yellow}💡 Corrija atualizando os registros para valores canônicos:${colors.reset}`);
    console.log(`
UPDATE tabela SET coluna = 'VALOR_CORRETO' WHERE coluna IN ('valor_errado1', 'valor_errado2');
    `);
  }
}

main().catch(console.error);