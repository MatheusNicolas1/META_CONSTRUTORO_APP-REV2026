const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Use the port from Verify Catalog which worked (54322 or 54321?)
// Verify catalog used: postgres://postgres:postgres@127.0.0.1:54322/postgres
const DB_URL = process.env.SUPABASE_DB_URL || 'postgres://postgres:postgres@127.0.0.1:54322/postgres';

const client = new Client({
    connectionString: DB_URL,
});

const SQL_FILE = 'supabase/migrations/20260210160000_analytics_events.sql';

async function run() {
    try {
        await client.connect();
        console.log('Connected to DB.');

        const sqlPath = path.resolve(process.cwd(), SQL_FILE);
        console.log(`Reading SQL from ${sqlPath}`);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing SQL...');
        await client.query(sql);
        console.log('✅ Migration applied successfully.');

        // Verify
        const res = await client.query("SELECT to_regclass('public.analytics_events')");
        console.log('Verification (Table Exists):', res.rows[0]);

    } catch (e) {
        console.error('❌ Migration Failed:', e);
    } finally {
        await client.end();
    }
}

run();
