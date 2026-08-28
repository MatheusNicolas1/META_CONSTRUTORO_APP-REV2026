import { describe, expect, it } from 'vitest';
import {
  RDO_STATUS,
  RDO_STATUS_RESUMO,
  entraNoResumo,
  filtrarRDOsParaResumo,
  agruparRDOsPorNicho,
  agruparRDOsPorDiaENicho,
  contarRDOsPorNicho,
  SLUG_SEM_NICHO,
} from '@/utils/rdoAgrupamento';
import type { RDOAgrupavel, NichoAgrupavel } from '@/utils/rdoAgrupamento';

const nichos: NichoAgrupavel[] = [
  { id: 'n1', slug: 'execucao-obra', nome: 'Execução de Obra', cor: '#3b82f6', icone: 'HardHat' },
  { id: 'n2', slug: 'seguranca-trabalho', nome: 'Segurança do Trabalho', cor: '#ef4444', icone: 'Shield' },
  { id: 'n3', slug: 'materiais-estoque', nome: 'Materiais e Estoque', cor: '#10b981', icone: 'Package' },
];

const makeRdo = (partial: Partial<RDOAgrupavel> & { id: string }): RDOAgrupavel => ({
  data: '2026-06-10',
  nicho_id: null,
  status: 'DRAFT',
  ...partial,
});

describe('Estados canônicos do RDO', () => {
  it('expõe o fluxo DRAFT -> SUBMITTED -> APPROVED -> REJECTED', () => {
    expect(RDO_STATUS.DRAFT).toBe('DRAFT');
    expect(RDO_STATUS.SUBMITTED).toBe('SUBMITTED');
    expect(RDO_STATUS.APPROVED).toBe('APPROVED');
    expect(RDO_STATUS.REJECTED).toBe('REJECTED');
  });

  it('define resumo do dia como SUBMITTED + APPROVED (REGRA 08/09)', () => {
    expect(RDO_STATUS_RESUMO).toEqual(['SUBMITTED', 'APPROVED']);
  });
});

describe('Filtro de status para resumos', () => {
  it('inclui SUBMITTED e APPROVED', () => {
    expect(entraNoResumo('SUBMITTED')).toBe(true);
    expect(entraNoResumo('APPROVED')).toBe(true);
  });

  it('exclui DRAFT e REJECTED', () => {
    expect(entraNoResumo('DRAFT')).toBe(false);
    expect(entraNoResumo('REJECTED')).toBe(false);
  });

  it('trata status nulo/vazio como fora do resumo', () => {
    expect(entraNoResumo(null)).toBe(false);
    expect(entraNoResumo(undefined)).toBe(false);
    expect(entraNoResumo('')).toBe(false);
  });

  it('filtrarRDOsParaResumo remove DRAFT e REJECTED', () => {
    const rdos = [
      { status: 'DRAFT' },
      { status: 'SUBMITTED' },
      { status: 'APPROVED' },
      { status: 'REJECTED' },
    ];
    expect(filtrarRDOsParaResumo(rdos)).toHaveLength(2);
  });
});

describe('Agrupamento por nicho', () => {
  it('agrupa RDOs pelo nicho e isola sem-nicho', () => {
    const rdos = [
      makeRdo({ id: 'r1', nicho_id: 'n1', status: 'APPROVED' }),
      makeRdo({ id: 'r2', nicho_id: 'n1', status: 'SUBMITTED' }),
      makeRdo({ id: 'r3', nicho_id: 'n2', status: 'APPROVED' }),
      makeRdo({ id: 'r4', nicho_id: null, status: 'APPROVED' }),
    ];

    const grupos = agruparRDOsPorNicho(rdos, nichos);

    const exec = grupos.find((g) => g.nicho?.slug === 'execucao-obra');
    const seg = grupos.find((g) => g.nicho?.slug === 'seguranca-trabalho');
    const sem = grupos.find((g) => g.nicho === null);

    expect(exec?.rdos).toHaveLength(2);
    expect(seg?.rdos).toHaveLength(1);
    expect(sem?.rdos).toHaveLength(1);
    expect(grupos).toHaveLength(3);
  });

  it('agrupa RDOs com nicho_id desconhecido como não classificado', () => {
    const rdos = [makeRdo({ id: 'rX', nicho_id: 'nao-existe', status: 'APPROVED' })];
    const grupos = agruparRDOsPorNicho(rdos, nichos);
    expect(grupos).toHaveLength(1);
    expect(grupos[0].nicho).toBeNull();
  });

  it('não inclui nichos sem RDOs', () => {
    const rdos = [makeRdo({ id: 'r1', nicho_id: 'n1' })];
    const grupos = agruparRDOsPorNicho(rdos, nichos);
    expect(grupos).toHaveLength(1);
    expect(grupos[0].nicho?.id).toBe('n1');
  });
});

describe('Agrupamento por dia e nicho', () => {
  it('separa por data e agrupa nichos dentro de cada dia', () => {
    const rdos = [
      makeRdo({ id: 'r1', data: '2026-06-10', nicho_id: 'n1' }),
      makeRdo({ id: 'r2', data: '2026-06-10', nicho_id: 'n2' }),
      makeRdo({ id: 'r3', data: '2026-06-11', nicho_id: 'n1' }),
    ];

    const dias = agruparRDOsPorDiaENicho(rdos, nichos);
    expect(dias).toHaveLength(2);

    const dia10 = dias.find((d) => d.data === '2026-06-10');
    const dia11 = dias.find((d) => d.data === '2026-06-11');
    expect(dia10?.grupos).toHaveLength(2);
    expect(dia11?.grupos).toHaveLength(1);
  });

  it('ordena dias em ordem decrescente', () => {
    const rdos = [
      makeRdo({ id: 'r1', data: '2026-06-10' }),
      makeRdo({ id: 'r2', data: '2026-06-12' }),
      makeRdo({ id: 'r3', data: '2026-06-11' }),
    ];
    const dias = agruparRDOsPorDiaENicho(rdos, nichos);
    expect(dias.map((d) => d.data)).toEqual(['2026-06-12', '2026-06-11', '2026-06-10']);
  });
});

describe('Contagem por nicho', () => {
  it('conta RDOs por nicho_id, com chave null para sem-nicho', () => {
    const rdos = [
      makeRdo({ id: 'r1', nicho_id: 'n1' }),
      makeRdo({ id: 'r2', nicho_id: 'n1' }),
      makeRdo({ id: 'r3', nicho_id: null }),
    ];
    const contagem = contarRDOsPorNicho(rdos);
    expect(contagem.get('n1')).toBe(2);
    expect(contagem.get(null)).toBe(1);
  });
});

describe('Slug reservado', () => {
  it('mantém slug sem-nicho estável', () => {
    expect(SLUG_SEM_NICHO).toBe('sem-nicho');
  });
});
