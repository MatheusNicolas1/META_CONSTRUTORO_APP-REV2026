import { describe, expect, it } from 'vitest';
import {
  buildReportPdfRequestBody,
  fallbackFilename,
  getFilenameFromDisposition,
  type ReportPdfPayload,
} from '@/hooks/useReportPdfDownload';

const payload: ReportPdfPayload = {
  reportType: 'RDO Diário',
  title: 'Relatorio de RDO',
  sections: [
    {
      title: 'Resumo',
      rows: [{ status: 'APPROVED' }],
    },
  ],
};

describe('report PDF export helpers', () => {
  it('uses the filename returned by the Edge Function when available', () => {
    expect(getFilenameFromDisposition(
      'attachment; filename="RELATORIO_RDO_2026-05-22.PDF"',
      'fallback.pdf'
    )).toBe('RELATORIO_RDO_2026-05-22.PDF');
  });

  it('builds an accent-free fallback filename with a stable date', () => {
    expect(fallbackFilename('RDO Diário', new Date('2026-05-22T10:00:00.000Z')))
      .toBe('RELATORIO_RDO_DIARIO_2026-05-22.PDF');
  });

  it('adds a generatedAt timestamp when the caller does not provide one', () => {
    expect(buildReportPdfRequestBody(payload, '2026-05-22T12:00:00.000Z')).toEqual({
      reportType: 'RDO Diário',
      report: {
        ...payload,
        generatedAt: '2026-05-22T12:00:00.000Z',
      },
    });
  });

  it('preserves an explicit generatedAt timestamp from the report payload', () => {
    const explicitPayload = {
      ...payload,
      generatedAt: '2026-05-21T09:30:00.000Z',
    };

    expect(buildReportPdfRequestBody(explicitPayload, '2026-05-22T12:00:00.000Z').report.generatedAt)
      .toBe('2026-05-21T09:30:00.000Z');
  });
});
