
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bgdvlhttyjeuprrfxgun.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZHZsaHR0eWpldXBycmZ4Z3VuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk4Mzg2NSwiZXhwIjoyMDczNTU5ODY1fQ.dwoQeiAgOy4b4FFSQIH2l4OGPtyv_Bzo60emwhph_Cc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const UPDATES = [
    {
        slug: 'basic',
        stripe_price_id_monthly: 'price_1T1HSsCHfNdO9jxNJyBqYUW1',
        stripe_price_id_yearly: 'price_1T1HSsCHfNdO9jxN0oT7lsgq'
    },
    {
        slug: 'professional',
        stripe_price_id_monthly: 'price_1T1HSsCHfNdO9jxNDtPicSaZ',
        stripe_price_id_yearly: 'price_1T1HStCHfNdO9jxN2BtTrfpS'
    },
    {
        slug: 'master',
        stripe_price_id_monthly: 'price_1T1HStCHfNdO9jxNsjxKYfjw',
        stripe_price_id_yearly: 'price_1T1HStCHfNdO9jxNpT8KUqLV'
    }
];

async function updatePlans() {
    console.log('Starting Plan Updates...');

    for (const plan of UPDATES) {
        console.log(`Updating ${plan.slug}...`);
        const { error } = await supabase
            .from('plans')
            .update({
                stripe_price_id_monthly: plan.stripe_price_id_monthly,
                stripe_price_id_yearly: plan.stripe_price_id_yearly
            })
            .eq('slug', plan.slug);

        if (error) {
            console.error(`Error updating ${plan.slug}:`, error);
        } else {
            console.log(`Success: ${plan.slug} updated.`);
        }
    }

    console.log('--- VERIFICATION ---');
    const { data: plansData, error: verifyError } = await supabase
        .from('plans')
        .select('slug, stripe_price_id_monthly, stripe_price_id_yearly');

    if (verifyError) {
        console.error('Verification Error:', verifyError);
    } else {
        console.table(plansData);
    }
}

updatePlans();
