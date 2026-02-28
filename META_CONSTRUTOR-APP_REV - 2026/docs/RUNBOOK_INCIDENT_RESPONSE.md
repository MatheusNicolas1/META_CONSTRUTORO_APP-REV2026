# 🚨 Runbook de Resposta a Incidentes — Meta Construtor

> **Classificação:** INTERNO / CONFIDENCIAL  
> **Versão:** 1.0  
> **Última atualização:** Fevereiro de 2026  
> **Responsável:** DPO — dpo@metaconstrutor.com

---

## 1. Definição de Incidente de Segurança

Qualquer evento que:
- Comprometa a **confidencialidade, integridade ou disponibilidade** de dados pessoais
- Resulte em **acesso não autorizado** a sistemas ou dados
- Cause **perda, destruição ou alteração** indevida de dados pessoais
- Represente **violação de políticas** de segurança da informação

### Exemplos de Incidentes
| Severidade | Exemplo |
|------------|---------|
| **Crítica** | Vazamento de dados pessoais, acesso não autorizado ao banco de dados, ransomware |
| **Alta** | Comprometimento de credenciais de admin, falha de RLS, exposição de API keys |
| **Média** | Tentativa de brute-force detectada, phishing direcionado a colaboradores |
| **Baixa** | Scan de vulnerabilidade externo, login suspeito bloqueado automaticamente |

---

## 2. Equipe de Resposta a Incidentes

| Papel | Responsável | Contato |
|-------|------------|---------|
| **DPO (Encarregado)** | João da Silva | dpo@metaconstrutor.com |
| **CTO / Líder Técnico** | [Nome] | [email] |
| **DevOps / Infra** | [Nome] | [email] |
| **Jurídico** | [Nome] | [email] |

> ⚠️ **Preencher os campos acima com os responsáveis reais antes de publicar.**

---

## 3. Procedimento de Resposta (5 Fases)

### Fase 1: Detecção e Triagem (0–2h)

1. **Identificar o incidente** via:
   - Logs do Supabase (`Dashboard > Logs > API / Auth / Postgres`)
   - Alertas de monitoramento (Edge Functions, Auth, Postgres)
   - Relatórios de usuários ou equipe interna

2. **Registrar no formato:**
   ```
   Data/Hora: [ISO 8601]
   Tipo: [Vazamento / Acesso não autorizado / Indisponibilidade / Outro]
   Severidade: [Crítica / Alta / Média / Baixa]
   Dados afetados: [Tipo de dados, quantidade estimada de titulares]
   Sistemas afetados: [API / Auth / Database / Edge Functions / Frontend]
   Descoberto por: [Monitoramento / Usuário / Equipe interna]
   ```

3. **Classificar severidade** usando a tabela da Seção 1

4. **Notificar imediatamente:**
   - Severidade **Crítica/Alta** → DPO + CTO (telefone + email)
   - Severidade **Média** → DPO (email)
   - Severidade **Baixa** → Registro em log para revisão semanal

### Fase 2: Contenção (2–6h)

1. **Contenção imediata:**
   - Revogar tokens/sessões comprometidos via Supabase Auth
   - Bloquear IPs suspeitos no edge (Vercel/Supabase)
   - Desativar Edge Functions comprometidas
   - Rotacionar chaves (`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`) se necessário

2. **Preservar evidências:**
   - Exportar logs relevantes ANTES de qualquer ação corretiva
   - Screenshot de dashboards e alertas
   - Não deletar dados do incidente

3. **Comunicação interna:**
   - Canal dedicado (Telegram/Slack) para a equipe de resposta
   - Atualizar status a cada 2h

### Fase 3: Erradicação (6–24h)

1. **Identificar causa raiz:**
   - Análise de logs (`admin_audit_logs`, `user_activity`, `user_interactions`)
   - Revisão de alterações recentes (deploys, migrations)
   - Verificar RLS policies: `SELECT * FROM pg_policies;`

2. **Corrigir vulnerabilidade:**
   - Aplicar patch/hotfix
   - Atualizar dependências comprometidas
   - Fortalecer RLS/CORS se necessário

3. **Validar correção:**
   - Testar em ambiente de desenvolvimento (branch)
   - Confirmar que o vetor de ataque não é mais explorável

### Fase 4: Notificação (até 72h do conhecimento)

#### Notificação à ANPD (obrigatória se risco relevante)
- **Prazo:** Até 72 horas úteis após a ciência do incidente
- **Canal:** [Sistema Peticionamento Eletrônico da ANPD](https://www.gov.br/anpd/)
- **Conteúdo obrigatório:**
  - Natureza dos dados pessoais afetados
  - Número de titulares afetados (estimativa)
  - Medidas técnicas e de segurança adotadas
  - Riscos envolvidos
  - Medidas tomadas para reverter ou mitigar

#### Notificação aos Titulares (se risco relevante)
- **Quando:** Imediatamente após notificação à ANPD
- **Canal:** Email pessoal + notificação in-app
- **Conteúdo:**
  - Descrição do incidente (sem detalhes técnicos sensíveis)
  - Tipos de dados afetados
  - Medidas recomendadas (ex: trocar senha)
  - Contato do DPO

### Fase 5: Pós-Incidente (7–30 dias)

1. **Relatório completo:**
   - Timeline detalhada
   - Causa raiz confirmada
   - Dados afetados (tipos + volume)
   - Medidas tomadas
   - Lições aprendidas

2. **Ações preventivas:**
   - Atualizar este runbook se necessário
   - Implementar controles adicionais
   - Treinamento da equipe

3. **Arquivar:**
   - Relatório no repositório interno
   - Registro na tabela `admin_audit_logs` com action `incident_resolved`

---

## 4. Logs e Ferramentas de Investigação

### Supabase Dashboard
| Serviço | O que verificar |
|---------|----------------|
| **API Logs** | Requests suspeitos, 4xx/5xx anômalos |
| **Auth Logs** | Logins falhos, criação de contas em massa |
| **Postgres Logs** | Queries anômalas, uso elevado |
| **Edge Function Logs** | Erros inesperados, timeouts |

### Tabelas de Auditoria
```sql
-- Últimas ações administrativas
SELECT * FROM admin_audit_logs 
ORDER BY created_at DESC LIMIT 100;

-- Atividade recente de usuários
SELECT * FROM user_activity 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Interações suspeitas
SELECT * FROM user_interactions 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Verificação de RLS
```sql
-- Listar todas as policies ativas
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

---

## 5. Checklist Rápido para Incidentes Críticos

- [ ] Incidente registrado (data, tipo, severidade)
- [ ] DPO notificado (telefone + email)
- [ ] CTO notificado
- [ ] Tokens/sessões comprometidos revogados
- [ ] Logs exportados e preservados
- [ ] Causa raiz identificada
- [ ] Patch aplicado e validado
- [ ] ANPD notificada (se aplicável, até 72h)
- [ ] Titulares notificados (se aplicável)
- [ ] Relatório pós-incidente elaborado
- [ ] Ações preventivas implementadas
- [ ] Runbook atualizado (se necessário)

---

## 6. Contatos de Emergência

| Serviço | Contato |
|---------|---------|
| **Supabase Support** | https://supabase.com/dashboard/support |
| **Vercel Support** | https://vercel.com/support |
| **ANPD** | https://www.gov.br/anpd/ |
| **CERT.br** | https://www.cert.br/ |

---

> **Nota:** Este documento deve ser revisado trimestralmente e atualizado após cada incidente.
