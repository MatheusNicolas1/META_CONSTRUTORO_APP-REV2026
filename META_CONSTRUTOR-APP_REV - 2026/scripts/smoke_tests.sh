#!/bin/bash
# Smoke tests for Meta Construtor
set -e

cd "$(dirname "$0")/.."

# Read keys
SUPABASE_URL=$(grep VITE_SUPABASE_ANON_KEY .env | cut -d= -f2-)
SUPABASE_ANON=$(grep VITE_SUPABASE_ANON_KEY .env | cut -d= -f2-)
SUPABASE_SRV=$(grep SUPABASE_SERVICE_ROLE_KEY .env | cut -d= -f2-)
SUPABASE_PROJECT_URL="https://bgdvlhttyjeuprrfxgun.supabase.co"

echo "=== 1. Health Check ==="
curl -s -w "\nHTTP:%{http_code}" \
  -H "Authorization: Bearer $SUPABASE_SRV" \
  "$SUPABASE_PROJECT_URL/functions/v1/health-check"
echo ""

echo "=== 2. Analytics Events (anon insert - smoke) ==="
curl -s -w "\nHTTP:%{http_code}" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_ANON" \
  -H "Authorization: Bearer $SUPABASE_ANON" \
  -d '{"event_type":"smoke_test","page_url":"/smoke","event_data_json":"{\"test\":true}"}' \
  "$SUPABASE_PROJECT_URL/rest/v1/analytics_events"
echo ""

echo "=== 3. Create Checkout Session (smoke - expect JWT error) ==="
curl -s -w "\nHTTP:%{http_code}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_SRV" \
  -d '{"price_id":"price_1Spd6ICHfNdO9jxNRYj10lkA","org_id":"smoke-test","user_id":"smoke-test","success_url":"https://example.com","cancel_url":"https://example.com"}' \
  "$SUPABASE_PROJECT_URL/functions/v1/create-checkout-session"
echo ""

echo "=== 4. Create Portal Session (smoke - expect error customer not found) ==="
curl -s -w "\nHTTP:%{http_code}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_SRV" \
  -d '{"customer_id":"smoke-test-cus","return_url":"https://example.com"}' \
  "$SUPABASE_PROJECT_URL/functions/v1/create-portal-session"
echo ""

echo "=== 5. Stripe Webhook (smoke - public endpoint) ==="
curl -s -w "\nHTTP:%{http_code}" \
  "$SUPABASE_PROJECT_URL/functions/v1/stripe-webhook"
echo ""

echo "=== 6. Public Routes (smoke via Supabase) ==="
curl -s -w "\nHTTP:%{http_code}" \
  "$SUPABASE_PROJECT_URL/functions/v1/send-contact"
echo ""

echo "=== Done ==="
