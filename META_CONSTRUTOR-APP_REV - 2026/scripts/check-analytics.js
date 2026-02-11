import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load env
try {
    const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
    for (const k in envConfig) {
        process.env[k] = envConfig[k]
    }
} catch (e) {
    console.log('No .env.local found or error parsing');
}

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
        process.exit(1);
    } else {
        console.log('✅ Table exists!');
    }
}

run();
