const { Client } = require('pg');

// Try 54322 first
const DB_URL = process.env.SUPABASE_DB_URL || 'postgres://postgres:postgres@127.0.0.1:54322/postgres';

async function checkTable(table, client) {
    console.log(`\n--- Table: ${table} ---`);
    const res = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY column_name`, [table]);

    if (res.rows.length === 0) {
        console.log('Table not found or no columns.');
    } else {
        res.rows.forEach(row => {
            console.log(`${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
    }
}

async function run() {
    const client = new Client({ connectionString: DB_URL });
    try {
        console.log(`Connecting to ${DB_URL}...`);
        await client.connect();

        await checkTable('equipamentos', client);
        await checkTable('equipes', client);
        await checkTable('fornecedores', client);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
}

run();
