import { describe, expect, it } from 'vitest';
import { formatStatusLabel, getStatusBadgeColor } from '@/utils/formatters';

describe('RDO status formatting', () => {
  it('renders canonical approval statuses with user-facing labels', () => {
    expect(formatStatusLabel('DRAFT')).toBe('Rascunho/Iniciando');
    expect(formatStatusLabel('SUBMITTED')).toBe('Aguardando aprovação');
    expect(formatStatusLabel('APPROVED')).toBe('Aprovado');
    expect(formatStatusLabel('REJECTED')).toBe('Rejeitado');
  });

  it('keeps distinct badge colors for approval workflow states', () => {
    expect(getStatusBadgeColor('DRAFT')).toContain('bg-construction-blue');
    expect(getStatusBadgeColor('SUBMITTED')).toContain('bg-construction-orange');
    expect(getStatusBadgeColor('APPROVED')).toContain('bg-construction-green');
    expect(getStatusBadgeColor('REJECTED')).toContain('bg-red-500');
  });
});
