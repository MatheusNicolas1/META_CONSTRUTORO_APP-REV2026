import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function inspect() {
    console.log('Inspecting RDO Schema...');

    // Check RDOS table columns
    // We can't query info schema directly on remote easily with just anon key usually, 
    // but let's try to just select one RDO and see what we get, or fail.
    // Actually, checking for tables is better.

    const tables = ['rdos', 'rdo_atividades', 'rdo_equipes', 'rdo_equipamentos', 'rdo_fotos', 'documentos'];

    for (const t of tables) {
        const { error } = await supabase.from(t).select('count', { count: 'exact', head: true });
        if (error) {
            console.log(`Table '${t}': ❌ ${error.message} (Code: ${error.code})`);
        } else {
            console.log(`Table '${t}': ✅ Exists`);
        }
    }

    console.log('\nChecking RDOS columns (via empty insert attempt)...');
    // Attempt to insert a dummy record with valid structure to see if it allows extra fields? 
    // No, better to view types.ts if available.

}

inspect();
