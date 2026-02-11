const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Force Local DB for stable verification
const DATABASE_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

const client = new Client({
    connectionString: DATABASE_URL,
});

async function run() {
    try {
        await client.connect();
        console.log('--- Direct DB Verification (PG Driver) ---\n');

        // 1. Check Table Existence
        const resTable = await client.query("SELECT to_regclass('public.analytics_events') as table_exists");

        if (resTable.rows[0].table_exists) {
            console.log('PASS: Table public.analytics_events exists.');
        } else {
            console.error('FAIL: Table public.analytics_events does NOT exist.');
            process.exit(1);
        }

        // 2. Check Columns
        const resColumns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'analytics_events'
        ORDER BY ordinal_position;
    `);
        console.log('\nColumns:');
        resColumns.rows.forEach(r => console.log(` - ${r.column_name} (${r.data_type})`));

        // 3. Check RLS Status (pg_class)
        const resRlsStatus = await client.query(`
        SELECT relrowsecurity, relforcerowsecurity
        FROM pg_class
        WHERE oid = 'public.analytics_events'::regclass;
    `);
        console.log('\n--- RLS Status (pg_class) ---');
        console.log(`relrowsecurity: ${resRlsStatus.rows[0]?.relrowsecurity}`);
        console.log(`relforcerowsecurity: ${resRlsStatus.rows[0]?.relforcerowsecurity}`);

        // 4. Check Policies (Exact User Query)
        const resPolicies = await client.query(`
        SELECT policyname, cmd, roles
        FROM pg_policies
        WHERE schemaname='public' AND tablename='analytics_events'
        ORDER BY policyname;
    `);
        console.log('\n--- Policies (pg_policies) ---');
        if (resPolicies.rowCount === 0) {
            console.log('(No policies found)');
        } else {
            resPolicies.rows.forEach(r => console.log(`Policy: "${r.policyname}" | Cmd: ${r.cmd} | Roles: {${r.roles}}`));
        }

        // 5. Check Runtime Events (Backend Source)
        const resBackendEvents = await client.query(`
        SELECT created_at, event, source, properties
        FROM public.analytics_events
        WHERE (properties->>'source')='backend' OR source='backend'
        ORDER BY created_at DESC
        LIMIT 5;
    `);
        console.log('\n--- Runtime Backend Events ---');
        if (resBackendEvents.rowCount === 0) {
            console.log('(No backend events found)');
        } else {
            resBackendEvents.rows.forEach(r => console.log(`[${r.created_at.toISOString()}] ${r.event} (${r.source})`));
        }

        // 6. Check Immutability Trigger
        const resTrigger = await client.query(`
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'public.analytics_events'::regclass 
        AND tgname = 'tr_analytics_immutable';
    `);
        if (resTrigger.rowCount > 0) {
            console.log('\nPASS: Immutability trigger found.');
        } else {
            console.warn('\nWARN: Immutability trigger NOT found.');
        }

        // 5. Runtime Data Verification
        console.log('\n--- Runtime Data Verification ---');

        const testUUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

        try {
            await client.query(`
                INSERT INTO analytics_events (event, source, properties, request_id, environment)
                VALUES ($1, $2, $3, $4, $5)
            `, ['ops.verification_test', 'script', { test: true }, testUUID, 'test']);
            console.log('PASS: Inserted test event.');
        } catch (e) {
            console.error('FAIL: Insert test event failed:', e.message);
        }

        const resRecent = await client.query(`
            SELECT event, source, created_at, org_id 
            FROM analytics_events 
            ORDER BY created_at DESC 
            LIMIT 5
        `);

        if (resRecent.rowCount > 0) {
            console.log('Recent Events:');
            resRecent.rows.forEach(r => console.log(` - [${r.created_at.toISOString()}] ${r.event} (${r.source})`));
        } else {
            console.log('No events found.');
        }

    } catch (err) {
        console.error('Verification failed:', err);
    } finally {
        await client.end();
    }
}

// Override run to include Catalog Details
async function runCatalogChecks() {
    // ... merged into main run or separate? 
    // I will just update the main run function body in correct order
}

run();
