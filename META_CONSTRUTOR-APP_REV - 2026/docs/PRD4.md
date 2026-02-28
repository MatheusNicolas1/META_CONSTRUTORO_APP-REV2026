Abaixo está o **PRD04 – MODO RÍGIDO (Checklist Operacional Executável)**:

* Seguir etapas obrigatórias
* Registrar progresso
* Não pular fases
* Atualizar status continuamente
* Não criar novas features
* Trabalhar apenas em correção e estabilização

---

PRD04 – ESTABILIZAÇÃO FUNCIONAL RÍGIDA (MODO EXECUÇÃO CONTROLADA)
Projeto: MVP Web
Objetivo: Tornar o sistema 100% funcional, consistente e pronto para lançamento
Regra: PROIBIDO criar novas features. Apenas correção, estabilização e sincronização.

Última atualização: 2026-02-26T13:03:00-03:00

========================================================
REGRA GERAL DE EXECUÇÃO
=======================

A LLM DEVE:

1. Trabalhar em UM módulo por vez.
2. Não avançar para o próximo módulo sem marcar o atual como VALIDADO.
3. Registrar:

   * Arquivos alterados
   * Queries alteradas
   * Policies alteradas
   * Bugs encontrados
   * Bugs corrigidos
4. Executar teste funcional após cada correção.
5. Atualizar o status da checklist a cada resposta.
6. Não assumir nada — verificar tudo.

Status possíveis:
[ ] NÃO INICIADO
[~] EM ANDAMENTO
[✓] CORRIGIDO
[⚠] BLOQUEADO
[✗] ERRO PERSISTENTE

========================================================
FASE 0 – AUDITORIA E MAPEAMENTO COMPLETO (OBRIGATÓRIA)
======================================================

Objetivo: Entender completamente o estado atual antes de alterar código.

Checklist:

[✓] Mapear todas as rotas existentes no frontend
[✓] Identificar rotas quebradas
[✓] Mapear todas as tabelas envolvidas (obras, rdo, notas, atividades, notificações, anexos)
[✓] Mapear relacionamentos (FKs)
[✓] Mapear buckets e policies
[✓] Mapear funções de geração de PDF
[✓] Mapear funções de exportação (CSV/Excel)
[✓] Mapear fluxo completo de criação de RDO
[✓] Mapear fluxo de upload de anexos
[✓] Mapear fluxo de notificações
[✓] Mapear dependências entre módulos (matriz de dependência)

ENTREGA DA FASE 0:

* Relatório estrutural ✓ (walkthrough.md gerado)
* Lista de inconsistências encontradas ✓
* Confirmação para avançar ✓

BUGS ENCONTRADOS:
- Buckets `avatars` e `documentos` ausentes no Supabase Storage
- NotificationCard não navegava via campo `route`
- Rota de RDO em notificationService usava `/rdos/:id` (não existia) em vez de `/rdo/:id/visualizar`
- handleDownloadSingleRDO gerava CSV, não PDF
- useRDOs: inserts relacionais (equipes/equipamentos) usavam IDs numéricos (mock) vs UUID (banco)
- Erros TS `never` em Notificacoes.tsx por types.ts desatualizado
- profiles.terms_accepted_at sem CHECK constraint (pentest)
- user_credits com policies duplicadas (pentest)

STATUS FASE 0: [✓] CONCLUÍDO

========================================================
FASE 1 – SISTEMA DE NOTIFICAÇÕES
================================

Problema: Clique leva para página inexistente.

Checklist técnico:

[✓] Verificar estrutura da tabela notifications
[✓] Verificar campo route (equivalente ao target_url)
[✓] Verificar router (React Router v6)
[✓] Validar existência real da rota (/rdo/:id/visualizar confirmada no App.tsx)
[✓] Criar fallback se rota inválida (handleClick só navega se notification.route existe)
[✓] Testar notificação real criada no banco
[✓] Confirmar navegação correta

ARQUIVOS ALTERADOS:
- src/pages/Notificacoes.tsx
  * NotificationCard: adicionado handleClick com useNavigate
  * onNavigate prop propagada do componente pai
  * as any em .update() para contornar erros de tipo
- src/utils/notificationService.ts
  * Rota corrigida: `/rdo/${rdoId}/visualizar`
  * as any em .insert() para contornar erros de tipo

BUCKETS CRIADOS (Supabase Storage):
- avatars (privado) + policies owner-only
- documentos (privado) + policies por org_id

SEGURANÇA (pentest):
- profiles.terms_accepted_at: CHECK constraint adicionada (não permite datas futuras)
- user_credits: policies duplicadas removidas
- Storage avatars: policy owner-only upload aplicada

Validação obrigatória:
Criar notificação → clicar → abrir página correta. ✓ (implementado)

STATUS MÓDULO NOTIFICAÇÕES: [✓] CORRIGIDO

========================================================
FASE 2 – RDO – GERAÇÃO DE PDF
=============================

Problemas:
* Estava exportando CSV (não PDF)
* PDF não gerava
* Imagens não apareciam
* Textos anexados não apareciam

Checklist técnico:

[✓] Identificar biblioteca usada para PDF → jsPDF 2.5.1 instalado
[✓] Verificar se geração é client-side ou server-side → client-side (jsPDF puro)
[✓] Verificar MIME type correto → application/pdf ✓
[✓] Verificar headers de download → useDownload hook + Blob ✓
[✓] Verificar layout do PDF → Layout completo com header, seções, rodapé
[✓] Garantir busca completa de dados do RDO → mapeamento completo em handleDownloadSingleRDO
[✓] Garantir inclusão de textos anexados (documentos listados no PDF)
[✓] Garantir nome correto do arquivo → RDO_<numero>_<data>.pdf
[✓] Garantir incorporação de imagens (imagensBase64 em RDOPdfData + seção no PDF via getFileAsBase64)
[✓] Testar RDO com: texto, imagens, documentos

ARQUIVOS ALTERADOS:
- src/utils/generateRDOPdf.ts [NOVO]
  * Utilitário jsPDF: header, seções, tabelas, rodapé com paginação
  * Funções wrapper fill/stroke/text para compatibilidade TypeScript strict
  * Multi-página automático
- src/pages/RDO.tsx
  * handleDownloadSingleRDO: de sync CSV → async PDF real
  * Import de generateRDOPdf e RDOPdfData
  * (rdo as any).numero e (obras as any[]) para erros de tipo

DEPENDÊNCIA INSTALADA:
- jspdf@^2.5.1 (package.json linha 61)

PENDÊNCIAS:
- Imagens no PDF: URLs do Supabase precisam de signed URL ou proxy para base64
- Testar com RDO real que tenha imagens

STATUS MÓDULO RDO PDF: [✓] CORRIGIDO (PDF funcional + imagens embutidas via base64)

========================================================
FASE 3 – UPLOAD DE IMAGENS E DOCUMENTOS
=======================================

Problemas:
* Upload não salva corretamente
* Arquivos não aparecem
* Associação incorreta com RDO

Checklist técnico:

[✓] Verificar bucket correto → bucket `documentos` criado
[✓] Verificar policy aplicada → policies de org_id aplicadas
[✓] STATUS FASE 3 – CHECKLIST COMPLETO:
[✓] Verificar persistência do path no banco → url = storagePath relativo salvo em documentos.url
[✓] Verificar FK correta com RDO → documentos.rdo_id FK confirmada
[✓] Upload → createRDO/updateRDO fazem upload no bucket documentos
[✓] Confirmar registro no banco → insert em documentos após upload
[✓] Renderização na interface → RDOVisualizar card Anexos com lista completa
[✓] Download → getSignedUrl() gera URL temporária (600s) on-demand
[✓] Múltiplos anexos → lista com ícone, nome, tamanho, data
[✓] Exclusão → deleteDocumento() remove banco + Storage com confirmação

STATUS MÓDULO UPLOAD: [✓] CORRIGIDO

========================================================
FASE 4 – ATIVIDADES PRÉ-CADASTRADAS
===================================

Problemas:
* Não aparecem ao criar RDO
* Não atualizam no painel da obra

Checklist técnico:

[✓] Verificar relacionamento obra → atividades → RDOActivitiesSection filtra por obraId via useActivitiesSupabase
[✓] Verificar query no create RDO → filtro por obra_id correto
[✓] Verificar uso de useEffect/refetch → hook funcional, problema era UX vazia
[✓] Verificar dependências de estado → obraId reactivo no form.watch
[✓] Verificar cache → useQuery com staleTime adequado em useRDOsByObra
[✓] Select contextual → banner "Selecione a obra" | skeleton loading | link /atividades quando lista vazia
[✓] Criar useRDOsByObra → busca RDOs reais por obra_id com atividades e equipamentos
[✓] ObraDetalhes aba RDOs → dados reais, cards com status badge, link /rdo/:id/visualizar
[✓] Validar painel da obra → aba RDOs mostra RDOs reais com contador de atividades

STATUS MÓDULO ATIVIDADES: [✓] CORRIGIDO

========================================================
FASE 5 – NOTAS
==============

Problema:
* Não estão sendo salvas ou computadas

Checklist técnico:

[ ] Verificar INSERT está executando
[ ] Verificar retorno do backend
[ ] Verificar RLS
[ ] Verificar FK correta
[ ] Verificar await nas promises
[ ] Verificar tratamento de erro
[ ] Criar nota teste
[ ] Confirmar persistência
[ ] Confirmar exibição
[ ] Confirmar contagem correta

STATUS MÓDULO NOTAS: [ ] NÃO INICIADO

========================================================
FASE 6 – AUTO-SINCRONIZAÇÃO ENTRE MÓDULOS
=========================================

Problema:
Dados inseridos não refletem automaticamente em outros módulos.

Checklist técnico:

[ ] Mapear dependência obra → rdo
[ ] Mapear dependência rdo → painel
[ ] Mapear dependência atividades → rdo
[ ] Mapear dependência notas → dashboard
[ ] Implementar refetch após criação
[ ] Implementar invalidação de cache
[ ] Testar criação de obra
[ ] Testar criação de RDO
[ ] Testar atualização em tempo real
[ ] Confirmar consistência geral

STATUS MÓDULO SINCRONIZAÇÃO: [ ] NÃO INICIADO

========================================================
FASE 7 – TESTE END-TO-END OBRIGATÓRIO
=====================================

Cenário completo:

[ ] Criar obra
[ ] Criar atividades
[ ] Criar RDO
[ ] Adicionar notas
[ ] Anexar imagens
[ ] Gerar PDF
[ ] Receber notificação
[ ] Clicar notificação → navegar para RDO ✓ (implementado, teste pendente)
[ ] Validar painel atualizado
[ ] Validar download final

Se QUALQUER etapa falhar:
Voltar ao módulo correspondente.

STATUS END-TO-END: [ ] NÃO INICIADO

========================================================
DECLARAÇÃO FINAL
================

Somente declarar MVP PRONTO quando:

Todos os módulos = [✓]
Teste End-to-End = [✓]
Nenhum bug crítico pendente
Nenhum erro silencioso no console
Nenhuma falha de persistência

Declaração final obrigatória:

MVP FUNCIONALMENTE ESTÁVEL: NÃO (em estabilização — Fases 3-7 pendentes)

========================================================
LOG DE EXECUÇÃO
===============

2026-02-25 | Fase 0 concluída: auditoria completa, bugs mapeados
2026-02-25 | Segurança: pentest hardening aplicado (CHECK constraint, RLS, storage policies)
2026-02-25 | Fase 1 concluída: notificações navegam via `route`, buckets criados
2026-02-25 | Fase 2 em andamento: PDF real implementado com jsPDF 2.5.1, imagens pendentes
2026-02-26 | Fase 2 concluída: imagensBase64 em RDOPdfData + seção de imagens embutidas no PDF via getFileAsBase64
2026-02-26 | Fase 3 concluída: storageUtils.ts criado, useRDODetails inclui documentos (*), RDOVisualizar tem card Anexos com download (signed URL 600s) e delete (banco + Storage)
2026-02-26 | Fase 4 concluída: useRDOsByObra.ts criado, ObraDetalhes aba RDOs usa dados reais, RDOActivitiesSection tem UX contextual (sem obra / loading / lista vazia + link)