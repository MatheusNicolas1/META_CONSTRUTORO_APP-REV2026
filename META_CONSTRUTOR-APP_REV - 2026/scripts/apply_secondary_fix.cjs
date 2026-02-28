const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Try 54322 (Supabase Local DB default)
const DB_URL = process.env.SUPABASE_DB_URL || 'postgres://postgres:postgres@127.0.0.1:54322/postgres';

const client = new Client({
    connectionString: DB_URL,
});

const SQL_FILE = 'supabase/migrations/20260211160000_add_org_id_secondary.sql';

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
        const tables = ['equipamentos', 'equipes', 'fornecedores'];
        for (const table of tables) {
            const res = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1 AND column_name = 'org_id'
            `, [table]);
            console.log(`Table ${table} org_id:`, res.rows.length > 0 ? 'FOUND' : 'MISSING');
        }

    } catch (e) {
        console.error('❌ Migration Failed:', e);
        process.exit(1);
    } finally {
        await client.end();
    }
}

run();
