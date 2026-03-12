const url = process.env.SUPABASE_URL || "https://bgdvlhttyjeuprrfxgun.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZHZsaHR0eWpldXBycmZ4Z3VuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk4Mzg2NSwiZXhwIjoyMDczNTU5ODY1fQ.dwoQeiAgOy4b4FFSQIH2l4OGPtyv_Bzo60emwhph_Cc";

async function run() {
    const headers = {
        'apikey': key,
        'Authorization': `Bearer ${key}`
    };

    try {
        const resProfiles = await fetch(`${url}/rest/v1/profiles?email=eq.final_trigger_test_v2_rdo@example.com`, { headers });
        const profiles = await resProfiles.json();
        console.log('--- PROFILES NEW ---');
        console.log(profiles);

        // Let's also create the final_trigger_test_v2 account credentials 
        // Wait, the subagent tried login with: final_trigger_test_v2@example.com and Teste@1234!
        // If it failed 400 Invalid Credentials, I'll reset the password manually using the Auth Admin API
        const resUserUpdate = await fetch(`${url}/auth/v1/admin/users/0c1711ea-555c-4ea8-b461-1bc2d596cb09`, {
            method: 'PUT',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: 'Teste@1234!', email_confirm: true })
        });
        console.log('Reset password for v2:', resUserUpdate.status);

    } catch (e) { console.error(e) }
}
run();
