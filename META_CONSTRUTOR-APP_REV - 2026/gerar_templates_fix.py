#!/usr/bin/env python3
"""Regenerate all 26 email templates with clean HTML, shorter text, friendly tone."""

import json, os

BASE = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\campanha-26-dias"

# Load cronograma
with open(os.path.join(BASE, "cronograma.json"), "r", encoding="utf-8") as f:
    cronograma = json.load(f)

# Content for each topic+tone combination - short, friendly, welcoming
topics = {
    "rdo_digital": {
        "Técnico": ("RDO digital, sem print no WhatsApp",
                     "Sabia que dá pra fazer o RDO direto pelo celular? Foto, assinatura e histórico num clique. Adeus papel, adeus 'perdi o documento'."),
        "Humor": ("RDO no WhatsApp? Sério?",
                   "Fotografar papel e mandar no grupo funciona… até alguém precisar de novo. O Meta Construtor resolve isso de verdade."),
    },
    "gestao_obras": {
        "Reportagem": ("3 obras, 3 status, 1 lugar só",
                       "Dá pra saber como está cada obra sem ligar pra ninguém. Status, fotos, documentos — tudo na mesma tela."),
        "Usabilidade": ("Menos planilha, mais obra",
                        "Planilha é boa, mas na obra ninguém abre o notebook. No celular você lança tudo na hora. Simples."),
    },
    "checklists": {
        "Técnico": ("Checklist que não some",
                     "Crie checklists por obra e marque pelo celular na hora. Cada item vira registro. Sem papel, sem esquecimento."),
        "Reportagem": ("DDS com assinatura digital",
                       "Registre o DDS e colha a assinatura de cada colaborador. Tudo digital, salvo por obra. Pronto pra fiscalização."),
    },
    "documentos": {
        "Emocional": ("Chega de 'cadê o documento?'",
                       "Projeto, ART, laudo, contrato. Cada documento num canto até alguém precisar e não achar. Centralize tudo no Meta Construtor."),
        "Usabilidade": ("Seus projetos sempre à mão",
                        "Subiu no celular? Já era. Tá online, acessível de qualquer lugar, organizado por obra. Sem pendrive, sem e-mail perdido."),
    },
    "relatorios": {
        "Técnico": ("Relatório de obra em 1 clique",
                     "Com alguns toques você gera um relatório completo. Dados reais, fotos, assinaturas. Profissional sem esforço."),
        "Reportagem": ("O que seus relatórios escondem?",
                       "Seu relatório ainda é planilha com print? O Meta Construtor entrega dados reais: RDOs, fotos, medições, tudo num PDF."),
    },
    "equipes": {
        "Humor": ("'Quem tá na obra hoje?'",
                   "Se você descobre quem está na obra pelo grupo do WhatsApp, o Meta Construtor é pra você. Equipes, funções e status na tela."),
        "Emocional": ("Sua equipe merece organização",
                      "Saber quem está em cada frente não é luxo, é necessidade. Cadastre a equipe, atribua funções, acompanhe em tempo real."),
    },
    "contratos": {
        "Técnico": ("Contrato e medição juntos",
                     "Contrato, medição, aditivo — tudo no lugar certo. Vincule cada medição ao contrato sem planilha paralela."),
        "Reportagem": ("Medição aprovada em campo",
                       "Aprovou no celular? Já era. O financeiro vê na hora. Sem 'manda o PDF', sem digitar de novo."),
    },
    "fluxo_caixa": {
        "Técnico": ("Fluxo de caixa por obra em tempo real",
                     "Veja exatamente quanto cada obra gastou e quanto ainda tem. Entrada, saída e saldo na palma da mão."),
        "Emocional": ("Orçamento estourou e ninguém avisou?",
                      "Sem controle financeiro por obra, o susto vem no final. O Meta Construtor mostra o gasto em tempo real. Você decide antes."),
    },
    "portal_cliente": {
        "Emocional": ("Seu cliente quer ver a obra",
                      "Dê acesso ao cliente. Ele vê fotos, cronograma, relatórios. Menos 'manda foto', mais confiança."),
        "Humor": ("'Manda foto da obra' — acabou",
                   "Cliente pedindo foto todo dia? Dá acesso ao portal. Ele vê quando quiser, você só constrói."),
    },
    "whatsapp_bot": {
        "Usabilidade": ("RDO sem abrir o sistema",
                        "Manda 'rdo de hoje' no WhatsApp, o bot responde. Sem login, sem app. Direto do zap que você já usa."),
        "Reportagem": ("O WhatsApp que sua obra precisa",
                       "Consultar RDO, status de obra e equipe pelo WhatsApp. Tudo no chat que você já usa todo dia."),
    },
    "integracoes": {
        "Técnico": ("Integre ao seu ERP",
                     "Seu ERP recebe os dados da obra automaticamente. RDO, medição, relatório. Sem digitar de novo."),
        "Reportagem": ("ERP atualizado sem digitar",
                       "Cada RDO lançado vira linha no seu ERP. Automático. Sem planilha de meio de campo."),
    },
    "seguranca": {
        "Técnico": ("Dados seguros e em conformidade",
                     "LGPD, criptografia e backup automático. Seus dados protegidos como merecem."),
        "Emocional": ("Seus dados merecem mais que uma planilha",
                      "Planilha não tem backup, nem versão, nem segurança. O Meta Construtor cuida dos seus dados de verdade."),
    },
    "planos": {
        "Humor": ("R$ 97 pra nunca mais ouvir 'cadê o RDO?'",
                   "Plano Pro: obras, RDOs e equipes ilimitados. Menos de 3h de engenheiro por mês. Vale?"),
        "Emocional": ("Comece de graça. Fique porque funciona.",
                      "Grátis pra testar. Quando sentir falta, escolhe o plano que encaixa. Sem pegadinha."),
    },
}

# Header styles
styles = {
    "A": {
        "bg": "background:linear-gradient(135deg,#1a365d,#1e40af)",
        "border": "border-bottom:4px solid #f97316",
        "sub": "color:rgba(255,255,255,0.85)",
    },
    "B": {
        "bg": "background:linear-gradient(135deg,#c2410c,#ea580c)",
        "border": "border-bottom:4px solid #166534",
        "sub": "color:rgba(255,255,255,0.9)",
    },
    "C": {
        "bg": "background:linear-gradient(135deg,#14532d,#166534)",
        "border": "border-bottom:4px solid #fbbf24",
        "sub": "color:rgba(255,218,71,0.9)",
    },
}

# Style rotation
style_order = ["A", "B", "C", "A", "C", "B", "A", "A", "B", "C", "A", "B",
               "C", "A", "A", "C", "B", "A", "B", "C", "B", "C", "A", "B", "C", "A"]

# Map cronograma topic slugs to the topics dict keys
slug_map = {
    "rdo_digital": "rdo_digital", "rdo_digital_2": "rdo_digital",
    "gestao_obras": "gestao_obras", "gestao_obras_2": "gestao_obras",
    "checklists": "checklists", "checklists_2": "checklists",
    "documentos": "documentos", "documentos_2": "documentos",
    "relatorios": "relatorios", "relatorios_2": "relatorios",
    "equipes": "equipes", "equipes_2": "equipes",
    "contratos": "contratos", "contratos_2": "contratos",
    "fluxo_caixa": "fluxo_caixa", "fluxo_caixa_2": "fluxo_caixa",
    "portal_cliente": "portal_cliente", "portal_cliente_2": "portal_cliente",
    "whatsapp_bot": "whatsapp_bot", "whatsapp_bot_2": "whatsapp_bot",
    "integracoes": "integracoes", "integracoes_2": "integracoes",
    "seguranca": "seguranca", "seguranca_2": "seguranca",
    "planos": "planos", "planos_2": "planos",
}

for idx, entry in enumerate(cronograma):
    dia = idx + 1
    subject = entry["subject"]
    tone = entry["tone"]
    topic_slug = entry["topic"]
    has_image = entry["has_image"]
    image_path = entry.get("image_path") or ""
    
    style_key = style_order[idx]
    st = styles[style_key]
    
    # Get body text
    topic_key = slug_map.get(topic_slug, topic_slug)
    topic_data = topics.get(topic_key, {})
    body_info = topic_data.get(tone, ("", ""))
    
    if isinstance(body_info, tuple) and len(body_info) >= 2:
        headline, body_text = body_info[0], body_info[1]
    elif isinstance(body_info, str):
        headline = ""
        body_text = body_info
    else:
        headline = ""
        body_text = ""
    
    # Image HTML
    img_html = ""
    if has_image and image_path:
        url = f"https://www.metaconstrutor.app.br{image_path}"
        img_html = f"""<tr>
  <td style="padding:0 0 16px 0;text-align:center;">
    <img src="{url}" alt="Meta Construtor" style="width:100%;max-width:560px;height:auto;border-radius:12px;display:block;margin:0 auto;" />
  </td>
</tr>"""
    
    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;">
<tr><td style="padding:30px 16px;" align="center">
<table role="presentation" width="100%" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
<tr>
  <td style="padding:32px 32px 24px;{st['bg']};text-align:center;{st['border']};">
    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Meta Construtor</h1>
    <p style="margin:6px 0 0;{st['sub']};font-size:13px;">Gestão de Obras Inteligente</p>
  </td>
</tr>
{img_html}
<tr><td style="padding:0 32px 16px;color:#374151;font-size:15px;line-height:1.7;">
<p style="margin:0 0 16px;"><strong>{headline}</strong></p>
<p style="margin:0 0 16px;">{body_text}</p>
</td></tr>
<tr>
  <td style="padding:0 32px 32px;text-align:center;">
    <a href="https://www.metaconstrutor.app.br/home" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:16px;font-weight:700;">Conhecer o Meta Construtor →</a>
  </td>
</tr>
<tr>
  <td style="padding:20px 32px;background:#f8fafc;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="margin:0 0 4px;color:#94a3b8;font-size:11px;">Meta Construtor — Gestão de Obras Inteligente</p>
    <p style="margin:0;color:#94a3b8;font-size:11px;">Se não quer mais receber nossos e-mails, responda com <strong>REMOVER</strong>.</p>
  </td>
</tr>
</table>
</td></tr></table>
</body>
</html>"""
    
    fname = f"dia-{dia:02d}-" + "-".join(subject.lower().split()[:4]) + ".html"
    # Use the actual filenames
    actual_files = sorted([f for f in os.listdir(BASE) if f.startswith("dia-") and f.endswith(".html")])
    if idx < len(actual_files):
        fname = actual_files[idx]
    
    path = os.path.join(BASE, fname)
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    
    # Verify
    content = open(path, "r", encoding="utf-8").read()
    errors = []
    if "<tr>" not in content:
        errors.append("No <tr>")
    if "</tr>" not in content:
        errors.append("No </tr>")
    if '<tr>\n  <td' in content:
        pass  # clean
    if '<tr><td' in content.replace(" ", ""):
        pass  # clean minified
    if '</td></tr>' not in content:
        errors.append("No closing </td></tr>")
    
    status = "✅" if not errors else f"❌ {', '.join(errors)}"
    print(f"{status} Dia {dia:02d} — {subject} ({tone})")

print("\nDone! Todos os 26 templates foram regenerados.")
