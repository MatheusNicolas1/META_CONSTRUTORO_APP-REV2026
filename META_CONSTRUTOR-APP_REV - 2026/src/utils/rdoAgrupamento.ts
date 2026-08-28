// ============================================================
// Agrupamento de RDOs por dia e nicho
// Baseado em: PRD_AGENDAS_RDO.md + PRD_NICHOS_RDO.md
//
// Encapsula:
//  - Estados canônicos do RDO (DRAFT -> SUBMITTED -> APPROVED -> REJECTED)
//  - Filtro de status para resumos do dia (REGRA 08/09)
//  - Agrupamento puro por dia e por nicho (testável sem Supabase)
// ============================================================

// Estados canônicos do fluxo de aprovação do RDO.
// O "contrato vivo" da tabela `rdos` usa `criado_por_id` (não `user_id`).
export const RDO_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type RDOStatusCanonico = (typeof RDO_STATUS)[keyof typeof RDO_STATUS];

// Apenas RDOs com status SUBMITTED ou APPROVED entram nos resumos do dia
// (DRAFT e REJECTED ficam de fora) — REGRA 08 de PRD_AGENDAS_RDO / R09 de PRD_NICHOS_RDO.
export const RDO_STATUS_RESUMO: readonly RDOStatusCanonico[] = [
  RDO_STATUS.SUBMITTED,
  RDO_STATUS.APPROVED,
];

/** Verifica se um status (string bruta) entra no resumo do dia. */
export const entraNoResumo = (status: string | null | undefined): boolean =>
  (RDO_STATUS_RESUMO as readonly string[]).includes(status ?? '');

/** Filtra RDOs que entram nos resumos (SUBMITTED / APPROVED). */
export function filtrarRDOsParaResumo<T extends { status: string }>(rdos: T[]): T[] {
  return rdos.filter((rdo) => entraNoResumo(rdo.status));
}

// ------------------------------------------------------------
// Tipos mínimos para o agrupamento (não dependem do Supabase)
// ------------------------------------------------------------

export interface RDOAgrupavel {
  id: string;
  data: string;
  nicho_id: string | null;
  status: string;
  [key: string]: unknown;
}

export interface NichoAgrupavel {
  id: string;
  slug: string;
  nome: string;
  cor: string;
  icone: string;
}

export interface GrupoNicho {
  /** null = RDOs sem nicho ("Não Classificado"). */
  nicho: NichoAgrupavel | null;
  rdos: RDOAgrupavel[];
}

export interface DiaAgrupado {
  data: string;
  grupos: GrupoNicho[];
}

/** Slug reservado para RDOs sem nicho (grupo "Não Classificado"). */
export const SLUG_SEM_NICHO = 'sem-nicho';

// ------------------------------------------------------------
// Agrupamento
// ------------------------------------------------------------

/**
 * Agrupa uma lista de RDOs por nicho.
 * RDOs com `nicho_id` nulo (ou nicho não encontrado) vão para o grupo
 * `{ nicho: null }`, representando "Não Classificado".
 */
export function agruparRDOsPorNicho(
  rdos: RDOAgrupavel[],
  nichos: NichoAgrupavel[],
): GrupoNicho[] {
  const nichoPorId = new Map<string, NichoAgrupavel>();
  for (const n of nichos) nichoPorId.set(n.id, n);

  const grupos: GrupoNicho[] = [];
  const grupoPorNichoId = new Map<string | null, GrupoNicho>();

  for (const rdo of rdos) {
    const nicho = rdo.nicho_id ? (nichoPorId.get(rdo.nicho_id) ?? null) : null;
    const chave = nicho?.id ?? null;
    let grupo = grupoPorNichoId.get(chave);
    if (!grupo) {
      grupo = { nicho, rdos: [] };
      grupoPorNichoId.set(chave, grupo);
      grupos.push(grupo);
    }
    grupo.rdos.push(rdo);
  }

  return grupos;
}

/**
 * Agrupa RDOs por dia (descendente) e, dentro de cada dia, por nicho.
 */
export function agruparRDOsPorDiaENicho(
  rdos: RDOAgrupavel[],
  nichos: NichoAgrupavel[],
): DiaAgrupado[] {
  const porDia = new Map<string, RDOAgrupavel[]>();
  for (const rdo of rdos) {
    const lista = porDia.get(rdo.data) ?? [];
    lista.push(rdo);
    porDia.set(rdo.data, lista);
  }

  return Array.from(porDia.entries())
    .map(([data, lista]) => ({ data, grupos: agruparRDOsPorNicho(lista, nichos) }))
    .sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));
}

/**
 * Conta RDOs por nicho_id. A chave `null` representa RDOs sem nicho.
 */
export function contarRDOsPorNicho(rdos: RDOAgrupavel[]): Map<string | null, number> {
  const contagem = new Map<string | null, number>();
  for (const rdo of rdos) {
    const chave = rdo.nicho_id;
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
  }
  return contagem;
}
