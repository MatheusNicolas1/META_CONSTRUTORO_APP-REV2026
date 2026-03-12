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

// Tabelas obrigatórias e suas colunas essenciais
const REQUIRED_TABLES = {
  orgs: ['id', 'name', 'slug', 'owner_id', 'created_at'],
  org_members: ['id', 'org_id', 'member_id', 'role', 'status'],
  profiles: ['id', 'full_name', 'email'],
  obras: ['id', 'org_id', 'nome', 'status', 'created_by'],
  rdos: ['id', 'org_id', 'obra_id', 'status', 'created_by', 'data'],
  atividades: ['id', 'org_id', 'obra_id', 'descricao'],
  equipamentos: ['id', 'org_id', 'nome'],
  fornecedores: ['id', 'org_id', 'nome'],
  documentos: ['id', 'org_id', 'title', 'file_path', 'uploaded_by']
};

async function tableExists(tableName) {
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', tableName);
  
  return !error && data && data.length > 0;
}

async function getColumns(tableName) {
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable')
    .eq('table_schema', 'public')
    .eq('table_name', tableName);
  
  if (error) return [];
  return data;
}

async function main() {
  console.log(`${colors.cyan}🔍 Verificando schema do banco...${colors.reset}\n`);
  
  const results = {
    missingTables: [],
    missingColumns: [],
    columnsWithIssues: []
  };
  
  // Verificar cada tabela obrigatória
  for (const [tableName, requiredColumns] of Object.entries(REQUIRED_TABLES)) {
    console.log(`📋 Verificando tabela: ${tableName}`);
    
    const exists = await tableExists(tableName);
    
    if (!exists) {
      results.missingTables.push(tableName);
      continue;
    }
    
    const columns = await getColumns(tableName);
    const columnNames = columns.map(c => c.column_name);
    
    // Verificar colunas obrigatórias
    for (const col of requiredColumns) {
      if (!columnNames.includes(col)) {
        results.missingColumns.push({ table: tableName, column: col });
      }
    }
    
    // Verificar nullable de colunas críticas
    const criticalColumns = ['org_id', 'created_by'];
    for (const col of criticalColumns) {
      if (columnNames.includes(col)) {
        const colInfo = columns.find(c => c.column_name === col);
        if (colInfo && colInfo.is_nullable === 'YES') {
          results.columnsWithIssues.push({ 
            table: tableName, 
            column: col, 
            issue: 'Não deveria ser nullable' 
          });
        }
      }
    }
  }
  
  // Resultados
  console.log('\n');
  
  if (results.missingTables.length === 0 && results.missingColumns.length === 0 && results.columnsWithIssues.length === 0) {
    console.log(`${colors.green}✅ Schema está completo e correto!${colors.reset}`);
  } else {
    if (results.missingTables.length > 0) {
      console.log(`${colors.red}❌ Tabelas faltando:${colors.reset}`);
      results.missingTables.forEach(t => console.log(`   - ${t}`));
    }
    
    if (results.missingColumns.length > 0) {
      console.log(`${colors.yellow}⚠️  Colunas faltando:${colors.reset}`);
      results.missingColumns.slice(0, 10).forEach(c => {
        console.log(`   - ${c.table}.${c.column}`);
      });
    }
    
    if (results.columnsWithIssues.length > 0) {
      console.log(`${colors.yellow}⚠️  Colunas com problemas:${colors.reset}`);
      results.columnsWithIssues.forEach(c => {
        console.log(`   - ${c.table}.${c.column}: ${c.issue}`);
      });
    }
  }
  
  // Resumo
  console.log(`\n${colors.blue}=== RESUMO ===${colors.reset}`);
  console.log(`✅ Tabelas verificadas: ${Object.keys(REQUIRED_TABLES).length}`);
  console.log(`❌ Tabelas faltando: ${results.missingTables.length}`);
  console.log(`❌ Colunas faltando: ${results.missingColumns.length}`);
  console.log(`⚠️  Colunas com issues: ${results.columnsWithIssues.length}`);
  
  process.exit(results.missingTables.length > 0 ? 1 : 0);
}

main().catch(console.error);