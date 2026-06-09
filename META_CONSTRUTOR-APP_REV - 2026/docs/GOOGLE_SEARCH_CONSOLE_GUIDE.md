# Google Search Console — Guia de Configuração

**Site:** https://www.metaconstrutor.app.br  
**Status atual:** ✅ Sitemap no ar | ✅ robots.txt | ✅ 22 URLs no sitemap

---

## 📋 Passo a Passo

### 1. Acessar o Google Search Console

Vá para: **https://search.google.com/search-console**

### 2. Adicionar sua propriedade

Clique em **"Adicionar propriedade"** e escolha:

**Opção: "Prefixo de URL"**
```
https://www.metaconstrutor.app.br
```

### 3. Verificação de propriedade

Você tem **4 formas de verificar** que o site é seu. Escolha a mais fácil:

#### ✅ Opção 1 (RECOMENDADA): Registro DNS

- O Google vai te dar um registro TXT tipo: `google-site-verification=xxxxxxxxx`
- Vai no DNS do seu domínio (provavelmente onde comprou ou na Vercel) e adiciona:
  ```
  Tipo: TXT
  Nome: @
  Valor: google-site-verification=xxxxxxxxx
  ```
- Clica em **Verificar** — pronto.

#### ✅ Opção 2 (Alternativa): Arquivo HTML

- O Google baixa um arquivo HTML de verificação
- Joga em `public/` do projeto, faz deploy na Vercel, confirma

#### ✅ Opção 3 (Mais fácil ainda): Verificação via Vercel

Se o domínio está na Vercel, você pode verificar pelo **domínio já configurado** — a Vercel já provou que você é dono. Testa primeiro clicando em "Verificar" com o prefixo de URL, pode pegar automático.

---

### 4. Enviar o Sitemap

Depois de verificado:

1. No menu lateral, clique em **Sitemaps**
2. Em "Adicionar um sitemap", digite:
   ```
   sitemap.xml
   ```
3. Clique em **Enviar**

O Google vai ler seu sitemap e começar a indexar todas as 22 páginas.

---

### 5. O que monitorar (checklist mensal)

| Métrica | Onde ver | O que é bom |
|---------|----------|-------------|
| **Páginas indexadas** | Search Console → "Páginas" | 20+ das 22 do sitemap |
| **Impressões** | "Desempenho" → "Impressões" | Crescendo mês a mês |
| **Cliques** | "Desempenho" → "Cliques" | Crescendo mês a mês |
| **Posição média** | "Desempenho" → "Posição" | Ideal < 10 |
| **Erros de cobertura** | "Páginas" → "Erros" | Zero erros |
| **Core Web Vitals** | "Experiência" → "Core Web Vitals" | "Bom" em todos |

---

### 6. Ferramentas extras gratuitas

**Google Analytics (gratuito + integra com Search Console)**
- Mostra quais buscas trazem visitantes
- Mostra comportamento dentro do site
- Integra direto com o Search Console

**Google PageSpeed Insights**
- Testa performance (Core Web Vitals)
- https://pagespeed.web.dev/
- Meta Construtor precisa ter pontuação > 90

---

### 7. Juntas de vez — Google Analytics + Search Console

1. Cria conta em https://analytics.google.com
2. Adiciona a propriedade `https://www.metaconstrutor.app.br`
3. Pega o **Measurement ID** (formato: `G-XXXXXXXX`)
4. Liga no Search Console: Configurações → "Associar ao Google Analytics"
5. Pronto — você vê exatamente quais buscas do Google estão convertendo em cadastros

---

### 8. Verificação rápida (faz agora)

Depois de verificar e enviar o sitemap, testa no Google:

```
site:metaconstrutor.app.br
```

Se aparecerem páginas nos resultados, o Google já está indexando.

---

## 🚨 Problemas comuns

| Problema | Solução |
|----------|---------|
| "Sitemap não pôde ser lido" | O sitemap retorna 200 e é XML válido — provavelmente erro temporário, tenta de novo em 1h |
| "Página não encontrada" no Search Console | Alguma página do sitemap retornou 404 — verificar no navegador |
| "Propriedade não verificada" | DNS TXT pode levar até 24h pra propagar |
| "Cobertura: Excluído por 'noindex'" | Alguma página está com tag `<meta name="robots" content="noindex">` — remover se quer indexada |
| **"Propriedade já existe"** | Já foi adicionada antes — clica no nome do site no topo do Search Console pra acessar |

---

> ⏱️ **Tempo total:** 10 minutos pra configurar. Resultados de indexação começam em 24-48h.
> Após 2 semanas, você vê exatamente quais palavras-chave trazem gente pro Meta Construtor.
