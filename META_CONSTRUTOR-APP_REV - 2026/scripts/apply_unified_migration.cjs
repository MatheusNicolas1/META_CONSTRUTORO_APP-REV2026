const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Try 54322 (Supabase Local DB default)
const DB_URL = process.env.SUPABASE_DB_URL || 'postgres://postgres:postgres@127.0.0.1:54322/postgres';

const client = new Client({
    connectionString: DB_URL,
});

const SQL_FILE = 'supabase/migrations/20260211170000_unify_org_id_and_documents.sql';

async function run() {
    try {
        console.log(`Connecting to ${DB_URL}...`);
        await client.connect();
        console.log('Connected to DB.');

        const sqlPath = path.resolve(process.cwd(), SQL_FILE);
        console.log(`Reading SQL from ${sqlPath}`);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing SQL (Unified Org Migration)...');
        await client.query(sql);
        console.log('✅ Migration applied successfully.');

        // Verify documents table
        console.log('Verifying documents table...');
        const res = await client.query(`
            SELECT to_regclass('public.documents') as result
        `);
        console.log('Documents table exists:', !!res.rows[0].result);

    } catch (e) {
        console.error('❌ Migration Failed:', e);
        process.exit(1);
    } finally {
        await client.end();
    }
}

run();
