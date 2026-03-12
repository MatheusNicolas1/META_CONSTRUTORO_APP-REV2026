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

let testOrgId = null;
let testUserId = null;

async function getTestUser() {
  // Buscar um usuário existente para teste
  const { data: users, error } = await supabase.auth.admin.listUsers();
  
  if (error || !users?.users?.length) {
    console.log(`${colors.yellow}⚠️  Nenhum usuário encontrado. Criando usuário de teste...${colors.reset}`);
    
    const { data, error: createError } = await supabase.auth.admin.createUser({
      email: `teste_${Date.now()}@email.com`,
      password: 'Teste@123456',
      email_confirm: true
    });
    
    if (createError) {
      console.log(`${colors.red}❌ Erro ao criar usuário: ${createError.message}${colors.reset}`);
      return null;
    }
    
    testUserId = data.user.id;
    return data.user;
  }
  
  testUserId = users.users[0].id;
  return users.users[0];
}

async function getTestOrg() {
  // Buscar uma org do usuário
  const { data, error } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('member_id', testUserId)
    .maybeSingle();
  
  if (error || !data) {
    console.log(`${colors.yellow}⚠️  Usuário não tem organização. Criando...${colors.reset}`);
    
    const { data: org, error: createError } = await supabase
      .from('orgs')
      .insert({
        name: 'Org Teste',
        slug: `org-teste-${Date.now()}`,
        owner_id: testUserId
      })
      .select()
      .single();
    
    if (createError) {
      console.log(`${colors.red}❌ Erro ao criar org: ${createError.message}${colors.reset}`);
      return null;
    }
    
    // Adicionar como membro
    await supabase
      .from('org_members')
      .insert({
        org_id: org.id,
        member_id: testUserId,
        role: 'ADMIN',
        status: 'ACTIVE'
      });
    
    testOrgId = org.id;
    return org;
  }
  
  testOrgId = data.org_id;
  return { id: data.org_id };
}

async function testCreateObra() {
  console.log(`\n${colors.blue}📌 Testando criação de obra...${colors.reset}`);
  
  const { data, error } = await supabase
    .from('obras')
    .insert({
      org_id: testOrgId,
      nome: `Obra Teste ${Date.now()}`,
      status: 'DRAFT',
      created_by: testUserId
    })
    .select()
    .single();
  
  if (error) {
    console.log(`   ${colors.red}❌ Erro: ${error.message}${colors.reset}`);
    return null;
  }
  
  console.log(`   ${colors.green}✅ Obra criada: ${data.nome} (${data.id})${colors.reset}`);
  return data;
}

async function testReadObras(obraId) {
  console.log(`\n${colors.blue}📌 Testando leitura de obras...${colors.reset}`);
  
  const { data, error } = await supabase
    .from('obras')
    .select('*')
    .eq('org_id', testOrgId);
  
  if (error) {
    console.log(`   ${colors.red}❌ Erro: ${error.message}${colors.reset}`);
    return false;
  }
  
  console.log(`   ${colors.green}✅ ${data.length} obras encontradas${colors.reset}`);
  
  // Verificar se a obra específica existe
  if (obraId) {
    const obra = data.find(o => o.id === obraId);
    if (obra) {
      console.log(`   ${colors.green}✅ Obra teste encontrada na listagem${colors.reset}`);
    } else {
      console.log(`   ${colors.red}❌ Obra teste não encontrada na listagem${colors.reset}`);
      return false;
    }
  }
  
  return true;
}

async function testUpdateObra(obra) {
  console.log(`\n${colors.blue}📌 Testando atualização de obra...${colors.reset}`);
  
  const newName = `${obra.nome} (Atualizada)`;
  
  const { data, error } = await supabase
    .from('obras')
    .update({ nome: newName })
    .eq('id', obra.id)
    .select()
    .single();
  
  if (error) {
    console.log(`   ${colors.red}❌ Erro: ${error.message}${colors.reset}`);
    return false;
  }
  
  if (data.nome === newName) {
    console.log(`   ${colors.green}✅ Obra atualizada: ${data.nome}${colors.reset}`);
    return true;
  } else {
    console.log(`   ${colors.red}❌ Nome não foi atualizado${colors.reset}`);
    return false;
  }
}

async function testDeleteObra(obraId) {
  console.log(`\n${colors.blue}📌 Testando exclusão de obra...${colors.reset}`);
  
  const { error } = await supabase
    .from('obras')
    .delete()
    .eq('id', obraId);
  
  if (error) {
    console.log(`   ${colors.red}❌ Erro: ${error.message}${colors.reset}`);
    return false;
  }
  
  // Verificar se foi deletada
  const { data } = await supabase
    .from('obras')
    .select('*')
    .eq('id', obraId);
  
  if (data?.length === 0) {
    console.log(`   ${colors.green}✅ Obra excluída com sucesso${colors.reset}`);
    return true;
  } else {
    console.log(`   ${colors.red}❌ Obra ainda existe após exclusão${colors.reset}`);
    return false;
  }
}

async function main() {
  console.log(`${colors.cyan}🔍 Testando CRUD de entidades...${colors.reset}\n`);
  
  // Preparação
  const user = await getTestUser();
  if (!user) {
    console.log(`${colors.red}❌ Não foi possível obter usuário para teste${colors.reset}`);
    process.exit(1);
  }
  
  const org = await getTestOrg();
  if (!org) {
    console.log(`${colors.red}❌ Não foi possível obter organização para teste${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`👤 Usuário: ${user.email}`);
  console.log(`🏢 Organização: ${testOrgId}\n`);
  
  // Testes
  const obra = await testCreateObra();
  if (!obra) {
    console.log(`\n${colors.red}❌ Falha na criação de obra${colors.reset}`);
    process.exit(1);
  }
  
  const readOk = await testReadObras(obra.id);
  if (!readOk) {
    console.log(`\n${colors.red}❌ Falha na leitura de obras${colors.reset}`);
    process.exit(1);
  }
  
  const updateOk = await testUpdateObra(obra);
  if (!updateOk) {
    console.log(`\n${colors.red}❌ Falha na atualização de obra${colors.reset}`);
    process.exit(1);
  }
  
  const deleteOk = await testDeleteObra(obra.id);
  if (!deleteOk) {
    console.log(`\n${colors.red}❌ Falha na exclusão de obra${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`\n${colors.green}✅ Todos os testes CRUD passaram!${colors.reset}`);
  process.exit(0);
}

main().catch(console.error);