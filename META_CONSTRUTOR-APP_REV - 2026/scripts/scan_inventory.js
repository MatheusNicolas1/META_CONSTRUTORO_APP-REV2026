
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const connectionString = process.env.DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const EVIDENCE_DIR = path.join(PROJECT_ROOT, 'docs', 'evidence', 'generated');

async function scan() {
    const client = new Client({ connectionString });
    const report = {
        timestamp: new Date().toISOString(),
        database: {},
        codebase: {}
    };

    try {
        console.log('🔍 Connecting to database...');
        await client.connect();

        // --- DATABASE ---
        console.log('📊 Scanning Table Schema...');
        const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);

        report.database.tables = {};
        for (const row of tables.rows) {
            const tableName = row.table_name;
            const cols = await client.query(`
        SELECT column_name, data_type, udt_name, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
      `, [tableName]);

            report.database.tables[tableName] = cols.rows.map(c => ({
                name: c.column_name,
                type: c.data_type,
                udt: c.udt_name,
                nullable: c.is_nullable
            }));
        }

        console.log('🔠 Scanning Enums...');
        const enums = await client.query(`
      SELECT t.typname, e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      ORDER BY t.typname, e.enumsortorder
    `);

        report.database.enums = {};
        for (const row of enums.rows) {
            if (!report.database.enums[row.typname]) {
                report.database.enums[row.typname] = [];
            }
            report.database.enums[row.typname].push(row.enumlabel);
        }

        // --- CODEBASE ---
        console.log('📂 Scanning Migrations...');
        const migrationsDir = path.join(PROJECT_ROOT, 'supabase', 'migrations');
        if (fs.existsSync(migrationsDir)) {
            report.codebase.migrations = fs.readdirSync(migrationsDir).sort();
        } else {
            report.codebase.migrations = [];
        }

        console.log('🎣 Scanning Hooks...');
        const hooksDir = path.join(PROJECT_ROOT, 'src', 'hooks');
        report.codebase.hooks = [];
        if (fs.existsSync(hooksDir)) {
            const hookFiles = fs.readdirSync(hooksDir).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
            for (const file of hookFiles) {
                const content = fs.readFileSync(path.join(hooksDir, file), 'utf-8');
                report.codebase.hooks.push({
                    file,
                    usesUserId: content.includes('user_id'),
                    usesOrgId: content.includes('org_id'),
                    usesCriadoPor: content.includes('criado_por_id'),
                    usesStatusEnum: content.includes('ACTIVE') || content.includes('DRAFT'),
                    rawContentSnippet: content.slice(0, 200) // Preview
                });
            }
        }

        // Output to JSON
        fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
        const outputPath = path.join(EVIDENCE_DIR, 'INVENTORY_RAW.json');
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
        console.log(`✅ Scan complete. Saved to ${outputPath}`);
        process.exit(0);

    } catch (err) {
        console.error('❌ Error during scan:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

scan();
