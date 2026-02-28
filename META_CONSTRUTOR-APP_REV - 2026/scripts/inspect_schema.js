
import pg from 'pg';
const { Client } = pg;

// Standard local Supabase connection
const connectionString = process.env.DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function inspect() {
    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log('Connected to Database');

        console.log('\n--- ENUM VALUES ---');
        const enumsQuery = `
      SELECT t.typname, e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname IN ('obra_status','rdos_status','checklist_status','app_role','rdo_status')
      ORDER BY t.typname, e.enumsortorder;
    `;
        const enumsRes = await client.query(enumsQuery);
        console.table(enumsRes.rows);

        console.log('\n--- COLUMNS (public.rdos, public.obras) ---');
        const colsQuery = `
      SELECT table_name, column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name IN ('rdos','obras')
      ORDER BY table_name, ordinal_position;
    `;
        const colsRes = await client.query(colsQuery);
        console.table(colsRes.rows.map(r => ({
            table: r.table_name,
            col: r.column_name,
            type: r.data_type,
            udt: r.udt_name
        })));

        console.log('\n--- SEED DATA VALIDATION ---');

        // Obras
        const resObras = await client.query('SELECT count(*) as count, status FROM public.obras GROUP BY status');
        console.log('Obras per status:', resObras.rows);

        // RDOs
        // Check for user_id column existence first to avoid crash if schema is wrong, though we expect it to be correct now.
        const rdosCols = colsRes.rows.filter(r => r.table_name === 'rdos').map(r => r.column_name);
        const hasUserId = rdosCols.includes('user_id');
        const hasCriadoPor = rdosCols.includes('criado_por_id');

        console.log(`RDO Columns Check: user_id=${hasUserId}, criado_por_id=${hasCriadoPor}`);

        if (hasUserId) {
            const resRDOs = await client.query('SELECT count(*) as count, status, user_id FROM public.rdos GROUP BY status, user_id');
            console.log('RDOs per status/user_id:', resRDOs.rows);
        } else if (hasCriadoPor) {
            const resRDOs = await client.query('SELECT count(*) as count, status, criado_por_id FROM public.rdos GROUP BY status, criado_por_id');
            console.log('RDOs per status/criado_por_id:', resRDOs.rows);
        } else {
            console.log('CRITICAL: Neither user_id nor criado_por_id found in rdos!');
        }

    } catch (err) {
        console.error('Inspection Error:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

inspect();
