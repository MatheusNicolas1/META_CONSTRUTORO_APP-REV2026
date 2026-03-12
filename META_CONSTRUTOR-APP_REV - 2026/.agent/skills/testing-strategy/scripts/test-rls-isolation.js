#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
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

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log(`${colors.red}❌ Variáveis de ambiente não encontradas!${colors.reset}`);
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// Criar duas organizações de teste
async function setupTestData() {
  console.log(`${colors.blue}📌 Criando dados de teste...${colors.reset}`);

  // Criar usuários
  const { data: user1, error: error1 } = await supabaseAdmin.auth.admin.createUser({
    email: `org_a_${Date.now()}@teste.com`,
    password: 'Teste@123456',
    email_confirm: true
  });

  const { data: user2, error: error2 } = await supabaseAdmin.auth.admin.createUser({
    email: `org_b_${Date.now()}@teste.com`,
    password: 'Teste@123456',
    email_confirm: true
  });

  if (error1 || error2) {
    console.log(`${colors.red}❌ Erro ao criar usuários${colors.reset}`);
    return null;
  }

  // Criar organizações
  const { data: org1, error: orgError1 } = await supabaseAdmin
    .from('orgs')
    .insert({
      name: 'Organização A',
      slug: `org-a-${Date.now()}`,
      owner_user_id: user1.user.id
    })
    .select()
    .single();

  const { data: org2, error: orgError2 } = await supabaseAdmin
    .from('orgs')
    .insert({
      name: 'Organização B',
      slug: `org-b-${Date.now()}`,
      owner_user_id: user2.user.id
    })
    .select()
    .single();

  if (orgError1 || orgError2) {
    console.log(`${colors.red}❌ Erro ao criar organizações${colors.reset}`);
    if (orgError1) console.error('Erro 1:', orgError1);
    if (orgError2) console.error('Erro 2:', orgError2);
    return null;
  }

  // Adicionar membros
  await supabaseAdmin
    .from('org_members')
    .insert({
      org_id: org1.id,
      user_id: user1.user.id,
      role: 'Administrador',
      status: 'active'
    });

  await supabaseAdmin
    .from('org_members')
    .insert({
      org_id: org2.id,
      user_id: user2.user.id,
      role: 'Administrador',
      status: 'active'
    });

  // Criar obras em cada organização
  const { data: obra1, error: errObra1 } = await supabaseAdmin
    .from('obras')
    .insert({
      org_id: org1.id,
      nome: 'Obra da Org A',
      status: 'ACTIVE',
      localizacao: 'Local A',
      responsavel: 'Resp A',
      cliente: 'Cliente A',
      tipo: 'Residencial',
      data_inicio: new Date().toISOString(),
      previsao_termino: new Date(Date.now() + 86400000).toISOString(),
      user_id: user1.user.id
    })
    .select()
    .single();

  if (errObra1) {
    fs.writeFileSync('error_obra.json', JSON.stringify(errObra1, null, 2));
    console.error('Erro ao criar obra orgA:', errObra1);
  }

  const { data: obra2, error: errObra2 } = await supabaseAdmin
    .from('obras')
    .insert({
      org_id: org2.id,
      nome: 'Obra da Org B',
      status: 'ACTIVE',
      localizacao: 'Local B',
      responsavel: 'Resp B',
      cliente: 'Cliente B',
      tipo: 'Comercial',
      data_inicio: new Date().toISOString(),
      previsao_termino: new Date(Date.now() + 86400000).toISOString(),
      user_id: user2.user.id
    })
    .select()
    .single();

  if (errObra2) console.error('Erro ao criar obra orgB:', errObra2);

  return {
    user1: user1.user,
    user2: user2.user,
    org1,
    org2,
    obra1,
    obra2
  };
}

async function testIsolation() {
  console.log(`\n${colors.cyan}🔍 Testando isolamento multi-tenant...${colors.reset}\n`);

  const testData = await setupTestData();
  if (!testData) {
    console.log(`${colors.red}❌ Falha ao criar dados de teste${colors.reset}`);
    process.exit(1);
  }

  console.log(`🏢 Org A: ${testData.org1.name} (${testData.org1.id})`);
  console.log(`🏢 Org B: ${testData.org2.name} (${testData.org2.id})`);
  console.log(`📋 Obra A: ${testData.obra1.nome}`);
  console.log(`📋 Obra B: ${testData.obra2.nome}\n`);

  // Teste 1: Usuário A vê apenas dados da Org A
  console.log(`${colors.blue}📌 Teste 1: Usuário A vê apenas dados da Org A${colors.reset}`);

  const supabaseA = createClient(supabaseUrl, supabaseKey);
  await supabaseA.auth.signInWithPassword({
    email: testData.user1.email,
    password: 'Teste@123456'
  });

  const { data: obrasA, error: errorA } = await supabaseA
    .from('obras')
    .select('*');

  if (errorA) {
    console.log(`   ${colors.red}❌ Erro na consulta: ${errorA.message}${colors.reset}`);
  } else {
    const obraIds = obrasA.map(o => o.id);
    const temObraA = obraIds.includes(testData.obra1.id);
    const temObraB = obraIds.includes(testData.obra2.id);

    if (temObraA && !temObraB) {
      console.log(`   ${colors.green}✅ OK: Vê obra da Org A, não vê obra da Org B${colors.reset}`);
    } else if (temObraA && temObraB) {
      console.log(`   ${colors.red}❌ FALHA: Vê obra da Org B${colors.reset}`);
    } else if (!temObraA) {
      console.log(`   ${colors.red}❌ FALHA: Não vê obra da própria org${colors.reset}`);
    }
  }

  // Teste 2: Usuário B vê apenas dados da Org B
  console.log(`\n${colors.blue}📌 Teste 2: Usuário B vê apenas dados da Org B${colors.reset}`);

  const supabaseB = createClient(supabaseUrl, supabaseKey);
  await supabaseB.auth.signInWithPassword({
    email: testData.user2.email,
    password: 'Teste@123456'
  });

  const { data: obrasB, error: errorB } = await supabaseB
    .from('obras')
    .select('*');

  if (errorB) {
    console.log(`   ${colors.red}❌ Erro na consulta: ${errorB.message}${colors.reset}`);
  } else {
    const obraIds = obrasB.map(o => o.id);
    const temObraB = obraIds.includes(testData.obra2.id);
    const temObraA = obraIds.includes(testData.obra1.id);

    if (temObraB && !temObraA) {
      console.log(`   ${colors.green}✅ OK: Vê obra da Org B, não vê obra da Org A${colors.reset}`);
    } else if (temObraB && temObraA) {
      console.log(`   ${colors.red}❌ FALHA: Vê obra da Org A${colors.reset}`);
    } else if (!temObraB) {
      console.log(`   ${colors.red}❌ FALHA: Não vê obra da própria org${colors.reset}`);
    }
  }

  // Teste 3: Tentativa de acesso cruzado via update
  console.log(`\n${colors.blue}📌 Teste 3: Tentativa de atualizar obra de outra org${colors.reset}`);

  const { error: updateError } = await supabaseA
    .from('obras')
    .update({ nome: 'Tentativa de invasão' })
    .eq('id', testData.obra2.id);

  if (updateError) {
    console.log(`   ${colors.green}✅ Bloqueado: ${updateError.message}${colors.reset}`);
  } else {
    console.log(`   ${colors.red}❌ FALHA: Conseguiu atualizar obra de outra org${colors.reset}`);
  }

  // Limpeza
  console.log(`\n${colors.blue}📌 Limpando dados de teste...${colors.reset}`);

  await supabaseAdmin.auth.admin.deleteUser(testData.user1.id);
  await supabaseAdmin.auth.admin.deleteUser(testData.user2.id);

  console.log(`   ${colors.green}✅ Dados removidos${colors.reset}`);

  return true;
}

async function main() {
  console.log(`${colors.cyan}🔍 Testando isolamento RLS...${colors.reset}`);

  const result = await testIsolation();

  if (result) {
    console.log(`\n${colors.green}✅ Testes de isolamento concluídos!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}❌ Falha nos testes de isolamento${colors.reset}`);
    process.exit(1);
  }
}

main().catch(console.error);