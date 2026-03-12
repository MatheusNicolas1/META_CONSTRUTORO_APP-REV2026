const fs = require('fs');
const { Client } = require('pg');

const env = fs.readFileSync('.env.local', 'utf-8');
const dbUrlMatch = env.match(/DATABASE_URL=(.*)/);
if (!dbUrlMatch) { console.log('No DATABASE_URL'); process.exit(1); }

const client = new Client({ connectionString: dbUrlMatch[1].trim() });

async function check() {
    await client.connect();
    const res = await client.query("SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name IN ('equipes', 'equipamentos', 'fornecedores') ORDER BY table_name, ordinal_position");

    const tables = {};
    for (const row of res.rows) {
        if (!tables[row.table_name]) tables[row.table_name] = [];
        tables[row.table_name].push(row.column_name + ' (' + row.data_type + ')');
    }
    console.log(JSON.stringify(tables, null, 2));

    await client.end();
}
check();
