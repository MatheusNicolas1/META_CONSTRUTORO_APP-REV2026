# PRD_INTEGRACAO_VPS_N8N_WHATSAPP — Integração VPS + n8n + WhatsApp API + Site

Data de criação: 2026-07-14
Produto: Meta Construtor Web
Status: **EM EXECUÇÃO** — Etapas 1 a 3 concluídas (Backend Supabase + EFs + Frontend Admin). Etapas 4 e 5 aguardam VPS e chaves WhatsApp.
Objetivo: Implementar envio e recebimento de áudio via WhatsApp Business API, orquestrado por n8n na VPS, com backend Supabase completo e frontend de administração.

---

## 1. VISÃO GERAL

Este PRD consolida todo o fluxo de **áudio inteligente** do Meta Construtor:

1. **Admin/Gerente** cadastra assuntos de resumo, perfis de voz e destinatários no app
2. **Sistema** gera resumo textual a partir de dados reais da organização
3. **ElevenLabs TTS** converte o resumo em áudio (voz masculina/feminina configurável)
4. **n8n na VPS** orquestra agendamento, dispatch e retries
5. **WhatsApp Business API** entrega o áudio como voice note
6. **Usuário** pode responder com áudio, que é transcrito via ElevenLabs STT

O PRD funde os escopos de `PRD_AUDIO_ELEVENLABS.md` (back-end + frontend) com `PRD_AUDIO_WHISPER_N8N.md` (infra VPS) e adiciona o setup completo da VPS.

---

## 2. ARQUITETURA GERAL

```
                    ┌─────────────────────────────┐
                    │     Meta Construtor Web      │
                    │  (Vercel / React + Vite)      │
                    │                               │
                    │  AdminAudioPage               │
                    │  useAudio.ts (React Query)    │
                    └──────┬──────────────────────┘
                           │ HTTPS (autenticado)
                           ▼
               ┌─────────────────────────┐
               │    Supabase (DB + EFs)   │
               │                          │
               │  audio_summary_topics    │
               │  audio_voice_profiles    │
               │  audio_delivery_subs     │
               │  audio_summary_jobs      │
               │  audio_inbound_messages  │
               │  audio_costs             │
               │  bucket audio-files      │
               │                          │
               │  EFs: elevenlabs-tts ✅  │
               │       elevenlabs-webhook ✅│
               │       audio-summary-dispatch │
               │       audio-inbound-transcribe│
               │       whatsapp-webhook    │
               └──────────┬──────────────┘
                          │ Webhook (service role)
                          ▼
               ┌─────────────────────────┐
               │     n8n (VPS Docker)     │
               │                          │
               │  audio-summary-schedule  │
               │  audio-summary-on-demand │
               │  whatsapp-audio-inbound  │
               │  failed-audio-job-retry  │
               └──────────┬──────────────┘
                          │ POST /v18.0/.../messages
                          ▼
               ┌─────────────────────────┐
               │  WhatsApp Business API   │
               │  (Meta Graph API)        │
               │                          │
               │  ← Envio de áudio        │
               │  → Webhook de callback   │
               └─────────────────────────┘
```

---

## 3. REGRAS DE NEGÓCIO

| Regra | Descrição | Status |
|-------|-----------|--------|
| REGRA 01 | TTS usa ElevenLabs v2 (voice_id por perfil: masculino `pNInz6obpgDQG8FMA7zC` / feminino `EXAVITQu4vr4xnSDxMaL`) | ✅ Implementado |
| REGRA 02 | STT usa ElevenLabs Speech-to-Text (recepção de áudio inbound) | 🔧 EF pronta, aguarda webhook real |
| REGRA 03 | Áudio gerado salvo em bucket `audio-files` (privado, RLS por org_id) | ✅ Implementado |
| REGRA 04 | URLs assinadas temporárias (1h) para envio ao WhatsApp | ✅ Implementado |
| REGRA 05 | Idempotência via `idempotency_key` (org_id + UUID) — sem duplicatas no WhatsApp | ✅ Implementado |
| REGRA 06 | Jobs auditáveis: status, attempts, last_error, sent_at, provider_message_id | ✅ Implementado |
| REGRA 07 | Custo de TTS registrado em `audio_costs` (~$0.03/1K chars) | ✅ Implementado |
| REGRA 08 | Consentimento/opt-in do destinatário antes de envio recorrente | 🔧 Frontend pronto, aguarda fluxo real |
| REGRA 09 | Chaves externas apenas em Supabase Secrets / n8n env — nunca no frontend | ✅ Implementado |
| REGRA 10 | Frontend nunca chama ElevenLabs, WhatsApp ou n8n diretamente | ✅ Implementado |
| REGRA 11 | n8n orquestra agendamento e retries via webhooks seguros (HMAC) | 🔧 Aguarda VPS |
| REGRA 12 | WhatsApp Business API via Meta Graph API v18.0+ | 🔧 Aguarda credenciais |
| REGRA 13 | Divulgação de IA na voz exibida ao usuário final | ✅ No PRD, falta implementar badge |
| REGRA 14 | HTTP → HTTPS obrigatório (Caddy ou Nginx) | 🔧 Aguarda VPS |

---

## 4. JÁ IMPLEMENTADO ✅ (Não precisa refazer)

### 4.1 Migrations (Tabelas + RLS + Bucket)

Migration `20260620000000_prd_audio_elevenlabs.sql` — **288 linhas, já aplicada no remoto** ✅

| Tabela | Descrição | RLS |
|--------|-----------|-----|
| `audio_summary_topics` | Assuntos de resumo por organização | org-scoped |
| `audio_voice_profiles` | Perfis de voz (Masculina/Feminina/Personalizada) | org-scoped |
| `audio_delivery_subscriptions` | Inscrições de destinatários por tópico + voz | org-scoped |
| `audio_summary_jobs` | Jobs de geração/envio (status tracking) | org-scoped |
| `audio_inbound_messages` | Mensagens de áudio recebidas + transcrição | org-scoped |
| `audio_costs` | Custo de TTS/STT por operação | org-scoped |
| Bucket `audio-files` (privado) | Armazenamento de áudio MP3 | RLS + service role |

### 4.2 Edge Functions (Deployadas no Supabase)

| EF | Status | Descrição |
|----|--------|-----------|
| `elevenlabs-tts` | ✅ Deployada (82 kB) | Gera áudio via ElevenLabs TTS, salva no Storage, registra jobs + custos |
| `elevenlabs-webhook` | ✅ Deployada (78 kB) | Callbacks de status do ElevenLabs |

### 4.3 Frontend

| Componente | Status | Descrição |
|------------|--------|-----------|
| `AdminAudioPage.tsx` | ✅ 815 linhas | 4 abas: Assuntos, Vozes, Jobs, Custos |
| `useAudio.ts` | ✅ 262 linhas | Hooks React Query (topics, profiles, subscriptions, jobs, costs) |
| Rota `/app/admin/audio` | ✅ Lazy loaded | `PerformanceOptimizedApp.tsx` |
| RBAC `/app/admin/audio` | ✅ | `RBACMatrix.ts` — permissão admin/gerente |

### 4.4 Shared

| Arquivo | Status | Descrição |
|---------|--------|-----------|
| `_shared/elevenlabs.ts` | ✅ | Cliente ElevenLabs TTS + STT (textToSpeech, speechToText, getVoices) |
| `_shared/cors.ts` | ✅ | CORS headers reutilizáveis |
| `_shared/supabase-client.ts` | ✅ | Cliente Supabase scoped |

---

## 5. O QUE FAZER AGORA (Sem depender de VPS)

### 5.1 Edge Functions Pendentes

| EF | Prioridade | Descrição | Dependência |
|----|-----------|-----------|-------------|
| `audio-summary-dispatch` | P1 | Envia áudio via WhatsApp. Usa idempotência. Atualiza status do job. | Nenhuma (pode ser deployada já — vai falhar graciosamente sem credenciais) |
| `audio-inbound-transcribe` | P1 | Baixa áudio recebido, transcreve via ElevenLabs STT, persiste em `audio_inbound_messages` | Nenhuma (lógica completa sem WhatsApp) |
| `whatsapp-webhook` | P1 | Endpoint público com verify token. Recebe status de msg, áudios inbound e erros. | Nenhuma (deployável agora) |
| Evoluir `whatsapp-integration` | P2 | Adicionar suporte a `mediaType: 'audio'` | Nenhuma |
| Evoluir `n8n-integration` | P2 | Webhooks seguros com HMAC, registro de request_id, org_id, latência | Nenhuma |

### 5.2 Frontend Pendente

| Tela | Prioridade | Descrição |
|------|-----------|-----------|
| Preview de áudio (play button) | P1 | Botão de play no job gerado para ouvir antes de enviar |
| Badge "Voz gerada por IA" | P2 | Disclosure obrigatório nas configurações de voz |
| Tela de áudios recebidos/transcrições | P2 | Aba em AdminAudioPage mostrando inbound messages |
| Dashboard de custos TTS/STT | P2 | Gráfico/sumarizado na aba Custos |

### 5.3 Seeds e Dados Iniciais

| Item | Prioridade | Descrição |
|------|-----------|-----------|
| Seed de voice profiles padrão | P1 | Inserir perfis Masculina e Feminina com voice_ids ElevenLabs via migration |
| Trigger de updated_at | ✅ | Já implementado na migration |

---

## 6. O QUE DEPENDE DE VPS 🔴

### 6.1 Setup da VPS (Hostinger — Ubuntu LTS)

| Etapa | Descrição | Script/Solução |
|-------|-----------|----------------|
| 6.1.1 | Acessar VPS via SSH | `ssh root@<IP_VPS>` |
| 6.1.2 | Atualizar sistema | `apt update && apt upgrade -y` |
| 6.1.3 | Instalar Docker + Compose | `apt install docker.io docker-compose-v2 -y` |
| 6.1.4 | Criar diretório de dados | `mkdir -p /opt/n8n/data` |
| 6.1.5 | Subir n8n via Docker | Docker Compose com Postgres + n8n + Caddy |
| 6.1.6 | Configurar TLS | Caddy auto-gera certificado Let's Encrypt |
| 6.1.7 | Firewall | `ufw allow 22,80,443/tcp` |

### 6.2 Docker Compose (n8n + Postgres + Caddy)

```yaml
# /opt/n8n/docker-compose.yml — será criado no setup
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: n8n
      POSTGRES_USER: n8n
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - ./data/postgres:/var/lib/postgresql/data

  n8n:
    image: n8nio/n8n:latest
    ports:
      - "127.0.0.1:5678:5678"
    environment:
      DB_TYPE: postgresdb
      DB_POSTGRESDB_HOST: postgres
      DB_POSTGRESDB_DATABASE: n8n
      DB_POSTGRESDB_USER: n8n
      DB_POSTGRESDB_PASSWORD: ${DB_PASSWORD}
      N8N_HOST: ${N8N_DOMAIN}
      N8N_PROTOCOL: https
      N8N_ENCRYPTION_KEY: ${N8N_ENCRYPTION_KEY}
      WEBHOOK_URL: https://${N8N_DOMAIN}
      # Supabase
      SUPABASE_URL: ${SUPABASE_URL}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      # ElevenLabs
      ELEVENLABS_API_KEY: ${ELEVENLABS_API_KEY}
      # WhatsApp
      WHATSAPP_ACCESS_TOKEN: ${WHATSAPP_ACCESS_TOKEN}
      WHATSAPP_PHONE_NUMBER_ID: ${WHATSAPP_PHONE_NUMBER_ID}
      WHATSAPP_BUSINESS_ACCOUNT_ID: ${WHATSAPP_BUSINESS_ACCOUNT_ID}
      WHATSAPP_WEBHOOK_VERIFY_TOKEN: ${WHATSAPP_WEBHOOK_VERIFY_TOKEN}
    volumes:
      - ./data/n8n:/home/node/.n8n
    depends_on:
      - postgres

  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - ./data/caddy:/data
    depends_on:
      - n8n
```

### 6.3 Caddyfile

```
n8n.metaconstrutor.app.br {
    reverse_proxy n8n:5678
}
```

### 6.4 Workflows n8n

| Workflow | Trigger | Ação |
|----------|---------|------|
| `audio-summary-schedule` | Cron (diário/horário) | Consulta `audio_summary_topics` ativos, gera resumo, chama `elevenlabs-tts` → dispatch |
| `audio-summary-on-demand` | Webhook do app | Disparo manual de resumo para destinatário específico |
| `whatsapp-audio-inbound` | Webhook WhatsApp | Recebe áudio, chama `audio-inbound-transcribe` |
| `failed-audio-job-retry` | Cron (15min) | Retry com backoff para jobs `failed` ou `pending` vencidos |

### 6.5 Credenciais necessárias

| Variável | De onde? | Status |
|----------|----------|--------|
| `ELEVENLABS_API_KEY` | `sk_175...ae31` — já fornecida | ✅ Temos |
| `SUPABASE_URL` | Projeto Supabase | ✅ Temos |
| `SUPABASE_SERVICE_ROLE_KEY` | Projeto Supabase | ✅ Temos |
| `N8N_DOMAIN` | `n8n.metaconstrutor.app.br` (sugerido) | 🔧 Definir |
| `DB_PASSWORD` | Gerar na hora | 🔧 |
| `N8N_ENCRYPTION_KEY` | Gerar na hora | 🔧 |
| `WHATSAPP_ACCESS_TOKEN` | Meta Business Suite / WhatsApp Cloud API | 🔧 Aguardar |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta Business Suite | 🔧 Aguardar |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Meta Business Suite | 🔧 Aguardar |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Definir + configurar no Meta | 🔧 Aguardar |

---

## 7. PLANO DE EXECUÇÃO (Ordem)

### Fase 1 — Backend Supabase (Pode fazer AGORA) ✅ JÁ CONCLUÍDO

| Item | Status |
|------|--------|
| Migration das tabelas `audio_*` | ✅ Feito + aplicado |
| RLS policies por org_id | ✅ Feito |
| Bucket `audio-files` privado | ✅ Feito |
| EF `elevenlabs-tts` | ✅ Deployada |
| EF `elevenlabs-webhook` | ✅ Deployada |
| Atualizar `PRD_MESTRE.md` | ✅ Feito |

### Fase 2 — Frontend Admin ✅ JÁ CONCLUÍDO

| Item | Status |
|------|--------|
| Hook `useAudio.ts` (topics, profiles, subscriptions, jobs, costs) | ✅ 262 linhas |
| `AdminAudioPage.tsx` (4 abas) | ✅ 815 linhas |
| Rota `/app/admin/audio` (lazy) | ✅ RBAC configurado |
| Build 120 rotas, 0 erros | ✅ |

### Fase 3 — EFs Restantes (Fazer AGORA)

| Item | Prioridade | Status |
|------|-----------|--------|
| EF `audio-summary-dispatch` | P1 | 📝 Criar |
| EF `audio-inbound-transcribe` | P1 | 📝 Criar |
| EF `whatsapp-webhook` | P1 | 📝 Criar |
| Evoluir `whatsapp-integration` | P2 | 📝 Criar |
| Evoluir `n8n-integration` | P2 | 📝 Criar |

### Fase 4 — Setup VPS + n8n (Aguarda VPS)

| Item | Prioridade | Status |
|------|-----------|--------|
| Contratar VPS Hostinger | Bloqueante | 🔴 |
| SSH + Docker + Compose | Bloqueante | 🔴 |
| n8n + Postgres + Caddy | Bloqueante | 🔴 |
| Configurar domínio DNS | Bloqueante | 🔴 |
| Workflows n8n | Bloqueante | 🔴 |

### Fase 5 — WhatsApp (Aguarda credenciais)

| Item | Prioridade | Status |
|------|-----------|--------|
| Criar conta WhatsApp Business API | Bloqueante | 🔴 |
| Obter access token + phone ID | Bloqueante | 🔴 |
| Configurar webhook no Meta | Bloqueante | 🔴 |
| Template de mensagem (se necessário) | Bloqueante | 🔴 |

### Fase 6 — Deploy Final e Testes

| Item | Status |
|------|--------|
| Teste real de envio de áudio para número controlado | 🔴 |
| Teste real de recebimento/transcrição via WhatsApp | 🔴 |
| Validar logs em `audio_summary_jobs`, `audio_inbound_messages`, `audio_costs` | 🔴 |
| Validar ausência de chaves no bundle/frontend | ✅ |
| Deploy Supabase Functions (EFs da Fase 3) | 📝 |
| Deploy Vercel (alterações frontend) | 📝 |

---

## 8. ARQUIVOS CRIADOS/MODIFICADOS

### Migrations

| Arquivo | Linhas | Descrição |
|---------|--------|-----------|
| `supabase/migrations/20260620000000_prd_audio_elevenlabs.sql` | 288 | Tabelas `audio_*`, RLS, bucket, triggers ✅ |

### Edge Functions

| Arquivo | Linhas | Descrição | Status |
|---------|--------|-----------|--------|
| `supabase/functions/elevenlabs-tts/index.ts` | 176 | Geração de áudio via ElevenLabs TTS | ✅ Deployada |
| `supabase/functions/elevenlabs-webhook/index.ts` | 58 | Callbacks de status ElevenLabs | ✅ Deployada |
| `supabase/functions/_shared/elevenlabs.ts` | — | Cliente ElevenLabs reutilizável | ✅ Pronta |
| `supabase/functions/audio-summary-dispatch/index.ts` | — | Disparo WhatsApp com idempotência | 📝 Criar |
| `supabase/functions/audio-inbound-transcribe/index.ts` | — | Transcrição de áudio inbound | 📝 Criar |
| `supabase/functions/whatsapp-webhook/index.ts` | — | Endpoint público WhatsApp webhook | 📝 Criar |
| `supabase/functions/whatsapp-integration/index.ts` | 265 | Integração WhatsApp existente | 🔧 Evoluir |
| `supabase/functions/n8n-integration/index.ts` | 132 | Integração n8n existente | 🔧 Evoluir |

### Frontend

| Arquivo | Linhas | Descrição | Status |
|---------|--------|-----------|--------|
| `src/pages/AdminAudioPage.tsx` | 815 | Admin de áudio (4 abas) | ✅ Deployada |
| `src/hooks/useAudio.ts` | 262 | React Query hooks | ✅ Pronta |
| `src/components/PerformanceOptimizedApp.tsx` | — | Rota lazy `/app/admin/audio` | ✅ |
| `src/security/RBACMatrix.ts` | — | Permissão admin/gerente | ✅ |

### Infraestrutura (VPS)

| Arquivo | Descrição | Status |
|---------|-----------|--------|
| `/opt/n8n/docker-compose.yml` | n8n + Postgres + Caddy | 📝 Criar na VPS |
| `/opt/n8n/Caddyfile` | Reverse proxy TLS | 📝 Criar na VPS |
| `/opt/n8n/.env` | Credenciais e secrets | 📝 Criar na VPS |

---

## 9. SCRIPT DE SETUP DA VPS

Script único para rodar na VPS Hostinger quando estiver disponível:

```bash
#!/bin/bash
# setup-n8n-vps.sh — Setup completo n8n na VPS
# Uso: ssh root@<IP> 'bash -s' < setup-n8n-vps.sh
set -e

# 1. Variáveis (preencher antes de rodar)
N8N_DOMAIN="${N8N_DOMAIN:-n8n.metaconstrutor.app.br}"
SUPABASE_URL="${SUPABASE_URL:-https://bgdvlhttyjeuprrfxgun.supabase.co}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"
ELEVENLABS_API_KEY="${ELEVENLABS_API_KEY:-sk_1758b06ae31}"

# 2. Atualizar sistema
apt update && apt upgrade -y

# 3. Instalar Docker
apt install docker.io docker-compose-v2 -y
systemctl enable docker
systemctl start docker

# 4. Criar diretórios
mkdir -p /opt/n8n/data/{postgres,n8n,caddy}

# 5. Gerar senhas
DB_PASSWORD=$(openssl rand -base64 32)
N8N_ENCRYPTION_KEY=$(openssl rand -base64 32)

# 6. Criar .env
cat > /opt/n8n/.env << EOF
N8N_DOMAIN=${N8N_DOMAIN}
DB_PASSWORD=${DB_PASSWORD}
N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY}
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
EOF

# 7. Criar docker-compose.yml (já incluso no PRD)

# 8. Criar Caddyfile
cat > /opt/n8n/Caddyfile << EOF
${N8N_DOMAIN} {
    reverse_proxy n8n:5678
}
EOF

# 9. Subir stack
cd /opt/n8n
docker compose up -d

# 10. Firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "✅ n8n rodando em https://${N8N_DOMAIN}"
echo "⚠️  Configure o DNS: A record ${N8N_DOMAIN} -> $(curl -s ifconfig.me)"
echo "⚠️  Configure WHATSAPP_* variaveis depois no /opt/n8n/.env"
```

---

## 10. VALIDAÇÃO FINAL

| # | Teste | Resultado |
|---|-------|-----------|
| 01 | Migration aplicada no Supabase remoto | ✅ Confirmado via `supabase migration list` |
| 02 | EF `elevenlabs-tts` deployada e ativa | ✅ v82 kB no remoto |
| 03 | EF `elevenlabs-webhook` deployada e ativa | ✅ v78 kB no remoto |
| 04 | Bucket `audio-files` criado (privado) | ✅ Migration confirmada |
| 05 | AdminAudioPage carrega com 4 abas | ✅ Build 120 rotas |
| 06 | `npm run build` sem erros | ✅ 120 rotas, 0 erros |
| 07 | `npm run test` — 75/75 testes | ✅ |
| 08 | Site ao vivo HTTP 200 | ✅ |
| 09 | Chaves API não vazam no bundle | ✅ Service role apenas |
| 10 | n8n rodando na VPS | 🔴 Aguardando VPS |
| 11 | WhatsApp webhook configurado | 🔴 Aguardando credenciais |
| 12 | Envio real de áudio WhatsApp | 🔴 Aguardando Fase 4+5 |

---

## 11. PENDÊNCIAS

### Pendências (Agente resolve — C1)
- [ ] Criar EF `audio-summary-dispatch/index.ts`
- [ ] Criar EF `audio-inbound-transcribe/index.ts`
- [ ] Criar EF `whatsapp-webhook/index.ts`
- [ ] Evoluir `whatsapp-integration` para suportar `mediaType: 'audio'`
- [ ] Evoluir `n8n-integration` com webhook HMAC + audit
- [ ] Seed de voice profiles padrão (Masculina + Feminina)
- [ ] Preview de áudio no frontend
- [ ] Badge "Voz gerada por IA"
- [ ] Deploy das novas EFs no Supabase

### Pendências (Usuário decide/faz — C2)
- [ ] Contratar VPS Hostinger
- [ ] Configurar DNS: `n8n.metaconstrutor.app.br` → IP da VPS
- [ ] Criar conta WhatsApp Business API (Meta Business Suite)
- [ ] Obter `WHATSAPP_ACCESS_TOKEN`
- [ ] Obter `WHATSAPP_PHONE_NUMBER_ID`
- [ ] Obter `WHATSAPP_BUSINESS_ACCOUNT_ID`
- [ ] Definir `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- [ ] Rodar script de setup na VPS (ou dar acesso SSH para o agente executar)

---

## 12. REFERÊNCIAS

- `PRD_AUDIO_ELEVENLABS.md` — Especificação técnica detalhada de TTS/STT + voice profiles
- `PRD_AUDIO_WHISPER_N8N.md` — Histórico de planejamento n8n/WhatsApp
- `PRD_MESTRE.md` — Fonte mestre operacional (seção 3.8 — Áudio)
- `supabase/functions/elevenlabs-tts/index.ts` — EF de TTS (176 linhas, deployada)
- `supabase/functions/elevenlabs-webhook/index.ts` — EF de webhook (58 linhas, deployada)
- `supabase/functions/_shared/elevenlabs.ts` — Cliente ElevenLabs compartilhado
- `src/pages/AdminAudioPage.tsx` — Admin de áudio (815 linhas)
- `src/hooks/useAudio.ts` — Hooks React Query (262 linhas)

---

## 13. PRÓXIMA MANUTENÇÃO DESTE PRD

Atualizar quando:
- VPS for contratada e configurada
- Credenciais WhatsApp forem obtidas
- EFs da Fase 3 forem criadas e deployadas
- Workflows n8n forem criados
- Teste real de ponta a ponta for executado
