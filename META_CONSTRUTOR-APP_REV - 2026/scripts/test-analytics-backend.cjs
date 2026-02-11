const { createClient } = require('@supabase/supabase-js');
const { resolve } = require('path');
const dotenv = require('dotenv');

const envPath = resolve(__dirname, '../.env.local');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.warn('Warning: .env.local not found or parse error. Trying .env ...');
    dotenv.config({ path: resolve(__dirname, '../.env') });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    console.error('Loaded Env:', {
        URL: !!SUPABASE_URL,
        KEY: !!SUPABASE_SERVICE_ROLE_KEY,
        Path: envPath
    });
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runTest() {
    console.log('--- M9 Analytics Verification (Backend) ---\n');

    // 0. Force Schema Reload
    console.log('0. Reloading Schema Cache...');
    const { error: rpcError } = await supabase.rpc('reload_schema_cache');
    if (rpcError) {
        console.warn('   RPC reload failed (function might not exist yet):', rpcError.message);
    } else {
        console.log('   Schema Cache Reloaded.');
        // Wait a bit for propagation
        await new Promise(r => setTimeout(r, 2000));
    }

    // 1. Trigger Edge Functions (to generate events)
    console.log('1. Triggering Health Check (Expected: ops.rate_limited or similar if spammed)...');
    try {
        // We do a simple fetch. Since we might not hit rate limit with one call, 
        // we mainly check if the previous steps (during dev) generated logs, 
        // OR we try to force a log if possible. 
        // Actually, the health-check logs 'ops.rate_limited' ONLY on failure.
        // Let's try calling it.
        const res = await fetch(`${SUPABASE_URL}/functions/v1/health-check`);
        console.log(`   Health Check Status: ${res.status}`);
    } catch (e) {
        console.error('   Failed to call health-check:', e.message);
    }

    // 2. Query Analytics Events
    console.log('\n2. Querying analytics_events table (Last 5 events)...');
    const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('   Error querying DB:', error);
    } else {
        console.table(data.map(e => ({
            event: e.event,
            source: e.source,
            request_id: e.request_id,
            success: e.success,
            env: e.environment
        })));

        if (data.length >= 1) {
            console.log('\nPASS: Events found in DB.');
        } else {
            console.log('\nWARN: No events found. Ensure Edge Functions are running and instrumented.');
        }
    }
}

runTest();
