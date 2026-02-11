const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const client = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Checking analytics_events table...');
    const { data, error } = await client.from('analytics_events').select('*').limit(1);

    if (error) {
        console.error('Error (Table likely missing):', error.message);
        console.log('Code:', error.code);
    } else {
        console.log('✅ Table exists!');
    }
}

run();
