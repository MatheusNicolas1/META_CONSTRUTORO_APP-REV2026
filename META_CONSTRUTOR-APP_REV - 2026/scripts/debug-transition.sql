-- Debug M6.1 Transition Logic
-- Test DRAFT -> ACTIVE transition and debug types

\set QUIET on
\pset border 2
\pset format aligned

\echo ''
\echo '═══════════════════════════════════════════════════════════════════════════════'
\echo '                    DEBUG M6.1 TRANSITION'    
\echo '═══════════════════════════════════════════════════════════════════════════════'

-- Check Enum values
\echo 'Checking obra_status enum values:'
SELECT enum_range(NULL::obra_status);

-- Create test obra (using direct SQL to avoid Node issues)
INSERT INTO obras (org_id, user_id, nome, localizacao, responsavel, cliente, tipo, data_inicio, previsao_termino, status)
SELECT 
    id as org_id, 
    'f6-6230-4417-bfb8-6a85455b8d9f'::uuid as user_id, 
    'DEBUG TRANSITION OBRA' as nome, 
    'Loc' as localizacao, 
    'f6-6230-4417-bfb8-6a85455b8d9f'::uuid as responsavel, 
    'Client' as cliente, 
    'Residencial' as tipo, 
    now() as data_inicio, 
    now() + interval '30 days' as previsao_termino,
    'DRAFT'::obra_status as status
FROM orgs 
LIMIT 1
RETURNING id, status, pg_typeof(status) as status_type;
\gset

\echo ''
\echo 'Created Obra ID:' :id
\echo 'Initial Status:' :status

-- Attempt Update DRAFT -> ACTIVE
\echo ''
\echo 'Attemping UPDATE DRAFT -> ACTIVE...'

UPDATE obras 
SET status = 'ACTIVE'::obra_status
WHERE id = :'id'
RETURNING id, status;

-- If failed, check if previous status is definitely DRAFT
SELECT id, status FROM obras WHERE id = :'id';

-- Cleanup
DELETE FROM obras WHERE id = :'id';
