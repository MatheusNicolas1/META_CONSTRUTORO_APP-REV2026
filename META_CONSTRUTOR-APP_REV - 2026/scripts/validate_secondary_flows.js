const { createClient } = require('@supabase/supabase-js');
const { z } = require('zod');

// --- Configuration ---
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15LXByb2plY3QtcmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MjAwMDAwMDAsImV4cCI6MTkyMDAwMDAwMH0.ExampleAnonKey';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15LXByb2plY3QtcmVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYyMDAwMDAwMCwiZXhwIjoxOTIwMDAwMDAwfQ.ExampleServiceKey';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY are required.');
    process.exit(1);
}

// Client for Auth/RLS
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// Admin Client for bypass/cleanup
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const TEST_EMAIL = `secondary_test_${Date.now()}@test.com`;
const TEST_PASSWORD = 'password123';

async function log(msg, type = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${type}] ${msg}`);
}

async function runValidation() {
    log('=== SECONDARY FLOWS VALIDATION STARTED ===');
    log(`User: ${TEST_EMAIL}`);

    // 1. Sign Up & Org Creation
    log('Creating User & Org...');
    const { data: authData, error: authError } = await client.auth.signUp({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
    });

    if (authError) {
        log(`Signup failed: ${authError.message}`, 'FAIL');
        process.exit(1);
    }
    const user = authData.user;
    if (!user) {
        log('User creation returned null user', 'FAIL');
        process.exit(1);
    }
    log(`User created: ${user.id}`);

    // Wait for Trigger to create Org
    await new Promise(r => setTimeout(r, 2000));

    // Fetch Org
    const { data: orgs, error: orgError } = await client
        .from('orgs')
        .select('*')
        .eq('owner_user_id', user.id); // Assuming simple ownership for test

    if (orgError) {
        log(`Org fetch failed: ${orgError.message}`, 'FAIL');
        process.exit(1);
    }

    if (!orgs || orgs.length === 0) {
        // Fallback: Check if user is member
        const { data: members } = await client.from('org_members').select('org_id').eq('user_id', user.id);
        if (members && members.length > 0) {
            const { data: org } = await client.from('orgs').select('*').eq('id', members[0].org_id).single();
            if (org) {
                log(`Associating with Org: ${org.name} (${org.id})`);
                runFlows(user, org);
                return;
            }
        }
        log('No Org found for user. Trigger might have failed.', 'FAIL');
        // Try manual org creation if trigger failed? No, we test system behavior.
        process.exit(1);
    }

    const org = orgs[0];
    log(`Org found: ${org.name} (${org.id})`);

    // 2. Validate Flows
    try {
        await validateEquipamento(user, org);
        await validateEquipe(user, org);
        await validateFornecedor(user, org);
        log('=== ALL VALIDATIONS PASSED ===', 'SUCCESS');
    } catch (e) {
        log(`Validation failed: ${e.message}`, 'FAIL');
        process.exit(1);
    }
}

async function validateEquipamento(user, org) {
    log('--- Validating Equipamento Creation ---');
    const payload = {
        nome: 'Betoneira 400L Teste',
        categoria: 'Maquinário',
        status: 'Disponível',
        observacoes: 'Teste automático',
        user_id: user.id,
        org_id: org.id
    };

    const { data, error } = await client
        .from('equipamentos')
        .insert(payload)
        .select()
        .single();

    if (error) throw new Error(`Equipamento Insert failed: ${error.message}`);
    log(`Equipamento Created: ${data.id}`);
}

async function validateEquipe(user, org) {
    log('--- Validating Equipe Member Creation ---');
    const payload = {
        nome: 'João Silva Teste',
        funcao: 'Pedreiro',
        email: `joao_${Date.now()}@test.com`,
        telefone: '11999999999',
        ativo: true,
        user_id: user.id,
        org_id: org.id
    };

    const { data, error } = await client
        .from('equipes')
        .insert(payload)
        .select()
        .single();

    if (error) throw new Error(`Equipe Insert failed: ${error.message}`);
    log(`Equipe Member Created: ${data.id}`);
}

async function validateFornecedor(user, org) {
    log('--- Validating Fornecedor Creation ---');
    const payload = {
        nome: 'Material Construção Teste',
        categoria: 'Materiais Básicos',
        contato: 'Gerente Teste',
        cnpj: '00000000000191',
        telefone: '11888888888',
        email: 'vendas@lojateste.com',
        endereco: 'Rua Teste, 123',
        observacoes: 'Fornecedor Validação',
        ativo: true,
        user_id: user.id,
        org_id: org.id
    };

    const { data, error } = await client
        .from('fornecedores')
        .insert(payload)
        .select()
        .single();

    if (error) throw new Error(`Fornecedor Insert failed: ${error.message}`);
    log(`Fornecedor Created: ${data.id}`);
}

runValidation();
