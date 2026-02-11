const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL || 'postgresql://postgres:postgres@localhost:54322/postgres',
});

const SQL_FILE = 'supabase/migrations/20260210160000_analytics_events.sql';

async function run() {
    try {
        await client.connect();
        console.log('Connected to DB. Reading SQL file...');
        const sql = fs.readFileSync(SQL_FILE, 'utf8');

        console.log('Executing SQL...');
        await client.query(sql);
        console.log('✅ Migration applied successfully.');

        // Verify
        const res = await client.query("SELECT to_regclass('public.analytics_events')");
        console.log('Verification:', res.rows[0]);

    } catch (e) {
        console.error('❌ Migration Failed:', e);
    } finally {
        await client.end();
    }
}

run();
