-- M6.2: Obra status timestamps
-- Add timestamp columns and trigger to set them on status transition

-- 1. Add columns
ALTER TABLE obras
ADD COLUMN IF NOT EXISTS activated_at timestamptz,
ADD COLUMN IF NOT EXISTS on_hold_at timestamptz,
ADD COLUMN IF NOT EXISTS completed_at timestamptz,
ADD COLUMN IF NOT EXISTS canceled_at timestamptz;

-- 2. Create trigger function
CREATE OR REPLACE FUNCTION set_obras_status_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if status has changed
    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
        RETURN NEW;
    END IF;

    -- Set timestamps based on NEW status
    -- COALESCE ensures we don't overwrite if it was already set (e.g. going back and forth)
    -- Logic: when entering a state, set its timestamp if not set.
    
    CASE NEW.status
        WHEN 'ACTIVE' THEN
            -- If coming from non-active state (DRAFT, ON_HOLD), mark activated_at
            -- We interpret activated_at as "first time activated" usually, but spec says "set automatically on transition"
            -- Using COALESCE preserves the *first* activation time, which is usually desired for "activated_at".
            -- If re-activation is needed (audit of every activation), that's what audit_logs are for.
            -- Fields on the row usually represent the lifecycle milestones.
            NEW.activated_at := COALESCE(OLD.activated_at, now());
            
        WHEN 'ON_HOLD' THEN
            NEW.on_hold_at := COALESCE(OLD.on_hold_at, now());
            
        WHEN 'COMPLETED' THEN
            NEW.completed_at := COALESCE(OLD.completed_at, now());
            
        WHEN 'CANCELED' THEN
            NEW.canceled_at := COALESCE(OLD.canceled_at, now());
            
        ELSE
            -- DRAFT or others: do nothing
            NULL;
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger
-- Name 'trigger_set_obras_status_timestamps' comes alphabetically AFTER 'trigger_enforce_obras_status_transition'
-- This ensures validation runs first. Both are BEFORE UPDATE.
DROP TRIGGER IF EXISTS trigger_set_obras_status_timestamps ON obras;
CREATE TRIGGER trigger_set_obras_status_timestamps
    BEFORE UPDATE OF status ON obras
    FOR EACH ROW
    EXECUTE FUNCTION set_obras_status_timestamps();
