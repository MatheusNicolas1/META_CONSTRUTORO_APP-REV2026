const { Client } = require('pg');

// Try 54322 first
const DB_URL = process.env.SUPABASE_DB_URL || 'postgres://postgres:postgres@127.0.0.1:54322/postgres';

async function checkTable(table, client) {
    const res = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = 'org_id'
        `, [table]);

    if (res.rows.length === 0) {
        return { table, has_org_id: false };
    } else {
        return { table, has_org_id: true, details: res.rows[0] };
    }
}

async function run() {
    const client = new Client({ connectionString: DB_URL });
    try {
        await client.connect();
        console.log('Connected to DB');

        const tables = [
            'equipes',
            'atividades',
            'obras',
            'fornecedores',
            'rdos',
            'notifications',
            'documents',
            'checklists',
            'equipamentos'
        ];

        console.log('--- Checking for org_id ---');
        for (const table of tables) {
            const result = await checkTable(table, client);
            console.log(`${result.table}: ${result.has_org_id ? '✅ HAS org_id' : '❌ MISSING org_id'}`);
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
}

run();
