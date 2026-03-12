const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:SAlocin1996,.;@db.bgdvlhttyjeuprrfxgun.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    await client.connect();
    try {
        const resAuth = await client.query("SELECT id, email, created_at FROM auth.users WHERE email = 'final_trigger_test_v2@example.com' OR email = 'final_trigger_test_v2_rdo@example.com'");
        console.log('--- AUTH USERS ---');
        console.log(JSON.stringify(resAuth.rows, null, 2));

        const resProfiles = await client.query("SELECT id, email, plan_type, role FROM public.profiles WHERE email = 'final_trigger_test_v2@example.com' OR email = 'final_trigger_test_v2_rdo@example.com'");
        console.log('--- PUBLIC PROFILES ---');
        console.log(JSON.stringify(resProfiles.rows, null, 2));

    } catch (err) {
        console.error('Error fetching data:', err);
    } finally {
        await client.end();
    }
}
run();
