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

async function checkOrphans() {
  console.log(`${colors.cyan}🔍 Verificando registros órfãos...${colors.reset}\n`);
  
  let totalOrphans = 0;
  const results = [];

  // 1. RDOs com obra_id inválido
  const { data: rdosOrphans, error: rdosError } = await supabase
    .from('rdos')
    .select('id, numero, obra_id')
    .not('obra_id', 'is', null);
  
  if (!rdosError && rdosOrphans) {
    const validObras = await supabase.from('obras').select('id');
    const validObraIds = new Set(validObras.data?.map(o => o.id) || []);
    const invalid = rdosOrphans.filter(r => !validObraIds.has(r.obra_id));
    
    if (invalid.length > 0) {
      totalOrphans += invalid.length;
      results.push({
        name: 'RDOs com obra_id inválido',
        count: invalid.length,
        samples: invalid.slice(0, 3)
      });
    }
  }

  // 2. Atividades com obra_id inválido
  const { data: atividades, error: ativError } = await supabase
    .from('atividades')
    .select('id, descricao, obra_id')
    .not('obra_id', 'is', null);
  
  if (!ativError && atividades) {
    const validObras = await supabase.from('obras').select('id');
    const validObraIds = new Set(validObras.data?.map(o => o.id) || []);
    const invalid = atividades.filter(a => !validObraIds.has(a.obra_id));
    
    if (invalid.length > 0) {
      totalOrphans += invalid.length;
      results.push({
        name: 'Atividades com obra_id inválido',
        count: invalid.length,
        samples: invalid.slice(0, 3)
      });
    }
  }

  // 3. Documentos com rdo_id inválido
  const { data: docs, error: docsError } = await supabase
    .from('documentos')
    .select('id, title, rdo_id')
    .not('rdo_id', 'is', null);
  
  if (!docsError && docs) {
    const validRdos = await supabase.from('rdos').select('id');
    const validRdoIds = new Set(validRdos.data?.map(r => r.id) || []);
    const invalid = docs.filter(d => !validRdoIds.has(d.rdo_id));
    
    if (invalid.length > 0) {
      totalOrphans += invalid.length;
      results.push({
        name: 'Documentos com rdo_id inválido',
        count: invalid.length,
        samples: invalid.slice(0, 3)
      });
    }
  }

  // 4. Membros com org_id inválido
  const { data: members, error: memError } = await supabase
    .from('org_members')
    .select('id, org_id, member_id');
  
  if (!memError && members) {
    const validOrgs = await supabase.from('orgs').select('id');
    const validOrgIds = new Set(validOrgs.data?.map(o => o.id) || []);
    const invalid = members.filter(m => !validOrgIds.has(m.org_id));
    
    if (invalid.length > 0) {
      totalOrphans += invalid.length;
      results.push({
        name: 'Membros com org_id inválido',
        count: invalid.length,
        samples: invalid.slice(0, 3)
      });
    }
  }

  // 5. Membros com member_id inválido
  if (!memError && members) {
    const { data: users } = await supabase.auth.admin.listUsers();
    const validUserIds = new Set(users?.users?.map(u => u.id) || []);
    const invalid = members.filter(m => !validUserIds.has(m.member_id));
    
    if (invalid.length > 0) {
      totalOrphans += invalid.length;
      results.push({
        name: 'Membros com member_id inválido',
        count: invalid.length,
        samples: invalid.slice(0, 3)
      });
    }
  }

  // Resultados
  if (totalOrphans === 0) {
    console.log(`${colors.green}✅ Nenhum registro órfão encontrado!${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠️  Encontrados ${totalOrphans} registros órfãos:${colors.reset}\n`);
    
    results.forEach(r => {
      console.log(`${colors.magenta}📌 ${r.name}: ${r.count}${colors.reset}`);
      r.samples.forEach(s => console.log(`   - ID: ${s.id}`));
      console.log('');
    });
    
    console.log(`${colors.yellow}💡 Corrija executando:${colors.reset}`);
    console.log('DELETE FROM tabela WHERE id IN (ids_dos_registros_orfãos);');
  }
}

checkOrphans().catch(console.error);