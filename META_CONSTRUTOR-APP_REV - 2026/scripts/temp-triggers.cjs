const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL || 'postgresql://postgres:postgres@localhost:54322/postgres',
});

async function run() {
    try {
        await client.connect();

        const q1 = `SELECT tgname FROM pg_trigger WHERE tgrelid='public.obras'::regclass AND NOT tgisinternal ORDER BY tgname;`;
        console.log('--- Triggers: Obras ---');
        const r1 = await client.query(q1);
        r1.rows.forEach(r => console.log(r.tgname));

        const q2 = `SELECT tgname FROM pg_trigger WHERE tgrelid='public.expenses'::regclass AND NOT tgisinternal ORDER BY tgname;`;
        console.log('\n--- Triggers: Expenses ---');
        const r2 = await client.query(q2);
        r2.rows.forEach(r => console.log(r.tgname));

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
