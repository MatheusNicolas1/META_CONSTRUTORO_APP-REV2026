
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Hardcoded for testing reliability 
const supabaseUrl = 'https://bgdvlhttyjeuprrfxgun.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZHZsaHR0eWpldXBycmZ4Z3VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5ODM4NjUsImV4cCI6MjA3MzU1OTg2NX0.SO1sQBUKs12RQ7tArdPmgbbIq4MU2Ygwl6FNZT-3uLA';

const supabase = createClient(supabaseUrl, supabaseKey);

function log(message: string) {
    console.log(message);
    fs.appendFileSync('checkout_test_log.txt', message + '\n');
}

async function testCheckoutFlow() {
    fs.writeFileSync('checkout_test_log.txt', '--- Starting Checkout Flow Test ---\n');

    // 1. Authenticate (Create a temp user or sign in)
    const email = `test.checkout.${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    log(`1. Creating/Signing in test user: ${email}`);

    // Try Sign Up first
    let { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name: 'Test Automatico',
                phone: '11999999999',
                cpf_cnpj: '00000000000'
            }
        }
    });

    if (authError) {
        log('Sign up failed (maybe user exists), trying sign in...');
        const result = await supabase.auth.signInWithPassword({
            email,
            password
        });
        authData = result.data;
        authError = result.error;
    }

    if (authError || !authData.session) {
        log(`CRITICAL: Authentication failed. ${authError?.message}`);
        return;
    }

    log(`User authenticated. Token: ${authData.session.access_token.substring(0, 20)}...`);

    // Get Plans
    log('2. Fetching available plans...');
    const { data: plans, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        //.neq('slug', 'free') // Skip free
        .neq('slug', 'business'); // Skip business (contact only)

    if (plansError) {
        log(`CRITICAL: Failed to fetch plans from DB. ${plansError.message}`);
        return;
    }

    if (!plans || plans.length === 0) {
        log('CRITICAL: No plans found in DB.');
        return;
    }

    log(`Found ${plans.length} plans to test from DB: ${plans.map(p => p.slug).join(', ')}`);

    // Test Checkout for each plan
    for (const plan of plans) {
        if (plan.slug === 'free') continue;

        log(`\nTesting Plan: ${plan.name} (${plan.slug})`);

        try {
            // Manually invoke function
            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                body: {
                    plan: plan.slug,
                    billing: 'monthly'
                }
            });

            if (error) {
                log(`FAILED: Error invoking function for ${plan.slug}: ${error.message}`); // Use error.message if available
                if (error.context) log(`Context: ${JSON.stringify(error.context)}`);
            } else if (data?.url) {
                log(`SUCCESS: Checkout URL generated for ${plan.slug}`);
                log(`URL: ${data.url}`);
            } else {
                log(`FAILED: No URL returned for ${plan.slug}. Response: ${JSON.stringify(data)}`);
            }
        } catch (err: any) {
            log(`EXCEPTION: ${plan.slug}: ${err.message}`);
        }
    }

    log('\n--- Test Complete ---');
}

testCheckoutFlow();
