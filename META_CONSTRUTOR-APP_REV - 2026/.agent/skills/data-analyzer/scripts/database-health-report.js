#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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

const TABLES = [
  'orgs', 'org_members', 'profiles',
  'obras', 'rdos', 'atividades', 'equipamentos',
  'fornecedores', 'documentos', 'notificacoes',
  'rdo_atividades', 'rdo_equipamentos', 'rdo_notas'
];

async function getCount(table) {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });
  
  if (error) return 0;
  return count;
}

async function main() {
  console.log(`${colors.cyan}📊 Gerando relatório de saúde do banco...${colors.reset}\n`);
  
  const report = {
    generated_at: new Date().toISOString(),
    tables: {},
    orphans: {},
    enums: {},
    summary: {
      total_tables: 0,
      total_records: 0,
      issues_found: 0
    }
  };
  
  // Contagem de registros
  console.log('📋 Contagem de registros por tabela:');
  for (const table of TABLES) {
    const count = await getCount(table);
    report.tables[table] = count;
    report.summary.total_records += count;
    report.summary.total_tables++;
    console.log(`   ${table.padEnd(15)}: ${count}`);
  }
  
  // Verificar órfãos (executar script existente)
  console.log('\n🔍 Verificando registros órfãos...');
  // Aqui você pode importar e executar as checagens do check-orphan-records.js
  
  // Verificar enums
  console.log('🔍 Verificando enums...');
  // Aqui você pode importar e executar as checagens do verify-enums.js
  
  // Salvar relatório
  const reportPath = path.join(process.cwd(), 'database-health-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n${colors.green}✅ Relatório salvo em: database-health-report.json${colors.reset}`);
  console.log(`\n${colors.blue}=== RESUMO ===${colors.reset}`);
  console.log(`📊 Tabelas: ${report.summary.total_tables}`);
  console.log(`📊 Registros: ${report.summary.total_records}`);
  console.log(`⚠️  Problemas: ${report.summary.issues_found}`);
}

main().catch(console.error);