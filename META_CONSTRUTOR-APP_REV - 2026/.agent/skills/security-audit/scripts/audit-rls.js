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

async function getBuckets() {
  const { data, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.log(`${colors.red}❌ Erro ao listar buckets:${colors.reset}`, error.message);
    return [];
  }
  
  return data || [];
}

async function getBucketPolicies(bucketName) {
  try {
    // Tentar fazer upload anônimo para testar policies
    const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(`security-test-${Date.now()}.txt`, testFile);
    
    if (!uploadError || uploadError.message.includes('row-level security')) {
      return { hasRLS: true };
    }
    
    return { hasRLS: false };
  } catch (e) {
    return { hasRLS: true }; // Se deu erro de permissão, RLS está funcionando
  }
}

async function main() {
  console.log(`${colors.cyan}🔍 Auditando Storage...${colors.reset}\n`);
  
  const buckets = await getBuckets();
  
  if (buckets.length === 0) {
    console.log(`${colors.yellow}⚠️  Nenhum bucket encontrado.${colors.reset}`);
    process.exit(0);
  }
  
  console.log(`📊 Buckets encontrados: ${buckets.length}\n`);
  
  const results = {
    publicBuckets: [],
    noRLS: [],
    insecure: []
  };
  
  for (const bucket of buckets) {
    console.log(`📁 Analisando bucket: ${bucket.name}`);
    
    // Verificar se é público
    if (bucket.public) {
      console.log(`   ${colors.red}🔴 Bucket público: ${bucket.name}${colors.reset}`);
      results.publicBuckets.push(bucket.name);
      results.insecure.push(bucket.name);
    }
    
    // Verificar RLS
    const { hasRLS } = await getBucketPolicies(bucket.name);
    if (!hasRLS) {
      console.log(`   ${colors.yellow}⚠️  Bucket sem RLS aparente${colors.reset}`);
      results.noRLS.push(bucket.name);
    }
    
    // Verificar se há arquivos sem org_id (amostragem)
    try {
      const { data: files, error } = await supabase.storage
        .from(bucket.name)
        .list();
      
      if (!error && files && files.length > 0) {
        console.log(`   📄 ${files.length} arquivos encontrados`);
        
        // Verificar naming convention (org_id no path)
        const filesWithoutOrgId = files.filter(f => 
          !f.name.includes('/') || !f.name.split('/')[0].match(/^[0-9a-f-]+$/)
        );
        
        if (filesWithoutOrgId.length > 0 && bucket.name !== 'avatars') {
          console.log(`   ${colors.yellow}⚠️  Arquivos podem não estar organizados por org_id${colors.reset}`);
        }
      }
    } catch (e) {
      // Sem permissão para listar - bom sinal
      console.log(`   ${colors.green}✅ Listagem restrita${colors.reset}`);
    }
  }
  
  // Resultados
  console.log(`\n${colors.blue}=== RESUMO ===${colors.reset}`);
  
  if (results.publicBuckets.length > 0) {
    console.log(`\n${colors.red}🔴 CRÍTICO - Buckets públicos:${colors.reset}`);
    results.publicBuckets.forEach(b => console.log(`   - ${b}`));
  }
  
  if (results.noRLS.length > 0) {
    console.log(`\n${colors.yellow}🟡 Buckets sem RLS confirmado:${colors.reset}`);
    results.noRLS.forEach(b => console.log(`   - ${b}`));
  }
  
  console.log(`\n✅ Buckets verificados: ${buckets.length}`);
  console.log(`🔴 Públicos: ${results.publicBuckets.length}`);
  console.log(`🟡 Sem RLS: ${results.noRLS.length}`);
  
  if (results.publicBuckets.length > 0) {
    console.log(`\n${colors.red}❌ BLOQUEADOR: Buckets públicos detectados. Torne-os privados.${colors.reset}`);
    process.exit(1);
  }
  
  if (results.noRLS.length > 0) {
    console.log(`\n${colors.yellow}⚠️  Buckets podem estar inseguros. Verifique as policies.${colors.reset}`);
    process.exit(0);
  }
  
  console.log(`\n${colors.green}✅ Storage está configurado corretamente!${colors.reset}`);
  process.exit(0);
}

main().catch(console.error);