-- Enforce plan user limits for both accepted members and pending invitations.
-- A pending invitation reserves one plan seat, so admins cannot exceed the
-- contracted user quota by creating unlimited invited memberships.

CREATE OR REPLACE FUNCTION enforce_max_users_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_plan_slug TEXT;
    v_max_users INTEGER;
    v_current_count INTEGER;
BEGIN
    SELECT plan_slug, max_users
    INTO v_plan_slug, v_max_users
    FROM get_org_plan_limits(NEW.org_id);

    IF v_plan_slug IS NULL THEN
        RAISE EXCEPTION 'Cannot determine plan limits for org %', NEW.org_id;
    END IF;

    IF v_max_users IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT COUNT(*)
    INTO v_current_count
    FROM org_members
    WHERE org_id = NEW.org_id
      AND status IN ('active', 'invited')
      AND id != NEW.id;

    IF v_current_count >= v_max_users THEN
        RAISE EXCEPTION 'Plan limit reached: maximum % users or pending invitations allowed (plan: %)',
            v_max_users, v_plan_slug;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_enforce_max_users ON org_members;
CREATE TRIGGER trigger_enforce_max_users
    BEFORE INSERT OR UPDATE OF status, org_id ON org_members
    FOR EACH ROW
    WHEN (NEW.status IN ('active', 'invited'))
    EXECUTE FUNCTION enforce_max_users_limit();
