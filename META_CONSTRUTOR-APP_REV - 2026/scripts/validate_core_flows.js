import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const log = (msg) => console.log(`[INFO] ${msg}`);
const fail = (msg) => { console.error(`[FAIL] ${msg}`); process.exit(1); };
const pass = (msg) => console.log(`[PASS] ${msg}`);

const adminClient = createClient(URL, SERVICE_KEY);

async function run() {
    log('=== CORE FLOWS VALIDATION: Obra & RDO ===');
    log(`Target: ${URL}\n`);

    // 1. Create User
    const email = `core_test_${Date.now()}@test.com`;
    const password = 'Test123!@#';
    log(`Creating User: ${email}`);

    const client = createClient(URL, ANON_KEY);
    const { data: authData, error: authError } = await client.auth.signUp({ email, password });
    if (authError) fail(`Signup failed: ${authError.message}`);

    const user = authData.user;
    log(`User Created: ${user.id}`);

    // 2. Wait for Org Trigger
    log('Waiting for Org creation (trigger)...');
    await new Promise(r => setTimeout(r, 2000));

    const { data: org, error: orgError } = await adminClient
        .from('orgs')
        .select('id')
        .eq('owner_user_id', user.id)
        .single();

    if (orgError || !org) fail('Org not created automatically');
    log(`Org Created: ${org.id}\n`);

    // 3. Validate Obra Creation (Matched Payload to Hook)
    log('--- Test 1: Create Obra ---');
    const obraPayload = {
        nome: 'Obra Teste Core Flow',
        cliente: 'Cliente Teste',
        localizacao: 'Rua Teste, 123',
        responsavel: 'Eng. Teste',
        tipo: 'Residencial',
        data_inicio: new Date().toISOString().split('T')[0],
        previsao_termino: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        observacoes: 'Teste automatizado',
        user_id: user.id,
        org_id: org.id,       // Added in fix
        progresso: 0,
        status: 'DRAFT'       // Changed in fix
    };

    const { data: obra, error: obraError } = await client
        .from('obras')
        .insert(obraPayload)
        .select()
        .single();

    if (obraError) {
        log(`Payload: ${JSON.stringify(obraPayload, null, 2)}`);
        fail(`Create Obra Failed: ${obraError.message} (Details: ${obraError.details || 'none'})`);
    }
    pass(`Obra Created Successfully: ${obra.id} (Status: ${obra.status})`);

    // 4. Validate RDO Creation (Matched Payload to Hook)
    log('\n--- Test 2: Create RDO ---');
    const rdoPayload = {
        obra_id: obra.id,
        data: new Date().toISOString().split('T')[0],
        periodo: 'Manhã',
        clima: 'Ensolarado',
        equipe_ociosa: false,
        user_id: user.id,     // Fixed column name
        org_id: org.id,
        status: 'DRAFT',
        observacoes: 'RDO Teste Automatizado' // Added column
    };

    const { data: rdo, error: rdoError } = await client
        .from('rdos')
        .insert(rdoPayload)
        .select()
        .single();

    if (rdoError) {
        log(`Payload: ${JSON.stringify(rdoPayload, null, 2)}`);
        fail(`Create RDO Failed: ${rdoError.message}`);
    }
    pass(`RDO Created Successfully: ${rdo.id} (Status: ${rdo.status})`);

    // 5. Cleanup
    log('\n--- Cleanup ---');
    await adminClient.auth.admin.deleteUser(user.id);
    pass('User deleted');

    log('\n✅✅✅ CORE FLOWS VALIDATED ✅✅✅');
}

run().catch(e => fail(e.message));
