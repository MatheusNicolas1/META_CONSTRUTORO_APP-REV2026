// M6.3 Runtime Validation: RDO State Machine
// Tests: verify RDO status transitions and audit logs

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
    console.log('\n🔍 M6.3 RDO State Machine Validation\n');
    let obraId = null;
    let rdoId = null;

    try {
        // Get org and user for testing
        const { data: org } = await adminClient.from('orgs').select('id').limit(1).single();
        const { data: user } = await adminClient.auth.admin.listUsers();

        if (!org || !user.users || user.users.length === 0) {
            console.error('❌ No org or user found');
            return;
        }
        const userId = user.users[0].id;

        // 1. Create Obra
        const { data: obra, error: insertError } = await adminClient
            .from('obras')
            .insert({
                org_id: org.id,
                user_id: userId,
                nome: 'TEST RDO STATE OBRA',
                localizacao: 'Loc',
                responsavel: userId,
                cliente: 'Cli',
                tipo: 'Residencial',
                data_inicio: new Date(),
                previsao_termino: new Date(Date.now() + 86400000)
            })
            .select('id')
            .single();

        if (insertError) {
            console.error('❌ Failed to insert obra:', insertError.message);
            return;
        }
        obraId = obra.id;
        console.log(`✅ Created obra: ${obraId}`);

        // 2. Create RDO (Default DRAFT)
        const { data: rdo, error: rdoError } = await adminClient
            .from('rdos')
            .insert({
                org_id: org.id,
                obra_id: obraId,
                user_id: userId,
                data: new Date(),
                clima_manha: 'Bom', // Assuming required fields based on generic RDO structure
                status: 'DRAFT' // Explicitly set DRAFT though default handles it
            })
            .select('id, status')
            .single();

        if (rdoError) {
            // Handle potential NOT NULL constraint violations if I guessed columns wrong
            console.error('❌ Failed to insert RDO:', JSON.stringify(rdoError, null, 2));
            // Try to inspect schema error if any
            return;
        }
        rdoId = rdo.id;
        console.log(`✅ Created RDO (DRAFT): ${rdoId}`);
        if (rdo.status !== 'DRAFT') console.error('❌ Initial status mismatch');

        // 3. DRAFT -> SUBMITTED
        console.log('\n🔄 Transition: DRAFT -> SUBMITTED');
        const { data: submittedRdo, error: err1 } = await adminClient
            .from('rdos')
            .update({ status: 'SUBMITTED' })
            .eq('id', rdoId)
            .select('status')
            .single();

        if (err1) console.error('❌ Update failed:', err1.message);
        else console.log(`✅ Status updated to: ${submittedRdo.status}`);

        // 4. SUBMITTED -> APPROVED
        console.log('\n🔄 Transition: SUBMITTED -> APPROVED');
        const { data: approvedRdo, error: err2 } = await adminClient
            .from('rdos')
            .update({ status: 'APPROVED' })
            .eq('id', rdoId)
            .select('status')
            .single();

        if (err2) console.error('❌ Update failed:', err2.message);
        else console.log(`✅ Status updated to: ${approvedRdo.status}`);

        // 5. Invalid Transition: APPROVED -> DRAFT
        console.log('\n🚫 Testing Invalid Transition (APPROVED -> DRAFT)...');
        const { error: invalidErr } = await adminClient
            .from('rdos')
            .update({ status: 'DRAFT' })
            .eq('id', rdoId);

        if (invalidErr && invalidErr.message.includes('Invalid RDO status transition')) {
            console.log('✅ Invalid transition correctly BLOCKED');
        } else {
            console.error('❌ Invalid transition ALLOWED or wrong error:', invalidErr?.message);
        }

        // 6. Verify Audit Logs
        console.log('\n🕵️ Checking Audit Logs...');
        const { data: logs, error: logError } = await adminClient
            .from('audit_logs')
            .select('action, metadata, entity_id')
            .eq('entity_id', rdoId)
            .eq('action', 'domain.rdo_status_changed')
            .order('created_at', { ascending: true });

        if (logError) console.error('❌ Log check failed:', logError.message);
        else {
            console.log(`✅ Found ${logs.length} audit logs for this RDO.`);
            logs.forEach(l => console.log(`   - Action: ${l.action}, From: ${l.metadata.from}, To: ${l.metadata.to}`));
            if (logs.length >= 2) console.log('✅ Audit flow verified.');
            else console.error('❌ Missing audit logs.');
        }

    } catch (err) {
        console.error('Fatal:', err);
    } finally {
        // Cleanup
        if (rdoId) await adminClient.from('rdos').delete().eq('id', rdoId);
        if (obraId) await adminClient.from('obras').delete().eq('id', obraId);
        console.log('\n🧹 Cleanup done.');
    }
}

main();
