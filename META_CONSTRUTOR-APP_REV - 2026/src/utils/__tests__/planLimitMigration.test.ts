import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  join(process.cwd(), 'supabase/migrations/20260519173000_enforce_invited_member_plan_limits.sql'),
  'utf8',
);

describe('member invitation plan-limit migration', () => {
  it('counts pending invitations against the user quota', () => {
    expect(migration).toContain("status IN ('active', 'invited')");
  });

  it('runs the trigger for pending invitations as well as active members', () => {
    expect(migration).toContain('BEFORE INSERT OR UPDATE OF status, org_id ON org_members');
    expect(migration).toContain("WHEN (NEW.status IN ('active', 'invited'))");
  });

  it('does not block unlimited business-style plans where max_users is null', () => {
    expect(migration).toContain('IF v_max_users IS NULL THEN');
    expect(migration).toContain('RETURN NEW;');
  });
});
