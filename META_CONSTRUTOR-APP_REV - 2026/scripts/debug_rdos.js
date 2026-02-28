import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const adminClient = createClient(URL, SERVICE_KEY);

async function run() {
    console.log('--- Debugging RDO Schema ---');

    // 1. Get Schema definition via inspection (if possible) 
    // or just try to select and see what returns
    const { data, error } = await adminClient.from('rdos').select('*').limit(1);

    if (error) {
        console.error('Error selecting from rdos:', error);
    } else {
        console.log('Select success. Data:', data);
        if (data.length > 0) {
            console.log('Columns:', Object.keys(data[0]));
        } else {
            console.log('No rows found. Attempting to insert dummy to trigger column error...');
            // Try inserting a dummy row with just the basics
            const { error: insertError } = await adminClient.from('rdos').insert({
                // valid-ish data?
            });
            console.log('Insert empty error:', insertError);
        }
    }

    // 2. Introspection via `rpc` if available, or just guess
    // Trying to insert with all fields from validate script to see which one fails
    console.log('\n--- Test Insert Payload verification ---');
    const testPayload = {
        // Mock IDs - this will fail FK but should pass column check
        obra_id: '00000000-0000-0000-0000-000000000000',
        data: '2026-01-01',
        periodo: 'Manhã',
        clima: 'Sol',
        equipe_ociosa: false, // Suspect
        criado_por_id: '00000000-0000-0000-0000-000000000000',
        org_id: '00000000-0000-0000-0000-000000000000',
        status: 'DRAFT',
        observacoes: 'Test'
    };

    const { error: payloadError } = await adminClient.from('rdos').insert(testPayload);
    if (payloadError) {
        console.error('Payload Insert Error:', payloadError.message, payloadError.details, payloadError.hint);
    }
}

run();
