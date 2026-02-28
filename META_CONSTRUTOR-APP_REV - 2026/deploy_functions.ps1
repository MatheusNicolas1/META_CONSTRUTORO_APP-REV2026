
# Deploy new Edge Functions
$PROJECT_ID = "bgdvlhttyjeuprrfxgun"

npx supabase functions deploy create-checkout-session --project-ref $PROJECT_ID
npx supabase functions deploy change-subscription --project-ref $PROJECT_ID
npx supabase functions deploy cancel-subscription --project-ref $PROJECT_ID

# Verify deployment
Write-Host "Functions deployed. Please verify in Supabase Dashboard."
