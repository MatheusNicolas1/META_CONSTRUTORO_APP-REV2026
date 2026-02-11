// M6.2 Runtime Validation: Obra Status Timestamps
// Tests: verify timestamps are set correctly on status transitions

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
    console.log('\n🔍 M6.2 Obra Status Timestamps Validation\n');
    let obraId = null;

    try {
        // Get org and user for testing
        const { data: org } = await adminClient.from('orgs').select('id').limit(1).single();
        const { data: user } = await adminClient.auth.admin.listUsers();

        if (!org || !user.users || user.users.length === 0) {
            console.error('❌ No org or user found');
            return;
        }
        const userId = user.users[0].id;

        // 1. Create Obra (DRAFT)
        const { data: obra, error: insertError } = await adminClient
            .from('obras')
            .insert({
                org_id: org.id,
                user_id: userId,
                nome: 'TEST TIME OBRA',
                localizacao: 'Loc',
                responsavel: userId,
                cliente: 'Cli',
                tipo: 'Residencial',
                data_inicio: new Date(),
                previsao_termino: new Date(Date.now() + 86400000)
            })
            .select('id, status, activated_at, on_hold_at, completed_at, canceled_at')
            .single();

        if (insertError) {
            console.error('❌ Failed to insert obra:', insertError.message);
            return;
        }

        obraId = obra.id;
        console.log(`✅ Created obra (DRAFT): ${obra.id}`);

        // Assert initial state
        if (obra.status !== 'DRAFT') console.error('❌ Initial status mismatch');
        if (obra.activated_at || obra.on_hold_at || obra.completed_at || obra.canceled_at) {
            console.error('❌ Initial timestamps should be NULL');
        } else {
            console.log('✅ Initial timestamps are NULL');
        }

        // 2. DRAFT -> ACTIVE
        console.log('\n🔄 Transition: DRAFT -> ACTIVE');
        const { data: activeObra, error: err1 } = await adminClient
            .from('obras')
            .update({ status: 'ACTIVE' })
            .eq('id', obraId)
            .select('status, activated_at, on_hold_at')
            .single();

        if (err1) console.error('❌ Update failed:', err1.message);
        else {
            if (activeObra.status === 'ACTIVE' && activeObra.activated_at && !activeObra.on_hold_at) {
                console.log(`✅ activated_at set: ${activeObra.activated_at}`);
            } else {
                console.error('❌ activated_at NOT set correctly');
            }
        }

        const firstActivation = activeObra.activated_at;

        // 3. ACTIVE -> ON_HOLD
        console.log('\n🔄 Transition: ACTIVE -> ON_HOLD');
        const { data: holdObra, error: err2 } = await adminClient
            .from('obras')
            .update({ status: 'ON_HOLD' })
            .eq('id', obraId)
            .select('status, activated_at, on_hold_at')
            .single();

        if (err2) console.error('❌ Update failed:', err2.message);
        else {
            if (holdObra.status === 'ON_HOLD' && holdObra.on_hold_at && holdObra.activated_at === firstActivation) {
                console.log(`✅ on_hold_at set: ${holdObra.on_hold_at}`);
                console.log(`✅ activated_at preserved: ${holdObra.activated_at}`);
            } else {
                console.error('❌ Timestamp logic failed for ON_HOLD');
            }
        }

        // 4. ON_HOLD -> ACTIVE
        console.log('\n🔄 Transition: ON_HOLD -> ACTIVE');
        const { data: reactivatedObra, error: err3 } = await adminClient
            .from('obras')
            .update({ status: 'ACTIVE' })
            .eq('id', obraId)
            .select('status, activated_at')
            .single();

        if (err3) console.error('❌ Update failed:', err3.message);
        else {
            if (reactivatedObra.activated_at === firstActivation) {
                console.log(`✅ activated_at NOT overwritten (correct): ${reactivatedObra.activated_at}`);
            } else {
                console.error('❌ activated_at changed! (Should verify COALESCE logic)');
            }
        }

        // 5. ACTIVE -> COMPLETED
        console.log('\n🔄 Transition: ACTIVE -> COMPLETED');
        const { data: completedObra, error: err4 } = await adminClient
            .from('obras')
            .update({ status: 'COMPLETED' })
            .eq('id', obraId)
            .select('status, completed_at')
            .single();

        if (err4) console.error('❌ Update failed:', err4.message);
        else {
            if (completedObra.completed_at) {
                console.log(`✅ completed_at set: ${completedObra.completed_at}`);
            } else {
                console.error('❌ completed_at NOT set');
            }
        }

        // 6. Invalid Transition Check (COMPLETED -> ACTIVE)
        console.log('\n🚫 Testing Invalid Transition (COMPLETED -> ACTIVE)...');
        const { error: invalidErr } = await adminClient
            .from('obras')
            .update({ status: 'ACTIVE' })
            .eq('id', obraId);

        if (invalidErr && invalidErr.message.includes('Invalid obra status transition')) {
            console.log('✅ Invalid transition correctly BLOCKED by M6.1 trigger');
        } else {
            console.error('❌ Invalid transition ALLOWED or wrong error:', invalidErr?.message);
        }

    } catch (err) {
        console.error('Fatal:', err);
    } finally {
        if (obraId) {
            console.log(`\n🧹 Cleanup obra ${obraId}`);
            await adminClient.from('obras').delete().eq('id', obraId);
        }
    }
}

main();
