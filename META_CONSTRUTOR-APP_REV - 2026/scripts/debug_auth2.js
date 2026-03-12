const url = process.env.SUPABASE_URL || "https://bgdvlhttyjeuprrfxgun.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZHZsaHR0eWpldXBycmZ4Z3VuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk4Mzg2NSwiZXhwIjoyMDczNTU5ODY1fQ.dwoQeiAgOy4b4FFSQIH2l4OGPtyv_Bzo60emwhph_Cc";

async function run() {
    const headers = {
        'apikey': key,
        'Authorization': `Bearer ${key}`
    };

    try {
        const resProfiles = await fetch(`${url}/rest/v1/profiles?email=eq.final_trigger_test_v2@example.com`, { headers });
        const profiles = await resProfiles.json();
        console.log('--- PROFILES ---');
        console.log(profiles);

        const resUsers = await fetch(`${url}/rest/v1/users`, { headers }); // This might not work directly via REST
        // Let's use RPC or auth admin API if possible, but PostgREST doesn't expose auth.users by default.
    } catch (e) { console.error(e) }
}
run();
