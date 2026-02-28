const { Client } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
    console.error('❌ Missing DATABASE_URL, SUPABASE_DB_URL, or POSTGRES_URL in .env');
    console.log('Available keys:', Object.keys(process.env).filter(k => k.includes('URL') || k.includes('DB')));
    process.exit(1);
}

const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Supabase in many environments
});

const CONTRACT = {
    tables: ['orgs', 'profiles', 'obras', 'rdos', 'equipamentos', 'fornecedores'],
    aliases: {
        'documents': 'documentos'
    },
    columns: {
        common: ['org_id', 'created_at', 'updated_at'],
        'obras': ['created_by'], // status enum check is separate
        'rdos': ['created_by'],
        'equipamentos': ['created_by'],
        'fornecedores': ['created_by'],
        'documentos': ['uploaded_by']
    },
    forbidden: ['user_id', 'criado_por_id'],
};

async function verify() {
    console.log('🔍 Starting DB Contract Verification (PG Client)...');
    let errors = [];

    try {
        await client.connect();
        console.log('✅ Connected to DB');

        // 1. Check Tables Existence
        console.log('\nChecking Tables...');
        const resTables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

        const tableNames = resTables.rows.map(r => r.table_name);

        CONTRACT.tables.forEach(t => {
            if (!tableNames.includes(t)) {
                const alias = CONTRACT.aliases[t];
                if (alias && tableNames.includes(alias)) {
                    console.log(`✅ Table '${t}' found (as '${alias}')`);
                } else {
                    errors.push(`Missing Essential Table: '${t}'`);
                    console.error(`❌ Table '${t}' NOT FOUND`);
                }
            } else {
                console.log(`✅ Table '${t}' found`);
            }
        });

        // 2. Check Columns
        console.log('\nChecking Columns...');
        const resColumns = await client.query(`
            SELECT table_name, column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public'
        `);

        const allColumns = resColumns.rows;

        const tablesToCheck = [...CONTRACT.tables, ...Object.values(CONTRACT.aliases)];

        tablesToCheck.forEach(tableName => {
            if (!tableNames.includes(tableName)) return;
            // Skip auth/system tables checks for forbidden cols if irrelevant, but PRD says domains.
            // Domain tables logic:
            const isDomain = !['profiles', 'org_members', 'orgs', 'auth', 'users', 'schema_migrations', 'knex_migrations'].includes(tableName);

            const tableCols = allColumns.filter(c => c.table_name === tableName).map(c => c.column_name);

            // Check Forbidden
            if (isDomain) {
                CONTRACT.forbidden.forEach(forbiddenCol => {
                    if (tableCols.includes(forbiddenCol)) {
                        errors.push(`Forbidden Column: '${forbiddenCol}' in table '${tableName}'`);
                        console.error(`❌ '${tableName}' contains forbidden column '${forbiddenCol}'`);
                    }
                });
            }

            // Check Required
            if (isDomain) {
                if (CONTRACT.columns.common) {
                    CONTRACT.columns.common.forEach(commonCol => {
                        if (!tableCols.includes(commonCol)) {
                            // Exception: maybe some tables don't have updated_at?
                            errors.push(`Missing '${commonCol}' in '${tableName}'`);
                            console.error(`❌ '${tableName}' missing '${commonCol}'`);
                        }
                    });
                }
            }

            const contractKey = Object.keys(CONTRACT.aliases).find(k => CONTRACT.aliases[k] === tableName) || tableName;
            const required = CONTRACT.columns[contractKey];
            if (required) {
                required.forEach(reqCol => {
                    if (!tableCols.includes(reqCol)) {
                        errors.push(`Missing '${reqCol}' in '${tableName}'`);
                        console.error(`❌ '${tableName}' missing '${reqCol}'`);
                    }
                });
            }
        });

        // 3. ENUM Checks (Optional but useful)
        // We can check if obra_status enum exists and has values?
        // Query pg_type and pg_enum.

    } catch (err) {
        console.error('❌ Database Error:', err);
        process.exit(1);
    } finally {
        await client.end();
    }

    console.log('\n==================================================');
    if (errors.length > 0) {
        console.error('❌ DB CONTRACT VERIFICATION FAILED');
        console.error('Total Errors:', errors.length);
        process.exit(1);
    } else {
        console.log('✅ DB CONTRACT VERIFICATION PASSED');
        process.exit(0);
    }
}

verify();
