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
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log(`${colors.red}❌ Variáveis de ambiente não encontradas!${colors.reset}`);
  console.log('Necessário: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Email único para teste
const TEST_EMAIL = `teste_${Date.now()}@email.com`;
const TEST_PASSWORD = 'Teste@123456';

async function testSignUp() {
  console.log(`\n${colors.blue}📌 Testando criação de conta...${colors.reset}`);
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      options: {
        data: {
          full_name: 'Usuário Teste'
        }
      }
    });
    
    if (error) {
      console.log(`   ${colors.red}❌ Erro no signup: ${error.message}${colors.reset}`);
      return false;
    }
    
    if (data.user) {
      console.log(`   ${colors.green}✅ Conta criada: ${TEST_EMAIL}${colors.reset}`);
      return true;
    } else {
      console.log(`   ${colors.red}❌ Usuário não retornado${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`   ${colors.red}❌ Erro: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testSignIn() {
  console.log(`\n${colors.blue}📌 Testando login...${colors.reset}`);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (error) {
      console.log(`   ${colors.red}❌ Erro no login: ${error.message}${colors.reset}`);
      return false;
    }
    
    if (data.session) {
      console.log(`   ${colors.green}✅ Login bem-sucedido${colors.reset}`);
      return true;
    } else {
      console.log(`   ${colors.red}❌ Sessão não retornada${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`   ${colors.red}❌ Erro: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testSignOut() {
  console.log(`\n${colors.blue}📌 Testando logout...${colors.reset}`);
  
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.log(`   ${colors.red}❌ Erro no logout: ${error.message}${colors.reset}`);
      return false;
    }
    
    console.log(`   ${colors.green}✅ Logout bem-sucedido${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`   ${colors.red}❌ Erro: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testSession() {
  console.log(`\n${colors.blue}📌 Verificando sessão...${colors.reset}`);
  
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log(`   ${colors.red}❌ Erro: ${error.message}${colors.reset}`);
      return false;
    }
    
    if (data.session) {
      console.log(`   ${colors.green}✅ Sessão ativa${colors.reset}`);
      return true;
    } else {
      console.log(`   ${colors.yellow}⚠️  Sem sessão ativa${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`   ${colors.red}❌ Erro: ${error.message}${colors.reset}`);
    return false;
  }
}

async function main() {
  console.log(`${colors.cyan}🔍 Testando fluxo de autenticação...${colors.reset}`);
  
  // Teste 1: Criar conta
  const signupSuccess = await testSignUp();
  
  if (!signupSuccess) {
    console.log(`\n${colors.red}❌ Falha na criação de conta. Abortando testes.${colors.reset}`);
    process.exit(1);
  }
  
  // Pequena pausa para processamento
  await new Promise(r => setTimeout(r, 1000));
  
  // Teste 2: Login
  const loginSuccess = await testSignIn();
  
  if (!loginSuccess) {
    console.log(`\n${colors.red}❌ Falha no login. Abortando testes.${colors.reset}`);
    process.exit(1);
  }
  
  // Teste 3: Verificar sessão
  await testSession();
  
  // Teste 4: Logout
  const logoutSuccess = await testSignOut();
  
  // Resumo
  console.log(`\n${colors.blue}=== RESUMO ===${colors.reset}`);
  console.log(`✅ Criação de conta: ${signupSuccess ? 'OK' : 'FALHOU'}`);
  console.log(`✅ Login: ${loginSuccess ? 'OK' : 'FALHOU'}`);
  console.log(`✅ Logout: ${logoutSuccess ? 'OK' : 'FALHOU'}`);
  
  if (signupSuccess && loginSuccess && logoutSuccess) {
    console.log(`\n${colors.green}✅ Fluxo de autenticação OK!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}❌ Problemas no fluxo de autenticação.${colors.reset}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`${colors.red}Erro fatal:${colors.reset}`, error);
  process.exit(1);
});