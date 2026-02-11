const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
// Also try .env.local if needed
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Default Supabase Local DB URL if not found (standard port 54322)
// Adjust if user uses different port
// Force Local DB for stable migrations
const DATABASE_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

console.log('Connecting to DB:', DATABASE_URL.replace(/:[^:@]*@/, ':****@')); // Hide password

const client = new Client({
    connectionString: DATABASE_URL,
});

async function run() {
    try {
        await client.connect();

        const migrations = [
            'supabase/migrations/20260210160000_analytics_events.sql',
            'supabase/migrations/20260210170000_harden_analytics.sql',
            'supabase/migrations/20260210173000_reload_schema_func.sql'
        ];

        for (const migration of migrations) {
            console.log(`\nApplying ${migration}...`);
            const sqlPath = path.resolve(__dirname, '..', migration);
            if (fs.existsSync(sqlPath)) {
                const sql = fs.readFileSync(sqlPath, 'utf8');
                await client.query(sql);
                console.log('  Success.');
            } else {
                console.error(`  file not found: ${sqlPath}`);
            }
        }

        // Final force reload
        console.log('\nReloading PostgREST schema cache...');
        await client.query("NOTIFY pgrst, 'reload config'");
        console.log('  Done.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

run();
