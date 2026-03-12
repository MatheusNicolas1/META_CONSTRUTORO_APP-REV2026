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
  console.log('Crie um arquivo .env.local com:');
  console.log('VITE_SUPABASE_URL=sua-url');
  console.log('SUPABASE_SERVICE_ROLE_KEY=sua-chave');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const MAIN_TABLES = [
  'orgs', 'org_members', 'profiles',
  'obras', 'rdos', 'atividades', 'equipamentos',
  'fornecedores', 'documentos', 'notificacoes'
];

function isSnakeCase(str) {
  return /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/.test(str);
}

async function getTables() {
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');
  
  if (error) {
    console.log(`${colors.red}❌ Erro ao buscar tabelas:${colors.reset}`, error.message);
    return [];
  }
  
  return data.map(t => t.table_name);
}

async function getColumns(tableName) {
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type')
    .eq('table_schema', 'public')
    .eq('table_name', tableName);
  
  if (error) {
    return [];
  }
  
  return data;
}

async function main() {
  console.log(`${colors.cyan}🔍 Verificando nomenclatura do banco de dados...${colors.reset}\n`);
  
  const allTables = await getTables();
  
  if (allTables.length === 0) {
    console.log(`${colors.yellow}⚠️  Nenhuma tabela encontrada.${colors.reset}`);
    process.exit(0);
  }
  
  console.log(`📊 Total de tabelas: ${allTables.length}\n`);
  
  const results = {
    tablesChecked: 0,
    columnsChecked: 0,
    invalidTables: [],
    invalidColumns: []
  };
  
  for (const tableName of MAIN_TABLES) {
    if (!allTables.includes(tableName)) {
      console.log(`${colors.yellow}⚠️  Tabela não encontrada: ${tableName}${colors.reset}`);
      continue;
    }
    
    results.tablesChecked++;
    
    if (!isSnakeCase(tableName)) {
      results.invalidTables.push(tableName);
    }
    
    const columns = await getColumns(tableName);
    
    for (const col of columns) {
      results.columnsChecked++;
      
      if (!isSnakeCase(col.column_name)) {
        results.invalidColumns.push({
          table: tableName,
          column: col.column_name,
          suggestion: col.column_name.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')
        });
      }
    }
  }
  
  if (results.invalidTables.length === 0 && results.invalidColumns.length === 0) {
    console.log(`${colors.green}✅ Todas as tabelas e colunas seguem snake_case!${colors.reset}`);
  } else {
    if (results.invalidTables.length > 0) {
      console.log(`${colors.yellow}⚠️  Tabelas com nome inválido:${colors.reset}`);
      results.invalidTables.forEach(t => console.log(`   - ${t}`));
    }
    
    if (results.invalidColumns.length > 0) {
      console.log(`${colors.yellow}⚠️  Colunas com nome inválido:${colors.reset}`);
      results.invalidColumns.slice(0, 10).forEach(c => {
        console.log(`   - ${c.table}.${c.column} → sugestão: ${c.suggestion}`);
      });
    }
  }
  
  console.log(`\n${colors.blue}=== RESUMO ===${colors.reset}`);
  console.log(`✅ Tabelas verificadas: ${results.tablesChecked}`);
  console.log(`✅ Colunas verificadas: ${results.columnsChecked}`);
  console.log(`❌ Tabelas incorretas: ${results.invalidTables.length}`);
  console.log(`❌ Colunas incorretas: ${results.invalidColumns.length}`);
}

main().catch(console.error);