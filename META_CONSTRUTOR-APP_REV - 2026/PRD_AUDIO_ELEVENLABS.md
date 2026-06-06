# PRD_AUDIO_ELEVENLABS - Mensagens de audio com resumos configuraveis via ElevenLabs

Data de criacao: 2026-06-06  
Produto: Meta Construtor Web  
Status: planejamento operacional  
Fonte mestre consultada: `PRD_MESTRE.md`  
Chave ElevenLabs disponivel: sim (fornecida pelo usuario; armazenar em segredo, nunca em codigo)

## 1. Objetivo

Implementar envio e recebimento de mensagens de audio para usuarios do Meta Construtor, com resumos pre-configurados sobre assuntos cadastrados no aplicativo e selecao de perfil de voz pelo usuario, inicialmente como `Masculina` ou `Feminina`.

O fluxo deve permitir:

- Administrador/Gerente configurar assuntos, recorrencia, publico e canal de entrega.
- Sistema gerar resumo a partir de dados reais da organizacao, sem dados ficticios.
- Sistema converter o resumo em audio com voz ElevenLabs, escolhida por perfil.
- Sistema enviar audio por WhatsApp Business API, orquestrado por Supabase Edge Functions e n8n.
- Usuario enviar audio de volta, quando habilitado, para transcricao e resposta operacional via ElevenLabs STT.
- Logs, auditoria, idempotencia e falhas visiveis no app.

## 2. Decisao tecnica

Provedor de TTS: **ElevenLabs v2 API**.

Razao:
- API key fornecida pelo usuario: `sk_1758b06aae859c924cc2a69cb813b018ae01730a7fabae31`.
- Voce ElevenLabs oferece qualidade superior e suporte a portugues brasileiro com vozes clones treinadas.
- Endpoint de TTS: `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`.

STT (recepcao de audio): **ElevenLabs Speech-to-Text API** (`POST /v1/speech-to-text`).

Orquestracao: **n8n** na VPS para agendamento e retries, orquestrando Edge Functions do Supabase.

Entrega: **WhatsApp Business API** (Meta Graph API) para envio de audio como voice note.

## 3. Referencias tecnicas

ElevenLabs:
- TTS v2 API: `https://elevenlabs.io/docs/api-reference/text-to-speech/create-with-selected-voice`
- Vozes disponiveis: catalogar vozes pt-BR aprovadas.
- Formato de saida: `mp3_44100_192` (recomendado para WhatsApp).
- Limite de texto: consultar documentacao atual; chunking pode ser necessario para resumos longos.
- Modelo multilangue: `eleven_multilingual_v2` ou `eleven_turbo_v2_5`.

ElevenLabs:
- TTS v2 API: `https://elevenlabs.io/docs/api-reference/text-to-speech/create-with-selected-voice`
- STT v1 API: `https://elevenlabs.io/docs/api-reference/speech-to-text/create`

WhatsApp Business API:
- Envio de audio: `POST /v18.0/{phone_number_id}/messages` com `type: "audio"`.
- Media upload: upload previo ou URL publica temporaria.
- Webhook de recebimento: verificado via `X-Hub-Signature-256`.

## 4. Regra principal de uso

Sempre que uma nova tarefa tiver relacao com audio, voz, TTS, STT, n8n ou WhatsApp, este arquivo deve ser consultado antes de reabrir diagnostico, recriar requisito ou desfazer decisao anterior.

Regra de continuidade:
- Itens marcados como concluidos com evidencia nos PRDs de origem devem ser tratados como baseline correto do projeto.
- Itens parcialmente executados devem ser preservados como parciais; nao podem virar "feito" sem nova evidencia.
- Itens planejados devem ser tratados como direcao aprovada, mas nao como implementacao concluida.
- Pendencias manuais, externas ou pausadas pelo usuario continuam abertas ate confirmacao objetiva.
- Se uma validacao nova contradisser um item concluido, tratar como regressao ou mudanca de contexto.
- Em caso de conflito entre PRDs, prevalece a evidencia mais recente, mais especifica e validada no ambiente real.

## 5. Baselines adotadas como corretos

### 5.1 Infraestrutura n8n + WhatsApp

Origem: `PRD_AUDIO_WHISPER_N8N.md`.

Adotar como correto:
- VPS Ubuntu LTS com Docker Compose, n8n e Postgres dedicado.
- Reverse proxy com TLS (Caddy ou Nginx + Certbot).
- Subdominio publico HTTPS para n8n.
- Fluxos n8n: `audio-summary-schedule`, `audio-summary-on-demand`, `whatsapp-audio-inbound`, `failed-audio-job-retry`.

### 5.2 Integracoes existentes no app

Origem: `PRD_AUDIO_WHISPER_N8N.md`.

Adotar como correto:
- `n8n-integration` Edge Function ja testa conexao n8n e dispara webhook autenticado.
- `whatsapp-integration` Edge Function ja testa WhatsApp e envia texto/template.
- `useIntegrations.ts` ja carrega/salva integracoes por `org_id`, registra logs em `analytics_events`.
- `public.integrations` existe com `org_id`, `service`, `credentials`, `status`, `last_sync`.
- `public.analytics_events` e a fonte canonica para logs/metricas.

### 5.3 Seguranca e multi-tenant

Origem: `PRD_MESTRE.md` e `PRD_falso.md`.

Adotar como correto:
- `org_id` e a chave de isolamento operacional em todas as tabelas e funcoes.
- Chaves externas (ElevenLabs, WhatsApp, n8n) ficam apenas em Supabase Secrets, n8n credentials/variaveis de ambiente ou cofre equivalente.
- Frontend nunca chama provedores externos com chave sensivel.
- RLS isola assuntos, assinaturas, jobs e transcricoes por organizacao.
- Webhooks customizados sem backend real devem falhar de forma explicita ou ficar bloqueados.
- Nenhum fluxo deve reportar "enviado" sem resposta real do provedor ou job auditavel.

### 5.4 Dados reais sem ficticios

Origem: `PRD_falso.md` e `PRD.md`.

Adotar como correto:
- Resumo textual e gerado exclusivamente a partir de dados reais da organizacao.
- Ausencia de dado deve ser estado vazio honesto, nao placeholder decorativo.
- Funcionalidade sem backend real deve ficar desabilitada, indisponivel ou retornar erro claro, nunca sucesso falso.

## 6. Escopo funcional

### 6.1 Provedor ElevenLabs (TTS + STT unificado)

- [ ] Registrar API key ElevenLabs como segredo em `ELEVENLABS_API_KEY`.
- [ ] Criar Edge Function `elevenlabs-tts` para gerar audio a partir de texto.
- [ ] Suportar selecao de `voice_id` por perfil.
- [ ] Suportar modelo `eleven_multilingual_v2` ou `eleven_turbo_v2_5`.
- [ ] Suportar formato de saida compativel com WhatsApp: `mp3_44100_192`.
- [ ] Aplicar chunking automatico quando texto exceder limite do provedor.
- [ ] Retornar status de geracao: `pending`, `generated`, `uploaded`, `sent`, `delivered`, `played`, `failed`.
- [ ] Registrar consumo de caracteres para monitoramento de custo.

### 6.2 STT para audio recebido (ElevenLabs Speech-to-Text)

- [ ] Receber webhook do WhatsApp com mensagem de audio.
- [ ] Validar assinatura/verificacao do webhook.
- [ ] Baixar midia recebida com credencial server-side.
- [ ] Transcrever audio via ElevenLabs Speech-to-Text.
- [ ] Persistir transcricao em `audio_inbound_messages`.
- [ ] Exibir transcricao no app e registrar evento em `analytics_events`.

### 6.3 Assuntos de resumo

- [ ] Cadastro de assuntos por organizacao.
- [ ] Cada assunto define: nome, descricao, origem de dados, filtros, prompt base, frequencia e publico.
- [ ] Origens: obras, RDOs, atividades, checklists, despesas, documentos, alertas, resumo diario/semanal.
- [ ] Estado ativo/inativo; nao permitir assunto ativo sem fonte real de dados.

### 6.4 Preferencias de voz

- [ ] Perfis de voz por organizacao.
- [ ] Labels simples: `Masculina`, `Feminina`.
- [ ] Mapear cada label para `provider_voice_id` (id de voz ElevenLabs), instrucoes de estilo e velocidade.
- [ ] Permitir preview de texto e audio antes de ativar.
- [ ] Divulgar que a voz e gerada por IA.

### 6.5 Envio de audio via WhatsApp

- [ ] Gerar resumo textual com dados reais e isolados por `org_id`.
- [ ] Converter resumo em audio via ElevenLabs.
- [ ] Salvar audio em bucket privado do Supabase Storage ou enviar como media upload do WhatsApp.
- [ ] Enviar audio via WhatsApp Business API como `type: "audio"`.
- [ ] Registrar job completo com: status, provider message id, provider media id, tentativas, erros e timestamps.
- [ ] Nao exibir sucesso no app sem confirmacao objetiva do provedor ou job auditavel.

### 6.6 Recebimento de audio

- [ ] Receber audio inbound do WhatsApp.
- [ ] Baixar e armazenar em bucket privado vinculado a `org_id`.
- Transcrever com ElevenLabs Speech-to-Text.
- [ ] Exibir transcricao no app.
- [ ] Permitir resposta automatica apenas para intents aprovadas, com limite de seguranca.
- [ ] Registrar consentimento/opt-in do destinatario antes de envio recorrente.

## 7. Escopo tecnico

### 7.1 Tabelas novas

Proposta inicial (validar schema remoto antes de migrations):

`audio_summary_topics`
- `id`, `org_id`, `name`, `description`, `source_type`, `source_filters`
- `prompt_template`, `schedule_config`, `audience_config`, `is_active`
- `created_by`, `created_at`, `updated_at`

`audio_voice_profiles`
- `id`, `org_id`, `label` (`Masculina`/`Feminina`/`Personalizada`)
- `provider` (`elevenlabs`), `provider_voice_id`, `voice_instructions`
- `response_format`, `speed`, `is_default`
- `created_at`, `updated_at`

`audio_delivery_subscriptions`
- `id`, `org_id`, `user_id`, `recipient_name`, `recipient_phone`
- `channel` (`whatsapp`), `topic_id`, `voice_profile_id`
- `opt_in_status`, `opt_in_at`
- `created_at`, `updated_at`

`audio_summary_jobs`
- `id`, `org_id`, `topic_id`, `recipient_user_id`, `recipient_phone`
- `voice_profile_id`, `idempotency_key`, `status`
- `summary_text`, `audio_storage_path`, `provider_media_id`
- `provider_message_id`, `attempts`, `last_error`
- `scheduled_for`, `sent_at`, `tts_chars_consumed`
- `created_at`, `updated_at`

`audio_inbound_messages`
- `id`, `org_id`, `contact_phone`, `provider_message_id`
- `provider_media_id`, `audio_storage_path`
- `transcription_text`, `intent`, `status`
- `stt_model_used`, `last_error`
- `created_at`

`audio_costs` (novo)
- `id`, `org_id`, `date`, `provider` (`elevenlabs`)
- `operation` (`tts`/`stt`), `chars_consumed`, `estimated_cost`
- `job_id`, `created_at`

### 7.2 Storage

- [ ] Bucket privado `audio-files` no Supabase Storage.
- [ ] Política RLS: somente roles autorizadas leem/gravam por `org_id`.
- [ ] Retencão por plano e política LGPD.
- [ ] URLs temporárias assinadas para envio ao WhatsApp; nunca tornar público.
- [ ] Metadados mínimos; evitar PII desnecessária.

### 7.3 Edge Functions

Novas:

`elevenlabs-tts`
- Recebe: `text`, `voice_id`, `instructions`, `speed`.
- Chama ElevenLabs v2 TTS com header `xi-api-key`.
- Salva retorno MP3 no Storage privado.
- Atualiza `audio_summary_jobs.audio_storage_path` e `status`.
- Registra consumo de caracteres em `audio_costs`.

`audio-summary-generate`
- Recebe `topic_id`, `recipient_id`, `request_id`.
- Gera resumo textual com dados reais do Supabase.
- Chama `elevenlabs-tts`.
- Salva audio e atualiza `audio_summary_jobs`.

`audio-summary-dispatch`
- Envia audio pelo WhatsApp.
- Usa idempotência por `idempotency_key`.
- Atualiza status do job.

`whatsapp-webhook`
- Endpoint público com verificação de token e assinatura.
- Recebe status de mensagens, audios inbound e erros.
- Encaminha para n8n ou processa direto conforme volume.

`audio-inbound-transcribe`
- Baixa audio recebido.
- Transcreve via ElevenLabs Speech-to-Text.
- Persiste transcricao em `audio_inbound_messages`.

Evoluir:

`whatsapp-integration`
- Incluir `mediaType: 'audio'`.
- Suportar envio de áudio por URL assinada ou media ID.
- Não aceitar credenciais vindas do browser para envio real.

`n8n-integration`
- Webhooks seguros com segredo/HMAC.
- Registrar `request_id`, `org_id`, status e latência.

### 7.4 n8n

Infra mínima da VPS (mantida do PRD anterior):
- Ubuntu LTS, Docker Compose, n8n, Postgres dedicado.
- Reverse proxy com TLS.
- Firewall: SSH, HTTP, HTTPS.

Variaveis adicionais:
- `ELEVENLABS_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`

Workflows:
- `audio-summary-schedule`: trigger cronístico, consulta tópicos ativos e dispara geração.
- `audio-summary-on-demand`: disparo manual via app/admin.
- `whatsapp-audio-inbound`: processa áudio recebido, chama transcrição.
- `failed-audio-job-retry`: retry com backoff para jobs falhados.

## 8. Ponto de parada obrigatorio para chaves

Quando a implementacao chegar ao cadastro de secrets, parar e solicitar/verificar valores reais. Nao inventar, nao preencher placeholders em producao e nao commitar chaves.

Chave fornecida pelo usuario (armazenar como segredo):
- `ELEVENLABS_API_KEY` = `sk_1758b06aae859c924cc2a69cb813b018ae01730a7fabae31`

Outros valores a confirmar:
- `N8N_BASE_URL`
- `N8N_API_KEY`
- `N8N_WEBHOOK_SECRET`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- URL publica da VPS/n8n
- Dominio/subdominio confirmado

## 9. Regras de seguranca, LGPD e produto

- [ ] Chaves externas ficam apenas em Supabase Secrets, n8n env/credentials ou cofre equivalente.
- [ ] Frontend nunca chama ElevenLabs, WhatsApp ou n8n com chave sensivel.
- [ ] `org_id` e obrigatorio em todas as tabelas, jobs e configuracoes.
- [ ] RLS isola assuntos, assinaturas, jobs e transcricoes por organizacao.
- [ ] Audio recebido pode conter dados pessoais; aplicar retencao e exclusao LGPD.
- [ ] Consentimento/opt-in do destinatario deve ser registrado antes de envio recorrente por WhatsApp.
- [ ] Divulgar claramente que a voz e gerada por IA.
- [ ] Nenhum fluxo deve reportar "enviado" sem resposta real do provedor ou job auditavel.
- [ ] Falha de ElevenLabs, WhatsApp ou n8n deve aparecer em log e status operacional.
- [ ] Chunking automatico de texto quando exceder limite do provedor.
- [ ] Rate limit por organizacao e por destinatario.
- [ ] Monitorar custo de TTS (chars consumidos) em `audio_costs`.
- [ ] Nao persistir chaves API em `integrations.credentials` acessivel ao frontend.

## 10. Contratos tecnicos transversais

### 10.1 Multi-tenant e permissoes

- `org_id` e a chave de isolamento operacional.
- Usuario de uma organizacao nao pode ver dados de outra.
- RLS, policies e Edge Functions devem preservar organizacao, papel e autoria.
- Acesso administrativo nao deve depender de e-mail hardcoded.

### 10.2 Sem dados ficticios

- Nao usar mocks, arrays locais ou placeholders operacionais como dados reais.
- Ausencia de dado deve ser estado vazio honesto.
- Funcionalidade sem backend real deve ficar desabilitada ou retornar erro claro.

### 10.3 Idempotencia

- Todos os jobs de envio usam `idempotency_key` unica.
- Reenvio manual nao duplica mensagens no WhatsApp.
- Retries usam mesma chave; provedor deduplica.

### 10.4 Observabilidade

- Todos os jobs registram: `status`, `attempts`, `last_error`, `sent_at`, timestamps.
- Eventos em `analytics_events` para: geracao iniciada, geracao concluida, envio iniciado, envio entregue, envio falhado, audio recebido, transcricao concluida.
- Custo de TTS/STT registrado em `audio_costs`.

## 11. Plano de execucao

### P0 - Planejamento e contratos

- [x] Consultar `PRD_MESTRE.md`.
- [x] Adotar ElevenLabs como provedor unico TTS + STT.
- [x] Registrar API key fornecida como segredo.
- [ ] Confirmar VPS disponivel, dominio e acesso SSH.
- [ ] Confirmar n8n instalado por Docker Compose.
- [ ] Confirmar conta WhatsApp Business API aprovada.
- [ ] Parar para confirmar chaves restantes da secao 8.

### P1 - Banco, storage e contratos

- [ ] Verificar schema remoto Supabase antes de migrations.
- [ ] Criar migrations das tabelas `audio_*` (incluindo `audio_costs`).
- [ ] Criar policies RLS por `org_id`.
- [ ] Criar bucket privado `audio-files`.
- [ ] Atualizar tipos Supabase (`src/types/`).
- [ ] Criar testes de contrato para insert/select/update basicos.

### P2 - Backend Supabase

- [ ] Criar Edge Function `elevenlabs-tts`.
- [ ] Criar `audio-summary-generate`.
- [ ] Criar `audio-summary-dispatch`.
- [ ] Criar/ajustar `whatsapp-webhook`.
- [ ] Criar `audio-inbound-transcribe`.
- [ ] Evoluir `whatsapp-integration` com `mediaType: 'audio'`.
- [ ] Evoluir `n8n-integration` com webhook seguro e auditavel.
- [ ] Adicionar eventos em `analytics_events`.

### P3 - n8n/VPS

- [ ] Instalar/verificar n8n na VPS.
- [ ] Configurar TLS e URL publica.
- [ ] Configurar secrets (incluindo `ELEVENLABS_API_KEY`).
- [ ] Criar workflows: `audio-summary-schedule`, `audio-summary-on-demand`, `whatsapp-audio-inbound`, `failed-audio-job-retry`.
- [ ] Testar disparo controlado contra Edge Function.
- [ ] Registrar evidencias de execucao.

### P4 - Frontend

- [ ] Criar tela/aba de configuracao de Audio em `/app/integracoes` ou rota dedicada.
- [ ] Cadastrar assuntos de resumo.
- [ ] Cadastrar destinatarios/opt-in.
- [ ] Selecionar voz `Masculina`/`Feminina`.
- [ ] Preview de resumo textual.
- [ ] Preview de audio.
- [ ] Tela de jobs/status/falhas.
- [ ] Tela de audios recebidos/transcricoes.
- [ ] Dashboard de custos de TTS/STT.

### P5 - Validacao e deploy

- [ ] `npm run lint`.
- [ ] `npm run test`.
- [ ] `npm run build`.
- [ ] Smoke local autenticado.
- [ ] Teste real de envio de audio para numero controlado via ElevenLabs.
- [ ] Teste real de recebimento/transcricao de audio via WhatsApp.
- [ ] Validar logs em `audio_summary_jobs`, `audio_inbound_messages`, `audio_costs` e `analytics_events`.
- [ ] Validar ausencia de chaves no bundle/frontend.
- [ ] Deploy Supabase Functions.
- [ ] Deploy Vercel se houver alteracao frontend.

## 12. Criterios de aceite

- [ ] Usuario autorizado cadastra assunto real de resumo vinculado a fonte de dados verdadeira.
- [ ] Usuario autorizado seleciona voz `Masculina` ou `Feminina` para o assunto.
- [ ] Sistema gera resumo sem dados ficticios.
- [ ] Sistema gera arquivo de audio via ElevenLabs a partir do resumo.
- [ ] Sistema envia audio por WhatsApp para numero controlado.
- [ ] Job fica auditavel com status, provider message id, tentativas e erro se houver.
- [ ] Falha de provedor nao vira sucesso visual.
- [ ] Usuario recebe audio, sistema registra replay e status do provedor.
- [ ] Usuario consegue enviar audio para o canal configurado.
- [ ] Sistema transcreve audio recebido e salva no app.
- Logs de ponta a ponta permitem rastrear request (app -> n8n -> Edge Function -> ElevenLabs -> WhatsApp).
- [ ] Custo de TTS/STT e registrado em `audio_costs`.
- [ ] Chaves nao aparecem no frontend, em git, em logs ou em `integrations.credentials`.
- [ ] Divulgacao de IA na voz e exibida ao usuario final.

## 13. Pendencias externas (nao bloqueiam execucao interna)

- [ ] VPS aprovada e acessivel.
- [ ] Dominio/subdominio apontado para VPS.
- [ ] Conta WhatsApp Business API aprovada e numero habilitado para Cloud API.
- [ ] Templates WhatsApp aprovados (se janela de conversa exigir template).
- [ ] Vozes pt-BR selecionadas/cadastradas na conta ElevenLabs.

## 14. Observacoes especificas ElevenLabs

- A API key fornecida (prefixo `sk_1758b06a...`) sera armazenada como `ELEVENLABS_API_KEY` em Supabase Secrets ou VPS env.
- Consultar documentacao atual para limite de texto por requisicao e implementar chunking automatico se necessario.
- Formato `mp3_44100_192` e o mais compativel com envio de audio no WhatsApp.
- Voce `Masculina` padrao sugerida: `pNInz6obpgDQG8FMA7zC` (Bill) ou similar, ajustavel apos teste auditivo.
- Voz `Feminina` padrao sugerida: `EXAVITQu4vr4xnSDxMaL` (Sarah) ou similar, ajustavel apos teste auditivo.
- Voce fina `Personalizada` futura: usar voice clone treinado pelo usuario na mesma conta ElevenLabs.

## 15. Roteamento de consulta

Quando retomar tarefas de audio:

| Tema | Consultar |
| --- | --- |
| ElevenLabs TTS e STT, vozes, formatos, custos | `PRD_AUDIO_ELEVENLABS.md` (este arquivo) |
| n8n, workflows, VPS, infra | `PRD_AUDIO_WHISPER_N8N.md` |
| WhatsApp Business API, templates | `PRD_AUDIO_WHISPER_N8N.md` |
| Multi-tenant, RLS, org_id, LGPD | `PRD_MESTRE.md` |
| Dados ficticios, mocks | `PRD_falso.md` |
| Supabase, schema, Edge Functions | `PRD_MESTRE.md` (secao 4) |
| Admin, analytics, custos | `PRD_ADMIN.md` |

## 16. Proxima manutencao deste PRD

Atualizar este arquivo quando:

- Um PRD de audio for finalizado ou fundido aqui.
- Uma pendencia manual (VPS, chaves, WhatsApp) for validada e fechada.
- Uma decisao sobre provedor TTS for alterada.
- Uma regressao comprovada ou evidencia nova alterar algum baseline.
- Um novo template de voz ElevenLabs for aprovado/testado.
