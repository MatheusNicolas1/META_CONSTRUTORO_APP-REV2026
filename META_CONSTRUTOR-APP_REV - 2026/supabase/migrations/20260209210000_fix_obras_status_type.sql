-- FIX: Convert obras.status from TEXT to ENUM (obra_status) - FINAL
-- Handles dependencies: triggers, indexes, AND constraints

-- 1. Drop dependencies
DROP TRIGGER IF EXISTS trigger_enforce_obras_status_transition ON obras;
DROP INDEX IF EXISTS idx_obras_status;
ALTER TABLE obras DROP CONSTRAINT IF EXISTS obras_status_check;

-- 2. Drop default
ALTER TABLE obras ALTER COLUMN status DROP DEFAULT;

-- 3. Normalize data
UPDATE obras 
SET status = 'DRAFT' 
WHERE status::text NOT IN ('DRAFT', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELED');

-- 4. Alter column type
ALTER TABLE obras 
    ALTER COLUMN status TYPE obra_status 
    USING status::obra_status;

-- 5. Set default
ALTER TABLE obras 
    ALTER COLUMN status SET DEFAULT 'DRAFT'::obra_status;

-- 6. Recreate index
CREATE INDEX idx_obras_status ON obras(status);

-- 7. Recreate trigger
CREATE TRIGGER trigger_enforce_obras_status_transition
    BEFORE UPDATE OF status ON obras
    FOR EACH ROW
    EXECUTE FUNCTION enforce_obras_status_transition();
