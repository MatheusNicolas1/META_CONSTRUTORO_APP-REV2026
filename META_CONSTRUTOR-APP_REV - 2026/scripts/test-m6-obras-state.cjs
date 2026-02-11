// M6.1 Runtime Validation: Obra Status State Machine
// Tests: DRAFT->ACTIVE (PASS), ACTIVE->DRAFT (FAIL), audit logs

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
    console.log('\n🔍 M6.1 Obra Status State Machine Validation\n');
    let obraId = null;

    try {
        // Get org and user for testing
        const { data: org } = await adminClient
            .from('orgs')
            .select('id')
            .limit(1)
            .single();

        const { data: user } = await adminClient
            .auth.admin.listUsers();

        if (!org || !user.users || user.users.length === 0) {
            console.error('❌ No org or user found');
            return;
        }

        const userId = user.users[0].id;
        console.log(`📦 Using org: ${org.id}`);
        console.log(`👤 Using user: ${userId}\n`);

        // Insert obra with ALL required NOT NULL fields
        // service_role bypasses RLS
        const now = new Date().toISOString();
        const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        const { data: obra, error: insertError } = await adminClient
            .from('obras')
            .insert({
                org_id: org.id,
                user_id: userId,
                nome: 'TEST OBRA M6.1',
                localizacao: 'TEST LOCATION',
                responsavel: userId,
                cliente: 'TEST CLIENT',
                tipo: 'Residencial', // Valid CHECK constraint value
                data_inicio: now,
                previsao_termino: futureDate
                // status will default to DRAFT
            })
            .select('id, status')
            .single();

        if (insertError) {
            console.error('❌ Failed to insert obra:', insertError.message);
            return;
        }

        obraId = obra.id;
        console.log(`✅ Created obra: ${obra.id}`);
        console.log(`   Initial status: ${obra.status}\n`);

        // TEST A: PASS - DRAFT -> ACTIVE (valid transition)
        console.log('─'.repeat(80));
        console.log('TEST A: DRAFT -> ACTIVE (should PASS)');
        console.log('─'.repeat(80));

        const { data: updatedObra, error: updateError } = await adminClient
            .from('obras')
            .update({ status: 'ACTIVE' })
            .eq('id', obraId)
            .select('id, status')
            .single();

        if (updateError) {
            console.error('❌ FAIL: Valid transition was blocked:', updateError.message);
            // Don't exit, proceed to cleanup
        } else {
            console.log(`✅ PASS: Transition succeeded`);
            console.log(`   New status: ${updatedObra.status}\n`);

            // TEST B: FAIL - ACTIVE -> DRAFT (invalid transition)
            console.log('─'.repeat(80));
            console.log('TEST B: ACTIVE -> DRAFT (should FAIL)');
            console.log('─'.repeat(80));

            const { error: invalidError } = await adminClient
                .from('obras')
                .update({ status: 'DRAFT' })
                .eq('id', obraId)
                .single();

            if (!invalidError) {
                console.error('❌ FAIL: Invalid transition was NOT blocked');
            } else {
                console.log(`✅ PASS: Invalid transition correctly blocked`);
                console.log(`   Error: ${invalidError.message.substring(0, 100)}...\n`);
            }
        }

        // TEST C: Verify audit logs
        console.log('─'.repeat(80));
        console.log('TEST C: Audit Logs Verification');
        console.log('─'.repeat(80));

        const { data: auditLogs, error: auditError } = await adminClient
            .from('audit_logs')
            .select('created_at, action, entity, entity_id, metadata')
            .eq('action', 'domain.obra_status_changed')
            .eq('entity_id', obraId)
            .order('created_at', { ascending: false });

        if (auditError) {
            console.error('❌ Failed to query audit logs:', auditError.message);
        } else if (!auditLogs || auditLogs.length === 0) {
            console.error('❌ FAIL: No audit logs found for obra status changes');
        } else {
            console.log(`✅ PASS: Found ${auditLogs.length} audit log(s)`);
            console.log(`   Sample audit entry:`);
            console.log(`   - Action: ${auditLogs[0].action}`);
            console.log(`   - From: ${auditLogs[0].metadata.from}`);
            console.log(`   - To: ${auditLogs[0].metadata.to}`);
            console.log(`   - Created: ${auditLogs[0].created_at}\n`);
        }

    } catch (err) {
        console.error('Fatal error:', err.message);
    } finally {
        if (obraId) {
            console.log(`\n🧹 Cleaning up test obra: ${obraId}`);
            await adminClient.from('obras').delete().eq('id', obraId);
        }
    }
}

main();
