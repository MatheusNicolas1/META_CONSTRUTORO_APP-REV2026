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
  console.log('Necessário: VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Tabelas que DEVEM ter RLS
const CRITICAL_TABLES = [
  'orgs', 'org_members', 'profiles',
  'obras', 'rdos', 'atividades', 'equipamentos',
  'fornecedores', 'documentos', 'notificacoes'
];

async function getTables() {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (error) {
      console.log(`${colors.red}❌ Erro ao buscar tabelas:${colors.reset}`, error.message);
      return [];
    }
    
    return data.map(t => t.table_name) || [];
  } catch (error) {
    console.log(`${colors.red}❌ Erro na conexão:${colors.reset}`, error.message);
    return [];
  }
}

async function getRLSStatus(tableName) {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('row_security')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .maybeSingle();
    
    if (error || !data) return false;
    return data.row_security === 'YES';
  } catch (error) {
    return false;
  }
}

async function getPolicies(tableName) {
  try {
    // Tentar via query direta (mais compatível)
    const { data, error } = await supabase
      .rpc('get_policies_for_table', { table_name: tableName });
    
    if (error || !data) return [];
    return data || [];
  } catch (error) {
    // Fallback: tentar via information_schema
    try {
      const { data, error } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', tableName);
      
      if (error) return [];
      return data || [];
    } catch (e) {
      return [];
    }
  }
}

async function main() {
  console.log(`${colors.cyan}🔍 Auditando RLS (Row Level Security)...${colors.reset}\n`);
  
  const allTables = await getTables();
  
  if (allTables.length === 0) {
    console.log(`${colors.yellow}⚠️  Nenhuma tabela encontrada. Verifique a conexão com o banco.${colors.reset}`);
    process.exit(0);
  }
  
  console.log(`📊 Total de tabelas: ${allTables.length}\n`);
  
  const results = {
    noRLS: [],
    noPolicies: [],
    weakPolicies: [],
    criticalTablesNoRLS: []
  };
  
  for (const table of allTables) {
    // Ignorar tabelas do sistema
    if (table.startsWith('_') || table.includes('schema') || table.includes('migration')) continue;
    
    const hasRLS = await getRLSStatus(table);
    const policies = await getPolicies(table);
    
    if (!hasRLS) {
      results.noRLS.push(table);
      if (CRITICAL_TABLES.includes(table)) {
        results.criticalTablesNoRLS.push(table);
      }
      continue;
    }
    
    if (!policies || policies.length === 0) {
      results.noPolicies.push(table);
      continue;
    }
    
    // Verificar policies fracas (SELECT sem restrição)
    for (const policy of policies) {
      if (policy.cmd === 'SELECT' && policy.qual && !policy.qual.includes('org_id')) {
        results.weakPolicies.push({
          table,
          policy: policy.policyname || 'unknown',
          issue: 'SELECT policy sem filtro por org_id'
        });
      }
      
      if ((policy.cmd === 'ALL' || policy.cmd === 'INSERT' || policy.cmd === 'UPDATE' || policy.cmd === 'DELETE') &&
          policy.qual && !policy.qual.includes('org_id') && !policy.qual.includes('auth.uid')) {
        results.weakPolicies.push({
          table,
          policy: policy.policyname || 'unknown',
          issue: `Policy ${policy.cmd} sem restrição adequada`
        });
      }
    }
  }
  
  // Resultados
  if (results.criticalTablesNoRLS.length > 0) {
    console.log(`${colors.red}🔴 CRÍTICO - Tabelas sem RLS:${colors.reset}`);
    results.criticalTablesNoRLS.forEach(t => console.log(`   - ${t}`));
    console.log('');
  }
  
  if (results.noRLS.length > 0) {
    console.log(`${colors.yellow}🟡 Tabelas sem RLS (não críticas):${colors.reset}`);
    results.noRLS.filter(t => !CRITICAL_TABLES.includes(t)).forEach(t => console.log(`   - ${t}`));
    console.log('');
  }
  
  if (results.noPolicies.length > 0) {
    console.log(`${colors.yellow}🟡 Tabelas com RLS mas sem policies:${colors.reset}`);
    results.noPolicies.slice(0, 10).forEach(t => console.log(`   - ${t}`));
    if (results.noPolicies.length > 10) {
      console.log(`   ... e mais ${results.noPolicies.length - 10}`);
    }
    console.log('');
  }
  
  if (results.weakPolicies.length > 0) {
    console.log(`${colors.yellow}🟡 Policies potencialmente fracas:${colors.reset}`);
    results.weakPolicies.slice(0, 10).forEach(p => {
      console.log(`   - ${p.table}: ${p.policy} - ${p.issue}`);
    });
    if (results.weakPolicies.length > 10) {
      console.log(`   ... e mais ${results.weakPolicies.length - 10}`);
    }
    console.log('');
  }
  
  // Resumo
  console.log(`${colors.blue}=== RESUMO ===${colors.reset}`);
  console.log(`✅ Tabelas verificadas: ${allTables.length}`);
  console.log(`🔴 Críticas sem RLS: ${results.criticalTablesNoRLS.length}`);
  console.log(`🟡 Sem RLS: ${results.noRLS.length}`);
  console.log(`🟡 Sem policies: ${results.noPolicies.length}`);
  console.log(`🟡 Policies fracas: ${results.weakPolicies.length}`);
  
  if (results.criticalTablesNoRLS.length > 0) {
    console.log(`\n${colors.red}❌ BLOQUEADOR: Tabelas críticas sem RLS. Corrija urgentemente.${colors.reset}`);
    process.exit(1);
  }
  
  if (results.noRLS.length > 0 || results.noPolicies.length > 0 || results.weakPolicies.length > 0) {
    console.log(`\n${colors.yellow}⚠️  Problemas de RLS encontrados. Revise antes do deploy.${colors.reset}`);
    process.exit(0);
  }
  
  console.log(`\n${colors.green}✅ RLS está configurado corretamente!${colors.reset}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(`${colors.red}Erro fatal:${colors.reset}`, error);
  process.exit(1);
});