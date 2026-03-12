const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function testObra() {
    const { data: user } = await supabaseAdmin.auth.admin.listUsers();
    const testUser = user?.users.find(u => u.email === 'final_trigger_test_v2@example.com');

    if (!testUser) {
        fs.writeFileSync('error.json', JSON.stringify({ error: 'User not found' }, null, 2));
        return;
    }

    // Get a test org ID
    const { data: orgs } = await supabaseAdmin.from('orgs').select('id').limit(1);

    const { data: obra1, error: errObra1 } = await supabaseAdmin
        .from('obras')
        .insert({
            org_id: orgs[0].id,
            nome: 'Obra Teste Error Capture',
            status: 'ACTIVE',
            user_id: testUser.id
        })
        .select()
        .single();

    fs.writeFileSync('error.json', JSON.stringify({ error: errObra1, data: obra1 }, null, 2));
}

testObra();
