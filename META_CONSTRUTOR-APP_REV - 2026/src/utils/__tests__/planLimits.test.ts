import { describe, expect, it } from 'vitest';
import { getPlanLimits, PLAN_LIMITS } from '@/utils/planLimits';

describe('plan limits', () => {
  it.each([
    ['free', 1],
    ['basic', 3],
    ['professional', 5],
    ['master', 15],
  ])('limits %s plan to %i users', (plan, maxUsers) => {
    expect(getPlanLimits(plan).maxUsers).toBe(maxUsers);
  });

  it('keeps business users unlimited in frontend logic', () => {
    expect(PLAN_LIMITS.business.unlimitedUsers).toBe(true);
  });

  it('falls back unknown plans to free limits', () => {
    expect(getPlanLimits('unknown-plan')).toEqual(PLAN_LIMITS.free);
  });
});
