
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bgdvlhttyjeuprrfxgun.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZHZsaHR0eWpldXBycmZ4Z3VuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk4Mzg2NSwiZXhwIjoyMDczNTU5ODY1fQ.dwoQeiAgOy4b4FFSQIH2l4OGPtyv_Bzo60emwhph_Cc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkPlans() {
    try {
        const { data: plans, error } = await supabase
            .from('plans')
            .select('slug, stripe_price_id_monthly, stripe_price_id_yearly');

        if (error) {
            console.error('Error fetching plans:', error);
            return;
        }

        console.log('--- PLANS IN DB ---');
        console.table(plans);
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkPlans();
