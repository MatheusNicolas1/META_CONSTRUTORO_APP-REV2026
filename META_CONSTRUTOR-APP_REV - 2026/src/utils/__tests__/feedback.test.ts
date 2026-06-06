import { describe, expect, it } from 'vitest';
import { buildFeedbackRequestBody } from '@/utils/feedback';

describe('feedback payload', () => {
  it('converts the satisfaction rating before invoking the Edge Function', () => {
    expect(buildFeedbackRequestBody({
      title: 'Ajuste no fluxo',
      type: 'sugestao',
      rating: '5',
      message: 'Melhorar o acompanhamento de RDOs.',
    })).toEqual({
      title: 'Ajuste no fluxo',
      type: 'sugestao',
      rating: 5,
      message: 'Melhorar o acompanhamento de RDOs.',
    });
  });

  it('omits rating when the user leaves it empty', () => {
    expect(buildFeedbackRequestBody({
      title: '',
      type: 'problema',
      rating: '',
      message: 'Nao consegui exportar o relatorio.',
    })).toEqual({
      title: '',
      type: 'problema',
      rating: undefined,
      message: 'Nao consegui exportar o relatorio.',
    });
  });
});
