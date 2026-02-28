
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bgdvlhttyjeuprrfxgun.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZHZsaHR0eWpldXBycmZ4Z3VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5ODM4NjUsImV4cCI6MjA3MzU1OTg2NX0.SO1sQBUKs12RQ7tArdPmgbbIq4MU2Ygwl6FNZT-3uLA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPlans() {
    console.log('Querying plans table...');
    const { data, error } = await supabase.from('plans').select('*');

    if (error) {
        console.error('Error querying plans:', error);
    } else {
        console.log(`Plans found: ${data?.length}`);
        data?.forEach(plan => {
            console.log(`- ${plan.name} (${plan.slug}): Active=${plan.is_active}, StripeID=${plan.stripe_price_id_monthly}`);
        });
    }
}

debugPlans();
