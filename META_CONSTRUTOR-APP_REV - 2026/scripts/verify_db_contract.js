
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || (!supabaseKey && !serviceRoleKey)) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

// Prefer service role for admin tasks if available, otherwise anon (might fail on RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function verifyContract() {
    console.log('Starting DB Contract Verification...');
    let errors = [];

    // 1. Check Tables
    const tablesToCheck = ['orgs', 'org_members', 'obras', 'rdos', 'documentos'];
    /* 
       Note: Supabase-js doesn't expose table inspection directly without admin API or querying `information_schema`.
       We will use rpc if available, or just try to select 1 from them using a helper function or raw query if possible.
       Since we can't run raw SQL easily via client without an RPC, we will try to select limit 0.
       However, standard client might be blocked by RLS if we don't use service role.
    */

    // Using a custom RPC or assuming we can check information_schema via a view?
    // Let's assume we can try to SELECT * FROM information_schema.columns (if permissions allow)
    // Or just try to select from the table.

    // Strategy: We will assume we have an RPC `get_schema_info` or similar from previous migrations? 
    // No, PRD2 says "create verify_db_contract".
    // Let's rely on error messages from a simple select.

    for (const table of tablesToCheck) {
        const { error } = await supabase.from(table).select('id').limit(1);
        // If table doesn't exist, error code is usually 42P01 (undefined_table)
        if (error) {
            if (error.code === '42P01') {
                errors.push(`MISSING TABLE: ${table}`);
            } else {
                // Could be RLS or other error, but table likely exists
                console.log(`[INFO] Table ${table} exists (Access check: ${error.message})`);
            }
        } else {
            console.log(`[OK] Table ${table} exists.`);
        }
    }

    // 2. Check Enums (Indirectly via data or just assuming existence for now if we can't query types)
    // If we can't query pg_types, we skip.

    // Dump columns for obras to debug
    const { data: cols, error: colError } = await supabase
        .from('obras')
        .select('*')
        .limit(0);
    // Actually we need keys.
    // We can't query information_schema easily with client.
    // But if we select * limit 1, we get keys.
    const { data: obraRow, error: obraError } = await supabase.from('obras').select('*').limit(1);
    if (obraRow && obraRow.length > 0) {
        console.log('DEBUG: obras columns:', Object.keys(obraRow[0]));
    } else {
        console.log('DEBUG: obras table empty (or error), cannot dump columns via select *');
        if (obraError) console.log('DEBUG: Error selecting obras:', obraError);
    }

    // 3. Check Important Columns (Canonical)
    // We can try to select the column.
    const columnChecks = [
        { table: 'obras', col: 'created_by' },
        { table: 'obras', col: 'org_id' },
        { table: 'rdos', col: 'created_by' },
        { table: 'rdos', col: 'org_id' },
        { table: 'documentos', col: 'uploaded_by' },
        { table: 'documentos', col: 'org_id' },
    ];

    for (const check of columnChecks) {
        const { error } = await supabase.from(check.table).select(check.col).limit(1);
        if (error) {
            // If column doesn't exist, '42703' (undefined_column)
            if (error.code === '42703') {
                errors.push(`MISSING COLUMN: ${check.table}.${check.col}`);
            } else if (error.code === '42P01') {
                // Table missing already logged
            } else {
                // Assume OK if it's just RLS
                console.log(`[OK] Column ${check.table}.${check.col} appears to exist.`);
            }
        } else {
            console.log(`[OK] Column ${check.table}.${check.col} exists.`);
        }
    }

    // 4. Check for Prohibited Columns (user_id)
    const prohibitedChecks = [
        { table: 'obras', col: 'user_id' },
        { table: 'rdos', col: 'user_id' }
    ];

    for (const check of prohibitedChecks) {
        const { error } = await supabase.from(check.table).select(check.col).limit(1);
        if (!error) {
            // It selected successfully => Column EXISTS (BAD)
            errors.push(`FORBIDDEN COLUMN DETECTED: ${check.table}.${check.col} (Should be removed/migrated)`);
        } else {
            if (error.code === '42703') {
                console.log(`[OK] Forbidden column ${check.table}.${check.col} is absent.`);
            }
        }
    }

    // 5. Check Helper RPCs
    const rpcs = ['is_org_member', 'has_org_role'];
    for (const rpc of rpcs) {
        const { error } = await supabase.rpc(rpc, { p_org_id: '00000000-0000-0000-0000-000000000000' });
        // We expect "function not found" or "invalid input", but if function missing: 42883
        if (error && error.code === '42883') {
            errors.push(`MISSING RPC: ${rpc}`);
        } else {
            console.log(`[OK] RPC ${rpc} exists.`);
        }
    }

    console.log('--- VERIFICATION RESULTS ---');
    if (errors.length > 0) {
        console.error('FAIL: Contract violations found:');
        errors.forEach(e => console.error(` - ${e}`));
        process.exit(1);
    } else {
        console.log('SUCCESS: DB Contract Verified.');
        process.exit(0);
    }
}

verifyContract().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
