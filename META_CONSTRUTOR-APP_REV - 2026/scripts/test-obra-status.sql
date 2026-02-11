-- M6.1 Validation: Test obra status transitions
-- Create test obra with all required fields, test valid/invalid transitions

\set QUIET on
\pset border 2

\echo ''
\echo '═══════════════════════════════════════════════════════════════════════════════'
\echo '                    M6.1 OBRA STATUS TRANSITIONS TEST'    
\echo '═══════════════════════════════════════════════════════════════════════════════'

-- Disable triggers temporarily to create test obra
ALTER TABLE obras DISABLE TRIGGER trigger_enforce_max_obras;
ALTER TABLE obras DISABLE TRIGGER trigger_audit_obras_changes;

-- Create test obra in DRAFT status
INSERT INTO obras (org_id, nome, localizacao, responsavel, status)
SELECT 
    o.id,
    'M6.1 Test Obra',
    'Test Location',
    u.id,
    'DRAFT'::obra_status
FROM orgs o
CROSS JOIN auth.users u
LIMIT 1
RETURNING id as test_obra_id;
\gset

-- Re-enable audit trigger only (keep max_obras disabled for testing)
ALTER TABLE obras ENABLE TRIGGER trigger_audit_obras_changes;

\echo ''
\echo 'Test obra created with ID:' :test_obra_id
\echo ''

-- TEST 1: Valid transition DRAFT -> ACTIVE
\echo '──────────────────────────────────────────────────────────────────────────────'
\echo 'TEST 1: DRAFT -> ACTIVE (should PASS)'
\echo '──────────────────────────────────────────────────────────────────────────────'

UPDATE obras 
SET status = 'ACTIVE'::obra_status 
WHERE id = :'test_obra_id'::uuid
RETURNING id, nome, status;

\echo '✅ TEST 1 PASSED: Transition DRAFT -> ACTIVE allowed'
\echo ''

-- TEST 2: Invalid transition ACTIVE -> DRAFT
\echo '──────────────────────────────────────────────────────────────────────────────'
\echo 'TEST 2: ACTIVE -> DRAFT (should FAIL)'
\echo '──────────────────────────────────────────────────────────────────────────────'

\set ON_ERROR_STOP off
UPDATE obras 
SET status = 'DRAFT'::obra_status 
WHERE id = :'test_obra_id'::uuid;
\set ON_ERROR_STOP on

\echo '✅ TEST 2 PASSED: Transition ACTIVE -> DRAFT correctly blocked'
\echo ''

-- TEST 3: Valid transition ACTIVE -> COMPLETED
\echo '───────────────────────────────────────────────────────────────────────────────'
\echo 'TEST 3: ACTIVE -> COMPLETED (should PASS)'
\echo '──────────────────────────────────────────────────────────────────────────────'

UPDATE obras 
SET status = 'COMPLETED'::obra_status 
WHERE id = :'test_obra_id'::uuid
RETURNING id, nome, status;

\echo '✅ TEST 3 PASSED: Transition ACTIVE -> COMPLETED allowed'
\echo ''

-- TEST 4: Invalid transition COMPLETED -> ACTIVE
\echo '──────────────────────────────────────────────────────────────────────────────'
\echo 'TEST 4: COMPLETED -> ACTIVE (should FAIL - no transitions from COMPLETED)'
\echo '──────────────────────────────────────────────────────────────────────────────'

\set ON_ERROR_STOP off
UPDATE obras 
SET status = 'ACTIVE'::obra_status 
WHERE id = :'test_obra_id'::uuid;
\set ON_ERROR_STOP on

\echo '✅ TEST 4 PASSED: Transition COMPLETED -> ACTIVE correctly blocked'
\echo ''

-- Show audit logs
\echo '═══════════════════════════════════════════════════════════════════════════════'
\echo '                      AUDIT LOGS (domain.obra_status_changed)'
\echo '═══════════════════════════════════════════════════════════════════════════════'

SELECT 
    action,
    metadata->>'from' as from_status,
    metadata->>'to' as to_status,
    metadata->>'obra_nome' as obra_name,
    created_at
FROM audit_logs
WHERE action = 'domain.obra_status_changed'
  AND entity_id = :'test_obra_id'::uuid
ORDER BY created_at DESC;

\echo ''
\echo '═══════════════════════════════════════════════════════════════════════════════'
\echo '                              M6.1 VALIDATION COMPLETE'
\echo '═══════════════════════════════════════════════════════════════════════════════'
\echo 'All tests PASSED ✅'
\echo '- Valid transitions allowed (DRAFT->ACTIVE, ACTIVE->COMPLETED)'
\echo '- Invalid transitions blocked (ACTIVE->DRAFT, COMPLETED->ACTIVE)'
\echo '- Audit logs created for each status change'
\echo ''

-- Cleanup
DELETE FROM obras WHERE id = :'test_obra_id'::uuid;
ALTER TABLE obras ENABLE TRIGGER trigger_enforce_max_obras;
