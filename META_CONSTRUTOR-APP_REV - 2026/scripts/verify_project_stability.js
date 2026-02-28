
import pg from 'pg';
const { Client } = pg;

// Connection string for local Supabase
const connectionString = process.env.DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function verify() {
    const client = new Client({ connectionString });

    console.log('🔍 Starting Project Stability Verification...');

    try {
        await client.connect();
        console.log('✅ Connected to Database');

        // 1. Check ENUMS
        console.log('\n--- Checking Enums ---');
        const enums = await client.query(`
      SELECT t.typname, e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname IN ('app_role', 'obra_status', 'rdo_status')
      ORDER BY t.typname;
    `);

        const requiredEnums = {
            'app_role': ['Administrador', 'Gerente', 'Colaborador'],
            'obra_status': ['ACTIVE', 'DRAFT'], // Checking key ones
            'rdo_status': ['DRAFT', 'SUBMITTED']
        };

        let enumsOk = true;
        for (const [type, labels] of Object.entries(requiredEnums)) {
            const found = enums.rows.filter(r => r.typname === type).map(r => r.enumlabel);
            const missing = labels.filter(l => !found.includes(l));
            if (missing.length > 0) {
                console.error(`❌ Missing enum values for ${type}: ${missing.join(', ')}`);
                enumsOk = false;
            } else {
                console.log(`✅ Enum ${type} OK`);
            }
        }

        // 2. Check COLUMNS
        console.log('\n--- Checking Columns ---');
        const cols = await client.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name IN ('orgs', 'org_members', 'obras', 'rdos');
    `);

        const requiredCols = {
            'orgs': ['id', 'owner_user_id', 'slug'],
            'org_members': ['org_id', 'user_id', 'role'], // Keep user_id for auth
            'obras': ['id', 'org_id', 'created_by', 'status'], // Updated to created_by
            'rdos': ['id', 'org_id', 'created_by', 'status'] // Updated to created_by
        };

        let colsOk = true;
        for (const [table, columns] of Object.entries(requiredCols)) {
            const found = cols.rows.filter(r => r.table_name === table).map(r => r.column_name);
            const missing = columns.filter(c => !found.includes(c));
            if (missing.length > 0) {
                console.error(`❌ Missing columns in ${table}: ${missing.join(', ')}`);
                colsOk = false;
            } else {
                console.log(`✅ Table ${table} OK`);
            }
        }

        // 3. Check SEED DATA
        console.log('\n--- Checking Seed Data ---');
        const orgsCount = await client.query('SELECT count(*) FROM orgs');
        const usersCount = await client.query('SELECT count(*) FROM auth.users');
        const obrasCount = await client.query('SELECT count(*) FROM obras');

        console.log(`Orgs: ${orgsCount.rows[0].count}`);
        console.log(`Users: ${usersCount.rows[0].count}`);
        console.log(`Obras: ${obrasCount.rows[0].count}`);

        if (parseInt(orgsCount.rows[0].count) > 0 && parseInt(obrasCount.rows[0].count) > 0) {
            console.log('✅ Seed data appears to be present');
        } else {
            console.warn('⚠️ Seed data might be missing (Counts are 0)');
        }

        if (enumsOk && colsOk) {
            console.log('\n🎉 VALIDATION PASSED: Schema is aligned with PRD 2.0');
            process.exit(0);
        } else {
            console.error('\n❌ VALIDATION FAILED: Schema drift detected');
            process.exit(1);
        }

    } catch (err) {
        console.error('❌ Connection Error:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

verify();
