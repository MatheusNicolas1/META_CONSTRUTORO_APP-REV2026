const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Try 54322 (Supabase Local DB default)
const DB_URL = process.env.SUPABASE_DB_URL || 'postgres://postgres:postgres@127.0.0.1:54322/postgres';

const client = new Client({
    connectionString: DB_URL,
});

const SQL_FILE = 'supabase/migrations/20260211150000_fix_rdos_schema.sql';

async function run() {
    try {
        console.log(`Connecting to ${DB_URL}...`);
        await client.connect();
        console.log('Connected to DB.');

        const sqlPath = path.resolve(process.cwd(), SQL_FILE);
        console.log(`Reading SQL from ${sqlPath}`);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing SQL...');
        await client.query(sql);
        console.log('✅ Migration applied successfully.');

        // Verify column
        console.log('Verifying schema change...');
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'rdos' AND column_name IN ('observacoes', 'equipe_ociosa')
        `);
        console.log('Columns found:', res.rows);

    } catch (e) {
        console.error('❌ Migration Failed:', e);
        process.exit(1);
    } finally {
        await client.end();
    }
}

run();
