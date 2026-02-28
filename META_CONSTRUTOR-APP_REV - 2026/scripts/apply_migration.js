import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const { Client } = pg;
const connectionString = process.env.VITE_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ DATABASE_URL or VITE_DATABASE_URL not set!");
    process.exit(1);
}

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        console.log("✅ Connected to DB");

        const migrationPath = path.join(PROJECT_ROOT, 'supabase', 'migrations', '20260213000000_add_rdo_detalhes.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log(`Executing migration: ${path.basename(migrationPath)}`);
        await client.query(sql);
        console.log("✅ Migration applied successfully!");

    } catch (err) {
        console.error("❌ Migration failed:", err);
    } finally {
        await client.end();
    }
}

run();
