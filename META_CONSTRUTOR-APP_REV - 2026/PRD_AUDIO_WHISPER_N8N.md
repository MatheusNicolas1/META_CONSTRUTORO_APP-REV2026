# PRD_AUDIO_WHISPER_N8N - Mensagens de audio com resumos configuraveis

Produto: Meta Construtor Web  
Data de criacao: 2026-05-31  
Status: planejamento operacional, aguardando VPS/n8n e chaves externas  
Responsavel operacional: Codex  
Fonte mestre consultada: `PRD_MESTRE.md`  

## 1. Objetivo

Implementar envio e recebimento de mensagens de audio para usuarios do Meta Construtor, com resumos pre-configurados sobre assuntos cadastrados no aplicativo e selecao de perfil de voz pelo usuario, inicialmente como `Masculina` ou `Feminina`.

O fluxo deve permitir:

- Administrador/Gerente configurar assuntos, recorrencia, publico e canal de entrega.
- Sistema gerar resumo a partir de dados reais da organizacao, sem dados ficticios.
- Sistema converter o resumo em audio com voz selecionada.
- Sistema enviar audio por WhatsApp Business API, orquestrado por Supabase Edge Functions e n8n.
- Usuario enviar audio de volta, quando habilitado, para transcricao e resposta operacional.
- Logs, auditoria, idempotencia e falhas visiveis no app.

## 2. Decisao tecnica inicial

O repositorio `openai/whisper` foi clonado como referencia local em:

`C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\openai-whisper`

Commit clonado:

`04f449b8a437f1bbd3dba5c9f826aca972e7709a`

Decisao importante:

- Whisper e um recurso de speech-to-text, ou seja, transcricao de audio recebido.
- Whisper nao gera voz. Para usuario receber resumo falado, a implementacao precisa de text-to-speech.
- A trilha principal de producao deve usar OpenAI Audio API para TTS e, se necessario, STT.
- A copia local do Whisper fica como referencia tecnica e como opcao futura de transcricao self-hosted na VPS, caso haja exigencia de custo, privacidade ou funcionamento offline.
- Supabase Edge Functions nao devem rodar Whisper open source diretamente, porque exigem Python/ffmpeg/modelos pesados e possivelmente GPU/CPU dedicada. Se self-hosting for escolhido, isso deve rodar na VPS como servico separado, chamado pelo n8n ou por Edge Function.

## 3. Referencias tecnicas verificadas

OpenAI:

- Speech-to-text: `https://platform.openai.com/docs/guides/speech-to-text`
- Text-to-speech: `https://platform.openai.com/docs/guides/text-to-speech`
- Audio API reference: `https://platform.openai.com/docs/api-reference/audio/create-speech`
- Whisper open source: `https://github.com/openai/whisper`

Pontos relevantes da documentacao OpenAI em 2026-05-31:

- STT usa endpoint de transcricoes; `whisper-1`, `gpt-4o-transcribe`, `gpt-4o-mini-transcribe` e variante com diarizacao aparecem como opcoes documentadas.
- Uploads de audio para STT tem limite documentado de 25 MB e suportam formatos como `mp3`, `mp4`, `mpeg`, `mpga`, `m4a`, `wav` e `webm`.
- TTS usa endpoint `audio/speech`.
- Modelos de TTS documentados incluem `gpt-4o-mini-tts`, `tts-1` e `tts-1-hd`.
- O texto de entrada de TTS tem limite documentado de 4096 caracteres.
- Vozes built-in documentadas incluem `alloy`, `ash`, `ballad`, `coral`, `echo`, `fable`, `onyx`, `nova`, `sage`, `shimmer`, `verse`, `marin` e `cedar`.
- A documentacao exige divulgacao clara ao usuario de que a voz ouvida e gerada por IA, nao uma voz humana.

Observacao de produto:

- `Masculina` e `Feminina` devem ser labels de experiencia, mapeadas para vozes aprovadas apos teste auditivo. Nao assumir que a API rotula vozes por genero.

## 4. Baseline atual do app

Arquivos e contratos ja existentes:

- `supabase/config.toml`: ja possui `n8n-integration` e `whatsapp-integration` com `verify_jwt = true`.
- `supabase/functions/n8n-integration/index.ts`: ja testa conexao n8n e dispara webhook autenticado.
- `supabase/functions/whatsapp-integration/index.ts`: ja testa WhatsApp e envia texto/template; ainda nao cobre envio real de audio.
- `src/hooks/useIntegrations.ts`: ja carrega/salva integracoes por `org_id`, registra logs em `analytics_events` e bloqueia webhooks customizados sem backend real.
- `src/types/integration.ts`: `WhatsAppMessage` ainda so aceita `text`, `template`, `image` e `document`; precisa incluir `audio`.
- `public.integrations`: existe com `org_id`, `service`, `credentials`, `status`, `last_sync`.
- `public.analytics_events`: fonte canonica para logs/metricas administrativas.
- `public.notifications`: existe, mas hoje guarda notificacao in-app simples; audio externo precisa de tabelas especificas.

Riscos observados:

- Configuracoes atuais podem persistir chaves em `integrations.credentials`. Para esta feature, segredos sensiveis nao devem ser salvos em texto claro acessivel ao frontend.
- `whatsapp-integration` usa Graph API v18.0 no codigo atual; a versao deve ser revisada na implementacao.
- Webhooks customizados foram propositalmente bloqueados em runs anteriores para evitar sucesso falso. Esta feature so pode desbloquear disparo quando houver backend real, logs e teste de ponta a ponta.

## 5. Escopo funcional

### 5.1 Assuntos cadastrados

- [ ] Criar cadastro de assuntos de resumo por organizacao.
- [ ] Cada assunto deve definir nome, descricao, origem de dados, filtros, prompt base, frequencia e publico.
- [ ] Origens iniciais permitidas:
  - obras;
  - RDOs;
  - atividades;
  - checklists;
  - despesas;
  - documentos;
  - alertas operacionais;
  - resumo diario/semanal da organizacao.
- [ ] Cada assunto deve ter estado ativo/inativo.
- [ ] Nao permitir assunto ativo sem fonte real de dados.

### 5.2 Preferencias de voz

- [ ] Criar perfis de voz por organizacao.
- [ ] Oferecer ao usuario final labels simples: `Masculina`, `Feminina` e, futuramente, `Personalizada`.
- [ ] Mapear cada label para `provider_voice_id`, instrucoes de estilo e velocidade.
- [ ] Permitir preview de texto e audio antes de ativar.
- [ ] Registrar explicitamente que a voz e gerada por IA.

### 5.3 Envio de audio

- [ ] Gerar resumo textual a partir de dados reais e autorizados por `org_id`.
- [ ] Transformar resumo textual em arquivo de audio.
- [ ] Salvar audio em bucket privado do Supabase Storage ou enviar por media upload do WhatsApp, conforme decisao tecnica validada.
- [ ] Enviar audio via WhatsApp Business API.
- [ ] Registrar status: `pending`, `generated`, `uploaded`, `sent`, `delivered`, `played`, `failed` quando o provedor disponibilizar.
- [ ] Nao exibir sucesso no app sem confirmacao objetiva do provedor ou registro de job.

### 5.4 Recebimento de audio

- [ ] Receber webhook do WhatsApp com mensagem de audio.
- [ ] Validar assinatura/verificacao do webhook.
- [ ] Baixar a midia recebida com credencial server-side.
- [ ] Armazenar audio original de forma privada e vinculada a `org_id`, `user_id` ou contato.
- [ ] Transcrever audio com OpenAI STT ou servico Whisper self-hosted.
- [ ] Exibir transcricao no app e registrar evento.
- [ ] Permitir resposta automatica apenas para intents aprovadas e com limite de seguranca.

### 5.5 n8n na VPS

- [ ] Usar n8n para agendamento, orquestracao e retries de workflows.
- [ ] Criar workflow `audio-summary-schedule`.
- [ ] Criar workflow `audio-summary-on-demand`.
- [ ] Criar workflow `whatsapp-audio-inbound`.
- [ ] Criar workflow `failed-audio-job-retry`.
- [ ] Garantir HTTPS publico na VPS.
- [ ] Configurar backups do n8n e banco do n8n.
- [ ] Definir politica de rotacao de chaves e logs.

## 6. Escopo tecnico proposto

### 6.1 Tabelas novas

Validar schema remoto antes de criar migrations.

Proposta inicial:

- `audio_summary_topics`
  - `id`
  - `org_id`
  - `name`
  - `description`
  - `source_type`
  - `source_filters`
  - `prompt_template`
  - `schedule_config`
  - `audience_config`
  - `is_active`
  - `created_by`
  - `created_at`
  - `updated_at`

- `audio_voice_profiles`
  - `id`
  - `org_id`
  - `label`
  - `provider`
  - `provider_voice_id`
  - `voice_instructions`
  - `response_format`
  - `speed`
  - `is_default`
  - `created_at`
  - `updated_at`

- `audio_delivery_subscriptions`
  - `id`
  - `org_id`
  - `user_id`
  - `recipient_name`
  - `recipient_phone`
  - `channel`
  - `topic_id`
  - `voice_profile_id`
  - `opt_in_status`
  - `opt_in_at`
  - `created_at`
  - `updated_at`

- `audio_summary_jobs`
  - `id`
  - `org_id`
  - `topic_id`
  - `recipient_user_id`
  - `recipient_phone`
  - `voice_profile_id`
  - `idempotency_key`
  - `status`
  - `summary_text`
  - `audio_storage_path`
  - `provider_media_id`
  - `provider_message_id`
  - `attempts`
  - `last_error`
  - `scheduled_for`
  - `sent_at`
  - `created_at`
  - `updated_at`

- `audio_inbound_messages`
  - `id`
  - `org_id`
  - `contact_phone`
  - `provider_message_id`
  - `provider_media_id`
  - `audio_storage_path`
  - `transcription_text`
  - `intent`
  - `status`
  - `last_error`
  - `created_at`

### 6.2 Storage

- [ ] Criar bucket privado para audios gerados/recebidos.
- [ ] Definir retencao por plano e politica LGPD.
- [ ] Nunca tornar audio publico sem URL assinada de curta duracao ou media upload controlado.
- [ ] Registrar metadados minimos, evitando PII desnecessaria.

### 6.3 Edge Functions

Criar ou evoluir:

- `audio-summary-generate`
  - Recebe `topic_id`, `recipient_id` e `request_id`.
  - Gera resumo textual com dados reais do Supabase.
  - Chama TTS server-side.
  - Salva audio e atualiza `audio_summary_jobs`.

- `audio-summary-dispatch`
  - Envia audio pelo WhatsApp.
  - Usa idempotencia por `idempotency_key`.
  - Atualiza status do job.

- `whatsapp-webhook`
  - Endpoint publico com verificacao de token e assinatura.
  - Recebe status de mensagens e audios inbound.
  - Encaminha para n8n ou processa direto conforme volume.

- `audio-inbound-transcribe`
  - Baixa audio recebido.
  - Transcreve via OpenAI STT ou Whisper self-hosted.
  - Persiste transcricao.

Evoluir:

- `whatsapp-integration`
  - Incluir `mediaType: 'audio'`.
  - Suportar envio de audio por URL assinada ou media ID.
  - Nao aceitar credenciais vindas do browser para envio real.

- `n8n-integration`
  - Usar segredo/HMAC para webhooks de producao.
  - Remover dependencia de API key informada pelo frontend para operacoes sensiveis.
  - Registrar `request_id`, `org_id`, status e latencia.

### 6.4 n8n

Infra minima da VPS:

- Ubuntu LTS.
- Docker e Docker Compose.
- n8n em container.
- Postgres dedicado para n8n.
- Reverse proxy com TLS, preferencialmente Caddy ou Nginx + Certbot.
- Firewall liberando somente SSH, HTTP e HTTPS.
- Backups automaticos do banco n8n e volume de configuracao.
- Dominio/subdominio: `n8n.metaconstrutor.app.br` ou equivalente.

Variaveis esperadas no n8n:

- `N8N_ENCRYPTION_KEY`
- `N8N_HOST`
- `N8N_PROTOCOL`
- `WEBHOOK_URL`
- `N8N_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- `AUDIO_WEBHOOK_SHARED_SECRET`

## 7. Ponto de parada obrigatorio para chaves

Quando a implementacao chegar ao cadastro de secrets, parar e solicitar ao usuario os valores reais.

Nao inventar, nao preencher placeholders em producao e nao commitar chaves.

Valores que o usuario devera fornecer:

- `OPENAI_API_KEY`
- `N8N_BASE_URL`
- `N8N_API_KEY`
- `N8N_WEBHOOK_SECRET` ou `AUDIO_WEBHOOK_SHARED_SECRET`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- `META_APP_SECRET`, se for usada verificacao de assinatura do webhook
- URL publica da VPS/n8n
- Confirmacao do dominio/subdominio desejado

Valores que o agente pode descobrir/validar no projeto, se autorizado:

- `SUPABASE_URL`
- project id Supabase
- nomes de Edge Functions
- bucket Storage criado
- URL de Edge Function publicada

## 8. Regras de seguranca, LGPD e produto

- [ ] Chaves externas ficam apenas em Supabase Secrets, n8n credentials/env ou cofre equivalente.
- [ ] Frontend nunca chama OpenAI, WhatsApp ou n8n com chave sensivel.
- [ ] `org_id` e obrigatorio em todos os jobs e configuracoes.
- [ ] RLS deve isolar assuntos, assinaturas, jobs e transcricoes por organizacao.
- [ ] Audio recebido pode conter dados pessoais; aplicar retencao e exclusao LGPD.
- [ ] Consentimento/opt-in do destinatario deve ser registrado antes de envio recorrente por WhatsApp.
- [ ] Mensagem/fluxo deve informar que a voz e gerada por IA.
- [ ] Nenhum fluxo deve reportar `enviado` sem resposta real do provedor ou estado pendente auditavel.
- [ ] Falha de OpenAI, WhatsApp ou n8n deve aparecer em log e status operacional.
- [ ] Limitar tamanho de texto para TTS; quando exceder, resumir em partes ou condensar antes.
- [ ] Rate limit por organizacao e por destinatario.

## 9. Plano de execucao

### P0 - Planejamento e contratos

- [x] Consultar `PRD_MESTRE.md`.
- [x] Clonar `openai/whisper` como referencia externa.
- [x] Conferir documentacao atual da OpenAI para STT/TTS.
- [x] Mapear integracoes existentes de n8n e WhatsApp no app.
- [ ] Confirmar VPS disponivel, dominio e acesso SSH.
- [ ] Confirmar se n8n sera instalado por Docker Compose.
- [ ] Confirmar se STT sera OpenAI hosted ou Whisper self-hosted na VPS.
- [ ] Parar para cadastro de chaves reais.

### P1 - Banco, storage e contratos

- [ ] Verificar schema remoto Supabase antes de migrations.
- [ ] Criar migrations das tabelas `audio_*`.
- [ ] Criar policies RLS por `org_id`.
- [ ] Criar bucket privado de audio.
- [ ] Atualizar tipos Supabase.
- [ ] Criar testes de contrato para insert/select/update basicos.

### P2 - Backend Supabase

- [ ] Criar `audio-summary-generate`.
- [ ] Criar `audio-summary-dispatch`.
- [ ] Criar `audio-inbound-transcribe`.
- [ ] Criar/ajustar `whatsapp-webhook`.
- [ ] Evoluir `whatsapp-integration` para audio.
- [ ] Evoluir `n8n-integration` para webhook seguro e auditavel.
- [ ] Adicionar eventos em `analytics_events`.

### P3 - n8n/VPS

- [ ] Instalar n8n na VPS.
- [ ] Configurar TLS e URL publica.
- [ ] Configurar secrets/credentials.
- [ ] Criar workflows de agendamento, envio, recebimento e retry.
- [ ] Testar disparo controlado contra Edge Function.
- [ ] Registrar evidencias de execucao.

### P4 - Frontend

- [ ] Criar tela ou aba de configuracao de Audio/Resumo em `/app/integracoes` ou rota dedicada.
- [ ] Cadastrar assuntos de resumo.
- [ ] Cadastrar destinatarios/opt-in.
- [ ] Selecionar voz `Masculina`/`Feminina`.
- [ ] Preview de resumo textual.
- [ ] Preview de audio.
- [ ] Tela de jobs/status/falhas.
- [ ] Tela de audios recebidos/transcricoes.

### P5 - Validacao e deploy

- [ ] `npm run lint`.
- [ ] `npm run test`.
- [ ] `npm run build`.
- [ ] Smoke local autenticado.
- [ ] Teste real de envio de audio para numero controlado.
- [ ] Teste real de recebimento/transcricao de audio.
- [ ] Validar logs em `audio_summary_jobs` e `analytics_events`.
- [ ] Validar ausencia de chaves no bundle/frontend.
- [ ] Deploy Supabase Functions.
- [ ] Deploy Vercel se houver alteracao frontend.

## 10. Criterios de aceite

- [ ] Um usuario autorizado consegue cadastrar assunto real de resumo.
- [ ] Um usuario autorizado consegue selecionar voz `Masculina` ou `Feminina`.
- [ ] Sistema gera resumo sem dados ficticios.
- [ ] Sistema gera arquivo de audio a partir do resumo.
- [ ] Sistema envia audio por WhatsApp para numero controlado.
- [ ] Job fica auditavel com status e provider message id.
- [ ] Falha de provedor nao vira sucesso visual.
- [ ] Usuario consegue enviar audio para o canal configurado.
- [ ] Sistema transcreve o audio recebido e salva no app.
- [ ] Logs de n8n/Supabase permitem rastrear request de ponta a ponta.
- [ ] Chaves nao aparecem no frontend, em git, em logs ou em `integrations.credentials` de forma insegura.

## 11. Pendencias externas

- [ ] VPS aprovisionada.
- [ ] Dominio/subdominio apontado para VPS.
- [ ] n8n instalado e acessivel por HTTPS.
- [ ] Conta WhatsApp Business API aprovada.
- [ ] Numero de WhatsApp Business habilitado para Cloud API.
- [ ] Templates aprovados, se a janela de conversa exigir template.
- [ ] Chave OpenAI fornecida.
- [ ] Decisao final sobre STT: OpenAI API ou Whisper self-hosted.

## 12. Registro de execucao

### 2026-05-31

- `PRD_MESTRE.md` consultado.
- Repositorio `openai/whisper` clonado por `git clone` porque `gh` nao esta instalado neste ambiente.
- Clone mantido fora do repositorio Git do app para nao poluir status.
- Documentacao oficial OpenAI verificada via fallback web porque MCP `openaiDeveloperDocs` nao estava disponivel e `codex mcp add` falhou com `Acesso negado`.
- Integracoes existentes mapeadas: `n8n-integration`, `whatsapp-integration`, `useIntegrations`, `integrations`, `analytics_events` e `notifications`.

## 13. Proximo passo operacional

Proximo passo recomendado: aguardar confirmacao da VPS/n8n e, em seguida, executar P1 com verificacao do schema remoto Supabase.

Ao chegar no cadastro de chaves, parar e solicitar os valores da secao 7.
