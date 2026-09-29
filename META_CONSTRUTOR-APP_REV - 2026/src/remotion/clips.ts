import type { ProductClipProps } from './compositions/ProductClip';

/**
 * Roteiro dos vídeos demonstrativos das páginas públicas.
 * Cada legenda descreve o que aparece no print (conferido em 2026-09-29).
 * Saída: public/videos/<id>.mp4 + pôster .jpg (ver scripts/render-demo-videos.mjs).
 */

const shot = (name: string) => `marketing/prd-prints-2026-06-04-${name}.webp`;

export const demoClips: Record<string, ProductClipProps> = {
  'tour-produto': {
    sceneFrames: 84,
    intro: { title: 'Da obra ao escritório', subtitle: 'RDO, checklists, documentos e relatórios no mesmo sistema' },
    scenes: [
      { image: shot('02-obras-lista-desktop'), caption: 'Todas as obras com andamento e responsável', focus: [0.62, 0.35] },
      { image: shot('05-rdo-lista-desktop'), caption: 'RDO do dia com data, período, obra e clima', focus: [0.66, 0.55] },
      { image: shot('15-rdo-visualizacao-desktop'), caption: 'RDO aprovado, com PDF e envio por e-mail', focus: [0.72, 0.2] },
      { image: shot('16-checklist-detalhe-desktop'), caption: 'Checklist de qualidade com itens e progresso', focus: [0.62, 0.3] },
      { image: shot('07-documentos-lista-desktop'), caption: 'Documentos organizados por obra e tipo', focus: [0.62, 0.4] },
      { image: shot('12-relatorios-resumo-desktop'), caption: 'Relatórios com o andamento de cada obra', focus: [0.5, 0.7] },
    ],
    outro: { title: 'Comece grátis', subtitle: 'metaconstrutor.app.br' },
  },
  'rdo-digital': {
    sceneFrames: 105,
    scenes: [
      { image: shot('05-rdo-lista-desktop'), caption: 'Lista de RDOs com filtros por obra e data', focus: [0.62, 0.3] },
      { image: shot('15-rdo-visualizacao-desktop'), caption: 'RDO aprovado: baixar PDF ou enviar por e-mail', focus: [0.74, 0.18] },
    ],
  },
  'checklist-de-obra': {
    sceneFrames: 105,
    scenes: [
      { image: shot('06-checklist-lista-desktop'), caption: 'Checklists vinculados às obras', focus: [0.62, 0.4] },
      { image: shot('16-checklist-detalhe-desktop'), caption: 'Itens, observações e progresso do checklist', focus: [0.6, 0.55] },
    ],
  },
  'controle-de-obras': {
    sceneFrames: 105,
    scenes: [
      { image: shot('02-obras-lista-desktop'), caption: 'Obras com andamento, responsável e prazos', focus: [0.6, 0.35] },
      { image: shot('04-atividades-lista-desktop'), caption: 'Atividades filtradas por obra, status e responsável', focus: [0.62, 0.35] },
    ],
  },
  'documentos-de-obra': {
    sceneFrames: 105,
    scenes: [
      { image: shot('07-documentos-lista-desktop'), caption: 'Documentos filtrados por obra e tipo', focus: [0.6, 0.25] },
      { image: shot('07-documentos-lista-desktop'), caption: 'Baixar, visualizar ou editar cada arquivo', focus: [0.5, 0.55] },
    ],
  },
  'relatorios-de-obra': {
    sceneFrames: 105,
    scenes: [
      { image: shot('12-relatorios-resumo-desktop'), caption: 'Relatórios filtrados por obra e período', focus: [0.6, 0.3] },
      { image: shot('12-relatorios-resumo-desktop'), caption: 'Progresso físico de cada obra', focus: [0.45, 0.8] },
    ],
  },
};
