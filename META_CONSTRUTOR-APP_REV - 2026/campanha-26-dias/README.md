# 📧 Campanha Meta Construtor — 26 Dias

## Estrutura

```
campanha-26-dias/
├── cronograma.json          # Planejamento geral (26 dias)
├── README.md                # Este arquivo
├── run.py                   # Script principal de envio
├── gerar-cronjobs.py        # Gera comandos de cronjob
├── dia-01-rdo-tecnico.html  📷  RDO Digital (Técnico)
├── dia-02-rdo-humor.html    📷  RDO Digital (Humor)
├── dia-03-gestao-obras-reportagem.html  📷  Gestão de Obras
├── dia-04-gestao-obras-usabilidade.html 📷  Gestão de Obras
├── dia-05-checklists-tecnico.html       📷  Checklists
├── dia-06-checklists-reportagem.html    📷  Checklists
├── dia-07-documentos-emocional.html     📷  Documentos
├── dia-08-documentos-usabilidade.html       Documentos (sem img)
├── dia-09-relatorios-tecnico.html       📷  Relatórios
├── dia-10-relatorios-reportagem.html    📷  Relatórios
├── dia-11-equipes-humor.html            📷  Equipes
├── dia-12-equipes-emocional.html            Equipes (sem img)
├── dia-13-contratos-tecnico.html            Contratos (sem img)
├── dia-14-contratos-reportagem.html         Contratos (sem img)
├── dia-15-fluxo-caixa-tecnico.html      📷  Fluxo de Caixa
├── dia-16-fluxo-caixa-emocional.html        Fluxo de Caixa (sem img)
├── dia-17-portal-cliente-emocional.html 📷  Portal do Cliente
├── dia-18-portal-cliente-humor.html         Portal do Cliente (sem img)
├── dia-19-whatsapp-bot-usabilidade.html 📷  WhatsApp Bot
├── dia-20-whatsapp-bot-reportagem.html      WhatsApp Bot (sem img)
├── dia-21-integracoes-tecnico.html      📷  Integrações
├── dia-22-integracoes-reportagem.html       Integrações (sem img)
├── dia-23-seguranca-tecnico.html        📷  Segurança
├── dia-24-seguranca-emocional.html          Segurança (sem img)
├── dia-25-planos-humor.html             📷  Planos
└── dia-26-planos-emocional.html         📷  Planos
```

📷 = com imagem do app ou obra real. 19 com imagem, 7 só texto.

## Status Atual

**🔴 DNS do Resend NÃO CONFIGURADO**
- Remetente: `onboarding@resend.dev`
- Só envia para: `matheusnicolas.org@gmail.com`
- Bloqueante: NÃO envia para os leads da lista

## Modo de Uso

### 1. Teste individual (agora — DNS pendente)
```bash
# Enviar dia 1 para seu email:
python campanha-26-dias/run.py --to matheusnicolas.org@gmail.com --day 1

# Enviar TODOS os 26 dias para seu email (1 email imediatamente):
python campanha-26-dias/run.py --to matheusnicolas.org@gmail.com

# Apenas simular (não envia nada):
python campanha-26-dias/run.py --to matheusnicolas.org@gmail.com --dry-run
```

### 2. Verificar quais dias têm imagem
Olhe no cronograma.json — `has_image: true` significa que o template inclui print do app ou foto de obra real.

### 3. Quando o DNS estiver pronto

**Passo 1:** Configurar DNS no Resend (MX, SPF, DKIM, DMARC)

**Passo 2:** Trocar `RESEND_FROM_EMAIL` no .env para `contato@seudominio.com.br`

**Passo 3:** Agendar os 26 cronjobs (1 por dia às 09:00):
```bash
python campanha-26-dias/gerar-cronjobs.py
```
E siga as instruções geradas.

## E-mails com Imagem (19 de 26)

| Dias | Imagem | Razão |
|------|--------|-------|
| 1-7, 9-11, 15, 17, 19, 21, 23, 25-26 | 📷 Print do app | Mostra a interface real do sistema |
| 8, 12-14, 16, 18, 20, 22, 24 | Sem imagem | Tópicos abstratos ou complementares onde a imagem poluiria |

A decisão de não colocar imagem em 7 dias foi intencional:
- **Dia 8**: Documentos (Usabilidade) — o texto já descreve o benefício sem precisar de imagem
- **Dia 12**: Equipes (Emocional) — apelo emocional funciona melhor só com texto
- **Dia 13-14**: Contratos (Técnico/Reportagem) — assunto denso, imagem distrairia
- **Dia 16**: Fluxo de Caixa (Emocional) — apelo à segurança financeira
- **Dia 18**: Portal Cliente (Humor) — humor funciona melhor sem imagem
- **Dia 20**: WhatsApp Bot (Reportagem) — complemento do dia anterior
- **Dia 22**: Integrações (Reportagem) — conceito técnico abstrato
- **Dia 24**: Segurança (Emocional) — apelo emocional com dados sensíveis

## Revisão de Acentos e Links

✅ Todos os templates revisados:
- Acentuação correta (acentos, cedilhas, til)
- Links: todos apontam para `https://www.metaconstrutor.app.br/home`
- CTA: botão laranja (#f97316) com seta → 
- Footer: sem URL solta, opt-out via "responda REMOVER"
- CSS inline (compatível com Gmail/Outlook/Apple Mail)
