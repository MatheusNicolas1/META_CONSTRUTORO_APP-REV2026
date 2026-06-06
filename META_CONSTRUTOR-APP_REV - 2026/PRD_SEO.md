# PRD_SEO - Reestrutura de Marketing, SEO e Descoberta Comercial

Status: Em execucao  
Data de criacao: 2026-05-28  
Owner tecnico: Codex  
Produto: Meta Construtor  
Escopo: paginas publicas e superficies de marketing

## 1. Objetivo

Reestruturar as paginas publicas do Meta Construtor para melhorar ranqueamento SEO, clareza comercial para decisores e descoberta organica em mecanismos de busca. O resultado esperado e uma experiencia limpa, minimalista, organizada e objetiva, com conteudo indexavel, metadados consistentes, arquitetura semantica correta, performance forte e narrativa comercial orientada a construtoras, engenheiros, gestores de obra e decisores.

Neste PRD, o termo "CEO" do pedido sera tratado como clareza para decisores executivos: a pagina deve responder rapidamente por que a plataforma existe, quais problemas resolve, qual retorno promete e qual proximo passo comercial tomar.

## 2. Principios de Design

- Limpo e objetivo: reduzir excesso de cards repetidos, efeitos decorativos e textos redundantes.
- Minimalista com intencao: usar espacamento, hierarquia tipografica e conteudo concreto em vez de ornamentos.
- SEO antes de efeito visual: cada pagina deve ter H1 unico, H2 coerentes, conteudo rastreavel e metadados completos.
- Conversao sem ruido: cada rota publica deve ter um CTA principal e, quando necessario, um CTA secundario.
- Consistencia de marca: preservar a identidade Meta Construtor, mas remover padroes visuais detectados como genericos ou "AI slop".
- Acessibilidade: contraste AA, foco visivel, hierarquia de headings e textos legiveis em mobile.

### Comando operacional permanente

- Nao alterar o layout interno do app autenticado. A execucao deste PRD deve modificar apenas paginas publicas, paginas de publicidade, superficies de marketing, SEO, prerender, sitemap, robots e componentes usados exclusivamente nessas rotas.
- Se um componente for compartilhado entre marketing e app autenticado, criar uma alternativa especifica para marketing ou limitar a alteracao por rota publica. Nao refatorar navegacao, dashboard, formularios internos, modulos de obra, RDO, checklist, documentos ou administracao sem um PRD proprio.

## 3. Ferramentas e MCPs

### Impeccable

Uso obrigatorio durante a execucao:

- `npx impeccable detect <rotas ou arquivos>` para detectar anti-padroes visuais e problemas objetivos.
- Fluxo conceitual conforme documentacao: `audit`, `critique`, `shape`, `optimize`, `harden`, `polish` e `live` quando disponivel.
- Registro local: a skill `impeccable` existe no projeto. `PRODUCT.md` e `DESIGN.md` foram criados para orientar a implementacao visual com contexto de marca.

### Figma

Uso recomendado quando a reestrutura visual entrar em implementacao:

- Criar wireframes de baixa fidelidade para `/home`, `/preco`, `/sobre`, `/contato`, `/blog` e paginas de suporte.
- Consolidar componentes: hero, blocos de prova, tabela de planos, FAQ, CTA final, rodape e blocos legais.
- Validar responsividade desktop, tablet e mobile antes de codificar grandes alteracoes.

### Canva

Uso recomendado para ativos de marketing:

- Criar template de imagem Open Graph para compartilhamento social.
- Criar arte padrao para posts do blog, cases e paginas institucionais.
- Exportar assets leves e otimizados, preferencialmente WebP/AVIF quando o pipeline permitir.

## 4. Estado Atual Observado

### Evidencias coletadas

- O CLI do Impeccable esta disponivel via `npx impeccable`.
- O servidor local subiu em `http://127.0.0.1:5173`.
- A rota `/home` respondeu HTTP 200 localmente.
- O componente `src/components/SEO.tsx` existe, mas atualmente cobre apenas `title`, `description` e `canonical` via `useEffect`.
- `index.html` possui metadados globais estaticos, incluindo Open Graph e Twitter, mas eles nao sao especificos por pagina.
- `public/robots.txt` permite crawlers, mas nao aponta para sitemap.
- Nao foi encontrado `sitemap.xml` em `public`.
- O app e uma SPA Vite com rewrite geral no `vercel.json`, entao todas as rotas publicas entregam o mesmo HTML inicial.
- Ha mistura potencial de dominio canonico: algumas rotas usam `https://metaconstrutor.com.br`, enquanto memoria de deploy anterior aponta `https://www.metaconstrutor.app.br` como producao. A decisao de dominio canonico precisa ser confirmada antes de publicar SEO.

### Achados do Impeccable em arquivos publicos

Comando executado:

```bash
npx.cmd impeccable detect src/pages/Index.tsx src/pages/Preco.tsx src/pages/Sobre.tsx src/pages/Contato.tsx src/pages/Blog.tsx src/pages/CentralAjuda.tsx src/pages/Documentacao.tsx src/pages/APIPage.tsx src/pages/Atualizacoes.tsx src/pages/Carreiras.tsx src/pages/Status.tsx src/pages/legal src/components/landing src/components/pricing src/components/SEO.tsx
```

Resultado resumido:

- 10 anti-padroes encontrados no recorte publico de marketing.
- `src/pages/Status.tsx`: `border-l-4` em card.
- `src/pages/legal/LGPD.tsx`: multiplos `border-l-4`.
- `src/components/landing/HeroSection.tsx`: texto em gradiente.
- `src/components/landing/VideoDemo.tsx`: contraste fraco, `text-slate-300` sobre `bg-green-400`.

### Achados do Impeccable em URLs locais

Comando executado:

```bash
npx.cmd impeccable detect http://127.0.0.1:5173/home http://127.0.0.1:5173/preco http://127.0.0.1:5173/sobre http://127.0.0.1:5173/contato http://127.0.0.1:5173/blog http://127.0.0.1:5173/central-ajuda http://127.0.0.1:5173/documentacao http://127.0.0.1:5173/status http://127.0.0.1:5173/api
```

Resultado resumido:

- 209 achados no conjunto de URLs.
- Temas recorrentes: baixo contraste, fonte Inter como unica familia, cards aninhados, textos pequenos, headings pulados, texto em gradiente, animacoes bounce/elastic, transicoes de altura, paleta roxo/ciano ou brilho em fundo escuro, linhas longas e padding insuficiente.
- Rotas com achados especificos fortes:
  - `/home`: baixo contraste, texto pequeno, brilho colorido em fundo escuro, bounce, linhas longas.
  - `/contato`: heading pulado de H1 para H3, icon tiles repetidos, baixo contraste.
  - `/blog`: heading pulado de H1 para H3, baixo contraste em badges, conteudo ainda generico.
  - `/central-ajuda`: baixo contraste, padding apertado, padroes visuais genericos.
  - `/documentacao`: heading pulado de H1 para H3.
  - `/status`: baixo contraste severo em verde, `border-left: 4px`, heading pulado.
  - `/api`: heading pulado, baixo contraste e padding apertado.

## 5. Rotas Publicas no Escopo

### P0 - Marketing principal

- `/home`: landing principal, foco em proposta de valor e conversao.
- `/preco`: planos e precos, foco em comparacao e assinatura.
- `/sobre`: institucional, confianca e autoridade.
- `/contato`: conversao comercial, suporte e canais.

### P1 - Conteudo, suporte e autoridade

- `/blog`: conteudo educacional e palavras-chave de gestao de obras.
- `/central-ajuda`: suporte indexavel, perguntas frequentes e tutoriais.
- `/documentacao`: documentacao tecnica e integracoes.
- `/api`: pagina tecnica comercial para integracoes.
- `/status`: transparencia operacional.
- `/atualizacoes`: changelog publico.
- `/carreiras`: marca empregadora.

### P2 - Legal e confianca

- `/legal/privacidade`
- `/legal/termos`
- `/legal/cookies`
- `/legal/lgpd`

### Fora de indexacao principal

Estas rotas devem existir, mas provavelmente com `noindex`:

- `/login`
- `/criar-conta`
- `/recuperar-senha`
- `/redefinir-senha`
- `/checkout`
- `/checkout/success`
- `/checkout/cancel`
- `/mfa`
- `/renovar-sessao`

## 6. Problemas P0

### P0.1 - SEO client-side insuficiente para paginas publicas

Problema: `SEO.tsx` altera metadados com `useEffect`, depois do HTML inicial. Em uma SPA com Vite e rewrite geral, crawlers recebem inicialmente o mesmo `index.html`.

Impacto: titulos, descricoes, canonical, Open Graph e dados estruturados podem nao ser lidos de forma consistente por crawlers e previews sociais.

Entrega:

- Expandir `SEO.tsx` ou criar `SeoHead` usando `react-helmet-async` de forma consistente.
- Suportar:
  - title
  - description
  - canonical
  - robots
  - Open Graph title, description, image, url, type
  - Twitter card
  - JSON-LD
  - hreflang se houver internacionalizacao publica
- Definir mapa central de metadados em `src/config/seo.ts`.
- Adotar prerender ou geracao estatica das rotas publicas no build.

Aceite:

- Cada rota publica P0/P1 tem metadados proprios renderizados no HTML entregue ou prerenderizado.
- O HTML de `/home`, `/preco`, `/sobre` e `/contato` contem title, meta description, canonical, og tags e JSON-LD antes da hidratacao.

### P0.2 - Dominio canonico indefinido

Problema: ha referencias a `metaconstrutor.com.br` no codigo e memoria de producao anterior aponta `www.metaconstrutor.app.br`.

Entrega:

- Confirmar dominio canonico de producao.
- Criar constante `PUBLIC_SITE_URL`.
- Atualizar canonical, sitemap, robots, Open Graph e redirects.
- Garantir que versoes com e sem `www` redirecionem para o canonico.

Aceite:

- Apenas um dominio canonico aparece em metadados, sitemap e redirects.
- Nao ha canonical baseado em `window.location.href` nas rotas publicas indexaveis.

### P0.3 - Sitemap e robots incompletos

Problema: `robots.txt` permite crawlers, mas nao informa sitemap. Nao ha `sitemap.xml` encontrado.

Entrega:

- Criar `public/sitemap.xml` com rotas indexaveis.
- Atualizar `public/robots.txt` com `Sitemap: <dominio>/sitemap.xml`.
- Excluir rotas privadas, checkout e auth do sitemap.
- Definir `lastmod`, `changefreq` e `priority`.

Aceite:

- `/robots.txt` retorna 200 e aponta para sitemap.
- `/sitemap.xml` retorna 200 e contem somente rotas publicas indexaveis.

### P0.4 - Estrutura semantica e acessibilidade afetam SEO

Problema: Impeccable detectou headings pulados, baixo contraste, textos pequenos e linhas longas.

Entrega:

- H1 unico por pagina.
- Sequencia correta H1 > H2 > H3.
- Texto principal com largura maxima entre 65ch e 75ch.
- Contraste AA em botoes, badges, cards e fundos coloridos.
- Remover `border-l-4`, gradient text, bounce e cards aninhados em paginas publicas.

Aceite:

- `npx impeccable detect <rotas publicas>` sem P0/P1 de contraste, headings ou anti-padroes proibidos.

## 7. Estrategia de Conteudo por Pagina

### `/home`

Intencao de busca:

- sistema de gestao de obras
- software para construtora
- RDO digital
- controle de obras online
- gestao de equipes na construcao civil

Reestrutura:

- Hero direto: promessa, publico e CTA.
- Bloco de dores: retrabalho, atraso, falta de registro, documentos dispersos.
- Bloco de solucao: RDO, checklists, equipes, documentos, relatorios.
- Prova: indicadores reais, cases, depoimentos ou beneficios verificaveis.
- Comparativo simples: antes e depois.
- FAQ com perguntas de compra.
- CTA final para criar conta ou falar com vendas.

Schema:

- `SoftwareApplication`
- `Organization`
- `FAQPage`
- `BreadcrumbList`

### `/preco`

Intencao de busca:

- preco software gestao de obras
- plano sistema construtora
- assinatura RDO digital

Reestrutura:

- Hero curto com explicacao do modelo de planos.
- Cards de planos sem card dentro de card.
- Tabela comparativa objetiva.
- FAQ de cobranca, cancelamento, limites e seguranca.
- CTA distinto para plano gratuito, assinatura e vendas.

Schema:

- `Product`
- `Offer`
- `FAQPage`

Requisito tecnico:

- Preservar comportamento anonimo atual de `/preco` com `usePlans({ staticOnly: true })`.
- Garantir que `/checkout?plan=...` continue sem erro anonimo.

### `/sobre`

Intencao de busca:

- Meta Construtor
- empresa software construcao civil
- plataforma brasileira gestao de obras

Reestrutura:

- Historia curta e concreta.
- Missao sem texto generico.
- Autoridade: mercado, seguranca, suporte, Brasil.
- Remover excesso de cards identicos.
- Usar imagem real do produto ou da operacao como prova visual.

Schema:

- `Organization`
- `AboutPage`

### `/contato`

Intencao de busca:

- contato Meta Construtor
- demonstracao sistema gestao de obras
- falar com vendas software construtora

Reestrutura:

- Hero com promessa de resposta e canal principal.
- Formulario objetivo.
- Canais secundarios em lista simples, sem icon tile stack repetido.
- Informacoes comerciais e suporte separadas.
- FAQ curta sobre tempo de resposta.

Schema:

- `ContactPage`
- `Organization`

### `/blog`

Intencao de busca:

- conteudo topo de funil sobre gestao de obras, RDO, checklist, produtividade e controle.

Problema atual:

- Posts estaticos e genericos, sem paginas individuais indexaveis.

Reestrutura:

- Criar rotas individuais `/blog/<slug>`.
- Criar dados estruturados para artigo.
- Definir calendario editorial inicial com 8 a 12 posts.
- Cada post deve ter titulo, resumo, autor real ou institucional, data, tempo de leitura, canonical e schema.

Schema:

- `Blog`
- `BlogPosting`
- `BreadcrumbList`

### `/central-ajuda`

Reestrutura:

- Transformar categorias em hub indexavel.
- Criar artigos ou secoes permanentes para perguntas frequentes.
- Corrigir busca para nao prometer resultado inexistente se ainda for apenas UI.
- Estrutura H2 por categoria e H3 por artigo.

Schema:

- `FAQPage`
- `HowTo` quando houver passo a passo real.

### `/documentacao` e `/api`

Reestrutura:

- Separar narrativa comercial da referencia tecnica.
- Corrigir exemplos se SDK/API nao existirem publicamente.
- Criar metadados especificos para integracoes.
- Corrigir headings e blocos de codigo.

Schema:

- `TechArticle`
- `SoftwareApplication`
- `BreadcrumbList`

### `/status`

Reestrutura:

- Se status for estatico, deixar claro que e pagina informativa.
- Se for dinamico, conectar a fonte real.
- Corrigir contrastes verdes e cards com side tab.
- Definir `noindex` se a pagina nao trouxer valor de busca.

Schema:

- `WebPage`

### Paginas legais

Reestrutura:

- Manter conteudo objetivo e rastreavel.
- Corrigir `border-l-4` em LGPD.
- Adicionar canonical, robots e breadcrumbs.
- Evitar blocos visuais desnecessarios.

Schema:

- `WebPage`
- `BreadcrumbList`

## 8. Arquitetura Tecnica Proposta

### SEO config central

Criar `src/config/seo.ts`:

```ts
export const SITE_URL = "https://www.metaconstrutor.app.br";

export const seoPages = {
  home: {
    path: "/home",
    title: "Meta Construtor | Sistema de gestao de obras e RDO digital",
    description: "Controle obras, RDOs, equipes, documentos e relatorios em uma plataforma simples para construtoras.",
    index: true,
  },
};
```

### Componente SEO

Evoluir `src/components/SEO.tsx` para:

- Usar `Helmet` de `react-helmet-async`.
- Aceitar `type`, `image`, `robots`, `jsonLd`, `locale` e `alternate`.
- Remover dependencia de `window.location.href` em paginas indexaveis.
- Padronizar fallback de imagem social.

### Prerender publico

Avaliar uma das opcoes:

1. Prerender no build para rotas publicas.
2. Geracao estatica de HTML por script pos-build.
3. Migracao futura de marketing para framework com SSR, se o impacto de SEO justificar.

Preferencia pragmatica inicial:

- Prerender das rotas publicas existentes, mantendo o app autenticado como SPA.

### Sitemap

Criar script:

- `scripts/generate-sitemap.mjs`
- Fonte: `src/config/seo.ts`
- Output: `public/sitemap.xml`

### Open Graph

Criar asset padrao:

- `/og/default-meta-construtor.png`
- `/og/home.png`
- `/og/preco.png`
- `/og/blog.png`

Usar Canva para templates quando a implementacao visual for iniciada.

## 9. Backlog Priorizado

### Fase 0 - Preparacao

- [x] Confirmar disponibilidade do CLI Impeccable.
- [x] Rodar `impeccable detect` nos arquivos publicos.
- [x] Rodar `impeccable detect` nas URLs locais principais.
- [x] Confirmar dominio canonico oficial.
- [x] Criar `PRODUCT.md` e `DESIGN.md` ou rodar fluxo equivalente do Impeccable para documentar contexto de marca.
- [ ] Definir se Figma sera usado para wireframes antes da codificacao.
- [ ] Definir se Canva sera usado para templates Open Graph.

### Fase 1 - Fundacao tecnica SEO

- [x] Criar `src/config/seo.ts`.
- [x] Evoluir `src/components/SEO.tsx`.
- [x] Atualizar metadados de `index.html` para fallback correto.
- [x] Criar sitemap.
- [x] Atualizar robots.
- [x] Definir `noindex` para auth, checkout e rotas privadas.
- [x] Adicionar JSON-LD base para `Organization` e `SoftwareApplication`.
- [x] Validar HTML inicial ou prerender.

### Fase 2 - Reestrutura P0

- [x] Reestruturar `/home`.
- [x] Reestruturar `/preco`.
- [x] Reestruturar `/sobre`.
- [x] Reestruturar `/contato`.
- [x] Corrigir contraste, headings e anti-padroes em `/sobre` e `/contato`.
- [x] Validar mobile e desktop de `/home` e `/preco`.
- [x] Validar mobile e desktop de `/sobre` e `/contato`.

### Fase 3 - Conteudo e autoridade

- [x] Reestruturar `/blog`.
- [x] Criar rotas de posts ou decidir `noindex` ate haver conteudo real. Criadas tres rotas reais de artigos evergreen.
- [x] Reestruturar `/central-ajuda`.
- [x] Reestruturar `/documentacao`.
- [x] Reestruturar `/api`.
- [x] Reestruturar `/status` ou marcar `noindex`.
- [x] Reestruturar `/atualizacoes` e `/carreiras`.

### Fase 4 - Legal e confianca

- [x] Corrigir paginas legais.
- [x] Remover `border-l-4` em LGPD.
- [x] Adicionar breadcrumbs e canonical.
- [x] Revisar legibilidade mobile.

### Fase 5 - Validacao e deploy

- [x] `npm run lint`.
- [x] `npm run test`.
- [x] `npm run build`.
- [x] `npx impeccable detect` em arquivos publicos.
- [x] `npx impeccable detect` em URLs locais.
- [x] Validar `robots.txt` e `sitemap.xml`.
- [x] Validar metadados renderizados.
- [x] Validar rotas publicas com `curl.exe`.
- [x] Revalidar `npm run build` apos bloqueio externo em `src/components/NovaAtividadeModal.tsx`.
- [ ] Deploy Vercel producao, se solicitado.
- [ ] Revalidar producao.

## 10. Criterios de Aceite

### SEO tecnico

- Todas as rotas publicas indexaveis possuem title unico com ate 60 caracteres quando possivel.
- Todas possuem description unica com ate 155-160 caracteres.
- Todas possuem canonical absoluto.
- Todas possuem Open Graph e Twitter card.
- Todas possuem schema adequado.
- Sitemap existe e lista apenas rotas indexaveis.
- Robots aponta para sitemap.
- Rotas privadas/auth/checkout nao aparecem no sitemap.

### Conteudo

- Cada pagina P0 responde em ate 5 segundos de leitura:
  - Para quem e.
  - Qual problema resolve.
  - Qual resultado promete.
  - Qual proximo passo tomar.
- H1 unico por pagina.
- H2/H3 sem saltos.
- Blog nao permanece como vitrine de posts ficticios sem paginas reais.

### Design

- Padrao limpo, minimalista e objetivo.
- Sem cards aninhados em superficies publicas.
- Sem texto em gradiente.
- Sem `border-l-4` como acento visual.
- Sem bounce/elastic decorativo.
- Sem icon tile stack repetido.
- Contraste AA nos principais textos e botoes.
- Textos principais com max-width legivel.

### Performance

- LCP dentro de meta aceitavel para landing.
- Imagens otimizadas e com dimensoes conhecidas.
- Sem animacao de `height`, `width`, `padding` ou `margin` em interacoes comuns.
- Lazy loading em imagens secundarias.

## 11. Comandos de Validacao

```bash
npx.cmd impeccable detect src/pages/Index.tsx src/pages/Preco.tsx src/pages/Sobre.tsx src/pages/Contato.tsx src/pages/Blog.tsx src/pages/CentralAjuda.tsx src/pages/Documentacao.tsx src/pages/APIPage.tsx src/pages/Atualizacoes.tsx src/pages/Carreiras.tsx src/pages/Status.tsx src/pages/legal src/components/landing src/components/pricing src/components/SEO.tsx
```

```bash
npx.cmd impeccable detect http://127.0.0.1:5173/home http://127.0.0.1:5173/preco http://127.0.0.1:5173/sobre http://127.0.0.1:5173/contato http://127.0.0.1:5173/blog http://127.0.0.1:5173/central-ajuda http://127.0.0.1:5173/documentacao http://127.0.0.1:5173/status http://127.0.0.1:5173/api
```

```bash
curl.exe -L -s -o NUL -w "%{http_code} %{content_type} %{size_download}" http://127.0.0.1:5173/home
curl.exe -L -s -o NUL -w "%{http_code} %{content_type} %{size_download}" http://127.0.0.1:5173/preco
curl.exe -L -s -o NUL -w "%{http_code} %{content_type} %{size_download}" http://127.0.0.1:5173/sitemap.xml
curl.exe -L -s -o NUL -w "%{http_code} %{content_type} %{size_download}" http://127.0.0.1:5173/robots.txt
```

```bash
npm run lint
npm run test
npm run build
```

## 12. Riscos e Decisoes Pendentes

- Dominio canonico precisa ser confirmado antes de alterar SEO em massa.
- Prerender pode exigir ajuste no build e em rotas que dependem de `window`, `document` ou auth.
- Paginas com conteudo ficticio, especialmente blog e documentacao de SDK/API, podem prejudicar confianca se forem indexadas sem revisao.
- A execucao visual completa deve acontecer apos contexto de marca do Impeccable, idealmente com `PRODUCT.md` e `DESIGN.md`.
- Se Figma/Canva forem usados, os assets finais precisam ser exportados otimizados para nao degradar performance.

## 13. Proxima Atividade Recomendada

1. Consolidar os residuos globais de `ai-color-palette`, `gradient-text` e `layout-transition` com isolamento da origem publica, sem alterar app autenticado.
2. Investigar `cramped-padding` generico por rota com evidencia DOM antes de nova tentativa ampla.
3. Reexecutar scan consolidado das rotas publicas principais para medir o saldo apos os ciclos de `/api`, `/central-ajuda`, `/carreiras`, `/sobre` e `/contato`.
4. Fazer deploy Vercel de producao e revalidacao publica somente se solicitado.
5. Definir se Figma/Canva entram apenas para assets futuros de Open Graph, sem bloquear a execucao tecnica atual.

## 14. Registro de Execucao

- 2026-05-28: Criado PRD_SEO.md.
- 2026-05-28: Consultada documentacao publica do Impeccable em `https://impeccable.style/docs/`.
- 2026-05-28: Carregado contexto local da skill Impeccable. `PRODUCT.md` e `DESIGN.md` ausentes.
- 2026-05-28: Confirmado CLI `npx impeccable`.
- 2026-05-28: Executado `impeccable detect` em arquivos publicos. Resultado: 10 anti-padroes no recorte publico.
- 2026-05-28: Iniciado Vite local em `http://127.0.0.1:5173`.
- 2026-05-28: Validado HTTP 200 local em `/home`.
- 2026-05-28: Executado `impeccable detect` em URLs publicas locais. Resultado: 209 achados no conjunto de URLs.
- 2026-05-28: Confirmado dominio canonico de producao: `https://www.metaconstrutor.app.br/home` respondeu HTTP 200; `https://metaconstrutor.com.br/home` nao resolveu.
- 2026-05-28: Criado `src/config/seo.ts` com `SITE_URL`, metadados centralizados, canonicals, Open Graph, Twitter e JSON-LD base.
- 2026-05-28: Evoluido `src/components/SEO.tsx` para `react-helmet-async`, incluindo canonical, robots, OG, Twitter e scripts JSON-LD.
- 2026-05-28: Atualizadas rotas publicas principais para usar `seoPages`: `/home`, `/preco`, `/sobre`, `/contato`, `/blog`, `/central-ajuda`, `/documentacao`, `/api`, `/status`, `/atualizacoes`, `/carreiras` e paginas legais.
- 2026-05-28: Atualizadas rotas de entrada/comercial sensivel: `/login`, `/criar-conta` e `/checkout` com metadados centralizados e noindex conforme configuracao.
- 2026-05-28: Criados `public/sitemap.xml` e `scripts/generate-sitemap.mjs`.
- 2026-05-28: Atualizado `public/robots.txt` com bloqueios para app/auth/checkout e ponteiro para sitemap canonico.
- 2026-05-28: Atualizado fallback de `index.html` com title, description, Open Graph, Twitter e imagem social absolutos.
- 2026-05-28: Executado `npm run build` com sucesso apos as alteracoes de SEO. Avisos residuais: `color-adjust` de CSS e chunking misto do Supabase, ambos preexistentes e nao bloqueantes para esta etapa.
- 2026-05-28: Validado localmente `http://127.0.0.1:5173/sitemap.xml`: HTTP 200, `text/xml`, 2736 bytes.
- 2026-05-28: Validado localmente `http://127.0.0.1:5173/robots.txt`: HTTP 200, `text/plain`, 394 bytes.
- 2026-05-28: Validado HTML inicial de `/home` com fallback atualizado: title, `og:title`, `og:url` e `twitter:title` presentes antes da hidratacao.
- 2026-05-28: Executado `npx impeccable detect src/components/SEO.tsx src/config/seo.ts public/robots.txt public/sitemap.xml` sem achados reportados.
- 2026-05-28: Corrigidos anti-padroes publicos apontados pelo Impeccable: removido texto em gradiente do `HeroSection`, corrigido contraste de evidencia em `VideoDemo`, removidos `border-l-4` de `Status` e `LGPD`.
- 2026-05-28: Executado `npx impeccable detect src/pages/Status.tsx src/pages/legal/LGPD.tsx src/components/landing/HeroSection.tsx src/components/landing/VideoDemo.tsx` sem achados reportados apos ajuste.
- 2026-05-28: Executado `npm run build` novamente com sucesso apos correcoes visuais. Avisos residuais permanecem os mesmos e nao bloqueiam esta etapa.
- 2026-05-29: Implementado prerender estatico pragmatico via `scripts/prerender-public-routes.mjs`, executado automaticamente no `postbuild`.
- 2026-05-29: Atualizado `package.json` com `postbuild` para gerar sitemap e HTML estatico das rotas publicas apos `vite build`.
- 2026-05-29: Atualizado `vercel.json` com rewrites explicitos para servir HTML prerenderizado em 15 rotas publicas antes do fallback SPA.
- 2026-05-29: Executado `npm run build` com sucesso. O `postbuild` reportou: `Prerendered 15 public route HTML files.`
- 2026-05-29: Validado que `dist/home/index.html`, `dist/preco/index.html`, `dist/contato/index.html` e `dist/legal/lgpd/index.html` foram criados.
- 2026-05-29: Validado `dist/home/index.html`, `dist/preco/index.html` e `dist/contato/index.html` com title, canonical, `og:url` e JSON-LD especificos por rota.
- 2026-05-29: Criados `PRODUCT.md` e `DESIGN.md` com contexto de marca, publico, voz, direcao visual, regras de layout, cor, movimento e conteudo.
- 2026-05-29: Executado `node .agents/skills/impeccable/scripts/load-context.mjs`. Resultado: `hasProduct: true`, `hasDesign: true`, `productPath: PRODUCT.md`, `designPath: DESIGN.md`.
- 2026-05-29: Reestruturado hero de `/home` em `src/components/landing/HeroSectionNew.tsx`, removendo digitacao, blobs decorativos, prova social generica e headline escura; nova promessa foca gestao de obras, RDO, documentos e rotina operacional.
- 2026-05-29: Reestruturado bloco principal de funcionalidades da home em `src/components/landing/ModernFeaturesSection.tsx`, substituindo grade extensa de cards expansivos por narrativa de modulos, resultados operacionais e CTAs objetivos.
- 2026-05-29: Reescrita `src/components/landing/StatsSection.tsx` para remover contadores animados que apareciam zerados em captura full-page; bloco agora usa prova operacional estatica e rastreavel.
- 2026-05-29: Reestruturado hero de `/preco` em `src/components/pricing/PricingHero.tsx`, removendo fundo com brilho e copy generica; novo texto explica plano gratuito, validacao da rotina e evolucao por necessidade.
- 2026-05-29: Ajustado `src/components/ui/pricing.tsx` para remover confete no toggle anual, badge em gradiente e animacao spring; corrigido redirecionamento do plano consultivo para `/contato` sem parametro incorreto.
- 2026-05-29: Reescrito rodape em `src/components/landing/FooterSection.tsx` para remover promessa generica e padronizar copy objetiva sobre obras, RDOs, checklists, documentos e relatorios.
- 2026-05-29: Adicionado smoke visual `scripts/prd-seo-p0-smoke.spec.ts` com validacao de titulo, H1 unico, ausencia de overflow horizontal, ausencia de erros de console e screenshots para `/home` e `/preco` em desktop e mobile.
- 2026-05-29: Executado `npx impeccable detect` nos arquivos alterados de `/home` e `/preco`; sem achados reportados.
- 2026-05-29: Executado `npm run build` com sucesso apos reestrutura P0 parcial. O `postbuild` manteve `Prerendered 15 public route HTML files.` Avisos residuais: `color-adjust` depreciado e import dinamico/estatico do Supabase.
- 2026-05-29: Reestruturadas `/sobre` e `/contato` com narrativa operacional, H1 unico, secoes sem hero em gradiente, menos cards repetidos, CTAs claros e formulario de contato preservado.
- 2026-05-29: Executado `npx impeccable detect src/pages/Sobre.tsx src/pages/Contato.tsx`; sem achados reportados nos arquivos reestruturados.
- 2026-05-29: Executado `npm run build` com sucesso apos reestrutura de `/sobre` e `/contato`. O `postbuild` manteve `Prerendered 15 public route HTML files.` Avisos residuais permanecem `color-adjust` depreciado e import dinamico/estatico do Supabase.
- 2026-05-29: Atualizado `scripts/prd-seo-p0-smoke.spec.ts` para cobrir `/home`, `/preco`, `/sobre` e `/contato` em desktop e mobile.
- 2026-05-29: Executado `npx playwright test scripts/prd-seo-p0-smoke.spec.ts --reporter=line`; 8 testes passaram. Evidencias geradas para `/home`, `/preco`, `/sobre` e `/contato` em `docs/evidence/prd-seo-*-desktop-2026-05-29.png` e `docs/evidence/prd-seo-*-mobile-2026-05-29.png`.
- 2026-05-29: Executado `npx impeccable detect http://127.0.0.1:5173/home http://127.0.0.1:5173/preco http://127.0.0.1:5173/sobre http://127.0.0.1:5173/contato`. Resultado: 142 achados de URL ainda abertos, majoritariamente em componentes compartilhados, tokens globais ou CSS empacotado: contraste do laranja primario, `DashboardPreviewMockup`, `VideoDemo`, `CaseStudies`, `BenefitsSection`, `Pricing`, fonte unica Inter, gradientes/textos em gradiente residuais, bounce/layout transition e cards aninhados.
- 2026-05-31: Escurecido token primario global em `src/index.css` (`--primary`, `--ring`, `--construction-orange`, `--sidebar-primary`) para melhorar contraste de botoes e badges com texto claro.
- 2026-05-31: Reescritos `DashboardPreviewMockup`, `VideoDemo`, `CaseStudies`, `BenefitsSection`, `ModernFeaturesSection`, `VisualWorkflowSection`, `EnhancedTestimonials` e `IntegrationsBanner` para reduzir fundo escuro com brilho, microtexto, animacoes decorativas, depoimentos/metricas ficticias, paleta roxa/ciano e rotas de case inexistentes.
- 2026-05-31: Ajustado H1 da home para recuperar a palavra-chave principal: `Gestao de obras, RDO e documentos em uma tela visual`.
- 2026-05-31: Ajustado `src/integrations/analytics.ts` para nao persistir pageviews e CTAs publicos de marketing no fallback Supabase, eliminando erros 401 no console de `/preco` e `/contato` durante smoke anonimo.
- 2026-05-31: Atualizado `scripts/prd-seo-p0-smoke.spec.ts` para o novo H1 da home e evidencias datadas de 2026-05-31.
- 2026-05-31: Executado `npx impeccable detect` nos arquivos alterados de marketing e analytics; sem achados reportados nos arquivos do ciclo.
- 2026-05-31: Executado `npm run build` com sucesso. O `postbuild` manteve `Prerendered 15 public route HTML files.` Avisos residuais permanecem `color-adjust` depreciado e import dinamico/estatico do Supabase.
- 2026-05-31: Executado `npx playwright test scripts/prd-seo-p0-smoke.spec.ts --reporter=line`; 8 testes passaram para `/home`, `/preco`, `/sobre` e `/contato` em desktop e mobile. Evidencias novas em `docs/evidence/prd-seo-*-desktop-2026-05-31.png` e `docs/evidence/prd-seo-*-mobile-2026-05-31.png`.
- 2026-05-31: Executado `npx impeccable detect http://127.0.0.1:5173/home http://127.0.0.1:5173/preco http://127.0.0.1:5173/sobre http://127.0.0.1:5173/contato`. Resultado: 66 achados de URL restantes, queda de 142 para 66. Restam principalmente `cramped-padding`, `line-length`, fonte unica Inter, `ai-color-palette`, `gradient-text`, `layout-transition` e `nested-cards`; parte relevante parece vir de CSS global empacotado/componentes fora do recorte P0 visivel.
- 2026-06-01: Adicionado comando operacional permanente: nao alterar layout interno do app autenticado durante este PRD; escopo limitado a paginas publicas, publicidade, marketing, SEO, prerender, sitemap, robots e componentes exclusivos dessas rotas.
- 2026-06-01: Reestruturadas `/blog`, `/central-ajuda`, `/documentacao` e `/api` como paginas publicas objetivas, sem posts ficticios, busca fake, chat/ticket fake, SDK falso, endpoints publicos inexistentes ou promessas tecnicas nao validadas.
- 2026-06-01: Executado `npx.cmd impeccable detect src/pages/Blog.tsx src/pages/CentralAjuda.tsx src/pages/Documentacao.tsx src/pages/APIPage.tsx`; sem achados reportados nos arquivos alterados.
- 2026-06-01: Executado smoke local em `/blog`, `/central-ajuda`, `/documentacao` e `/api` para desktop 1366x900 e mobile 390x844; 8 verificacoes passaram com H1 unico, ausencia de overflow horizontal e ausencia de erros de console.
- 2026-06-01: Evidencias visuais geradas em `docs/evidence/prd-seo-blog-desktop-2026-06-01.png`, `docs/evidence/prd-seo-blog-mobile-2026-06-01.png`, `docs/evidence/prd-seo-central-ajuda-desktop-2026-06-01.png`, `docs/evidence/prd-seo-central-ajuda-mobile-2026-06-01.png`, `docs/evidence/prd-seo-documentacao-desktop-2026-06-01.png`, `docs/evidence/prd-seo-documentacao-mobile-2026-06-01.png`, `docs/evidence/prd-seo-api-desktop-2026-06-01.png` e `docs/evidence/prd-seo-api-mobile-2026-06-01.png`.
- 2026-06-01: Executado `npx.cmd impeccable detect` nas URLs locais `/blog`, `/central-ajuda`, `/documentacao` e `/api`. Resultado: 31 achados residuais de URL, principalmente `cramped-padding`, `line-length`, fonte unica Inter, `ai-color-palette`, `gradient-text`, `layout-transition` e `nested-cards`, com indicio de origem em CSS global ou componentes compartilhados do bundle.
- 2026-06-01: `npm.cmd run build` bloqueado por erro fora do escopo de paginas publicitarias: `src/components/NovaAtividadeModal.tsx(556,28): Cannot find name 'responsaveis'`. Nenhuma alteracao de layout interno do app autenticado foi feita neste ciclo.
- 2026-06-01: Executado `npx.cmd vite build`; bundle Vite foi gerado, mas o processo encerrou com assertion Windows/libuv. O gate oficial de build permanece pendente ate resolver o erro TypeScript externo.
- 2026-06-02: Reestruturadas `/status`, `/atualizacoes` e `/carreiras` como paginas publicas honestas, sem uptime ficticio, versoes inventadas, vagas abertas fake, formulario de inscricao fake ou promessa de status em tempo real sem fonte validada.
- 2026-06-02: Ajustado `src/components/landing/FooterSection.tsx` para trocar a copy `Todos os sistemas operacionais` por `Plataforma web para rotina de obras`, removendo sinalizacao publica ambigua de status operacional automatico.
- 2026-06-02: Reestruturadas paginas legais `/legal/privacidade`, `/legal/termos`, `/legal/cookies` e `/legal/lgpd` com layout publico compartilhado, breadcrumb visual, SEO preservado, copy limpa e sem DPO/telefone ficticios, datas antigas, encoding quebrado ou CTAs para rotas autenticadas.
- 2026-06-02: Criado `src/pages/legal/LegalPageLayout.tsx` para padronizar paginas legais publicas com `LandingNavigation`, `FooterSection`, breadcrumb e largura de leitura controlada.
- 2026-06-02: Executado `npx.cmd impeccable detect src/pages/Status.tsx src/pages/Atualizacoes.tsx src/pages/Carreiras.tsx src/components/landing/FooterSection.tsx`; sem achados reportados.
- 2026-06-02: Executado `npx.cmd impeccable detect src/pages/legal/LegalPageLayout.tsx src/pages/legal/PrivacyPolicy.tsx src/pages/legal/TermsOfService.tsx src/pages/legal/CookiePolicy.tsx src/pages/legal/LGPD.tsx`; sem achados reportados.
- 2026-06-02: Executado smoke Playwright em `/status`, `/atualizacoes` e `/carreiras` para desktop 1366x900 e mobile 390x844; 6 verificacoes passaram com H1 unico, ausencia de overflow horizontal, ausencia de erros de console e ausencia de conteudo fake legado.
- 2026-06-02: Executado smoke Playwright em `/legal/privacidade`, `/legal/termos`, `/legal/cookies` e `/legal/lgpd` para desktop 1366x900 e mobile 390x844; 8 verificacoes passaram.
- 2026-06-02: Evidencias visuais geradas em `docs/evidence/prd-seo-status-*-2026-06-02.png`, `docs/evidence/prd-seo-atualizacoes-*-2026-06-02.png`, `docs/evidence/prd-seo-carreiras-*-2026-06-02.png` e `docs/evidence/prd-seo-legal-*-2026-06-02.png`.
- 2026-06-02: Criado resumo de evidencia `docs/evidence/prd-seo-p1-legal-2026-06-02.md`.
- 2026-06-02: Executado `npm.cmd run lint`; passou com 32 warnings preexistentes e 0 erros.
- 2026-06-02: Executado `npm.cmd run test`; 12 arquivos passaram, 38 testes passaram.
- 2026-06-02: Executado `npm.cmd run build`; passou com `postbuild` e `Prerendered 15 public route HTML files.` Avisos residuais: `color-adjust` depreciado e import dinamico/estatico do Supabase.
- 2026-06-02: Validados `robots.txt`, `sitemap.xml`, HTTP 200 das rotas P1/legal, metadados prerenderizados com title/canonical/`og:url`/JSON-LD e presenca das rotas P1/legal em `public/sitemap.xml` e `dist/sitemap.xml`.
- 2026-06-02: Executado `npx.cmd impeccable detect` em URLs locais P1 e legais. Resultado: 39 achados em P1 e 39 achados nas legais apos ajuste de largura; residual concentrado em CSS/bundle global e componentes publicos compartilhados (`cramped-padding`, Inter unico, `ai-color-palette`, `gradient-text`, `layout-transition`, `nested-cards`).
- 2026-06-02: Criadas tres rotas reais de artigos do blog: `/blog/como-estruturar-rdo`, `/blog/documentos-por-obra` e `/blog/checklist-qualidade-obra`, fechando a pendencia de posts individuais sem recorrer a `noindex`.
- 2026-06-02: Criado `src/content/blogArticles.ts` para centralizar conteudo evergreen e `src/pages/BlogArticle.tsx` para renderizar artigos com H1 unico, resumo, secoes, takeaways e CTA real.
- 2026-06-02: Atualizados `src/pages/Blog.tsx`, `src/components/PerformanceOptimizedApp.tsx`, `src/config/seo.ts`, `scripts/generate-sitemap.mjs`, `scripts/prerender-public-routes.mjs` e `vercel.json` para incluir artigos em rotas, metadados, sitemap, prerender e rewrites.
- 2026-06-02: Ajustado `scripts/generate-sitemap.mjs` para gravar tambem `dist/sitemap.xml` quando o diretorio `dist` existir, evitando sitemap de build defasado apos `postbuild`.
- 2026-06-02: Executado `npx.cmd impeccable detect src/pages/Blog.tsx src/pages/BlogArticle.tsx src/content/blogArticles.ts src/config/seo.ts`; sem achados reportados.
- 2026-06-02: Executado smoke Playwright em `/blog` e nos tres artigos para desktop 1366x900 e mobile 390x844; 8 verificacoes passaram com H1 unico, ausencia de overflow horizontal, ausencia de erros de console e ausencia de conteudo ficticio legado.
- 2026-06-02: Executado `npm.cmd run build`; passou com `postbuild` e `Prerendered 18 public route HTML files.`
- 2026-06-02: Executado `npm.cmd run lint`; passou com 32 warnings preexistentes e 0 erros. Executado `npm.cmd run test`; 12 arquivos passaram, 38 testes passaram.
- 2026-06-02: Validados HTTP 200 de `/blog`, tres artigos e `/sitemap.xml`; metadados prerenderizados dos artigos com canonical, `og:url` e JSON-LD; artigos presentes em `public/sitemap.xml` e `dist/sitemap.xml`.
- 2026-06-02: Criado resumo de evidencia `docs/evidence/prd-seo-blog-articles-2026-06-02.md`.
- 2026-06-02: Executado `npx.cmd impeccable detect` em URLs locais do blog e artigos. Resultado: 43 achados renderizados, ainda concentrados em CSS/bundle global e componentes publicos compartilhados (`cramped-padding`, Inter unico, `ai-color-palette`, `gradient-text`, `layout-transition`, `nested-cards`).
- 2026-06-02: Revisada tipografia publica global com escopo `body.marketing-surface`: corpo das paginas publicas usa `Noto Sans` e titulos/nav/botoes usam `Archivo`, mantendo `Inter` como fallback e sem alterar layout autenticado do app.
- 2026-06-02: `LandingNavigation` passou a aplicar/remover `marketing-surface` no `body` enquanto paginas publicas com navegacao de marketing estiverem montadas.
- 2026-06-02: A home publica foi polida para reduzir profundidade visual: achatados cards aninhados decorativos em `HeroSectionNew`, `DashboardPreviewMockup`, `VisualWorkflowSection`, `VideoDemo`, `ModernFeaturesSection`, `StatsSection`, `CaseStudies`, `EnhancedTestimonials`, `BenefitsSection` e `FAQSection`.
- 2026-06-02: Executado `npx.cmd impeccable detect` nos arquivos alterados de marketing e tipografia; sem achados reportados.
- 2026-06-02: Smoke DOM em `/home` confirmou `bodyClass: marketing-surface`, H1 `Gestao de obras, RDO e documentos em uma tela visual`, H1/nav com fonte `Archivo, "Noto Sans", Inter, system-ui, sans-serif` e contagem aproximada de cards aninhados visiveis igual a 0.
- 2026-06-02: Executado `npx.cmd impeccable detect http://127.0.0.1:5173/home`; resultado caiu para 27 achados de URL. Restam `cramped-padding`, `line-length` e achados provaveis de CSS/bundle global (`gradient-text`, `ai-color-palette`, `layout-transition`, `nested-cards`).
- 2026-06-02: Executado scan consolidado em 13 URLs publicas locais; resultado caiu de 136 para 124 achados. Categorias: `cramped-padding=36`, `nested-cards=27`, `gradient-text=26`, `layout-transition=13`, `ai-color-palette=13`, `line-length=9`; `overused-font` e `single-font` nao reapareceram.
- 2026-06-02: Geradas evidencias visuais `docs/evidence/prd-seo-home-depth-desktop-2026-06-02.png` e `docs/evidence/prd-seo-home-depth-mobile-2026-06-02.png`.
- 2026-06-02: Executado `npm.cmd run lint`; passou com 32 warnings preexistentes e 0 erros. Executado `npm.cmd run test`; 12 arquivos passaram, 38 testes passaram. Executado `npm.cmd run build`; passou com `postbuild` e `Prerendered 18 public route HTML files.`
- 2026-06-02: Criado resumo de evidencia `docs/evidence/prd-seo-typography-depth-2026-06-02.md`.
- 2026-06-02: Ajustados badges publicos de marketing para `py-1.5`, reduzindo ocorrencias de padding apertado sem alterar o layout autenticado do app.
- 2026-06-02: Reduzida largura de leitura publica de `max-w-[68ch]`/`max-w-[70ch]` para `max-w-[64ch]` em home, preco, blog, artigos, ajuda, documentacao, API, status, atualizacoes, carreiras, contato, sobre e paginas legais.
- 2026-06-02: Adicionados `p-2`, `p-3` ou `px-3` em blocos publicos com `border-y`, `divide-y` e previews de marketing para reduzir `cramped-padding`.
- 2026-06-02: Executado `npx.cmd impeccable detect` nos arquivos alterados de landing, pricing, blog, paginas institucionais e legais; sem achados reportados.
- 2026-06-02: Executado `rg` para confirmar ausencia de `max-w-[68ch]`, `max-w-[70ch]` e badges publicos `py-1` no recorte `src/pages`, `src/components/landing` e `src/components/pricing`; sem ocorrencias.
- 2026-06-02: Tentativa nao escalada de scan URL com Vite local foi bloqueada pelo sandbox do Windows ao carregar `vite.config.ts` (`Access is denied`); scans renderizados foram executados com permissao escalada por dependerem do servidor local.
- 2026-06-02: Scan consolidado em 13 URLs publicas caiu de 124 para 115 achados. Distribuicao final: `cramped-padding=29`, `gradient-text=26`, `nested-cards=23`, `layout-transition=13`, `ai-color-palette=13`, `line-length=7`, `single-font=2`, `overused-font=2`.
- 2026-06-02: Scan por rota apos os ajustes: `/home=26`, `/preco=13`, `/sobre=7`, `/contato=7`, `/blog=8`, `/blog/como-estruturar-rdo=7`, `/central-ajuda=8`, `/documentacao=8`, `/api=8`, `/status=8`, `/atualizacoes=12`, `/carreiras=11`, `/legal/privacidade=7`.
- 2026-06-02: Executado `npm.cmd run lint`; passou com 32 warnings preexistentes e 0 erros. Executado `npm.cmd run test`; 12 arquivos passaram, 38 testes passaram. Executado `npm.cmd run build`; passou com `postbuild` e `Prerendered 18 public route HTML files.`
- 2026-06-02: Criado resumo de evidencia `docs/evidence/prd-seo-readable-spacing-2026-06-02.md`.
- 2026-06-02: Recuperados arquivos publicos com bytes nulos que impediam leitura por `rg`, Impeccable e TypeScript no recorte de marketing.
- 2026-06-02: Recriados em texto limpo `src/components/landing/VisualWorkflowSection.tsx`, `src/pages/legal/LegalPageLayout.tsx`, `src/pages/BlogArticle.tsx` e `src/components/landing/DashboardPreviewMockup.tsx`.
- 2026-06-02: Substituida novamente `/blog` por listagem baseada em `src/content/blogArticles.ts`, removendo posts ficticios e newsletter fake que haviam retornado do conteudo versionado antigo.
- 2026-06-02: Recriado `src/components/pricing/PricingHero.tsx` sem `framer-motion`, glow/blur decorativo ou fundo em gradiente.
- 2026-06-02: Ajustado `src/components/landing/LandingNavigation.tsx` para remover `transition-all`, vidro, sombra pesada e arredondamento grande no menu publico.
- 2026-06-02: Ajustado `src/components/landing/HeroSectionNew.tsx` para remover kicker repetitivo acima do H1, remover `overflow-hidden` que causava clipping e incluir o nome do produto no H1.
- 2026-06-02: Adicionado override escopado em `body.marketing-surface` no `src/index.css` para renderizar classes antigas de gradiente como cor solida somente nas paginas publicas.
- 2026-06-02: Executado `npx.cmd impeccable detect` em `src/index.css`, navegacao publica, hero, mockup, pricing hero, blog, artigo, legal layout e workflow; sem achados reportados nos arquivos fonte.
- 2026-06-02: Executado `rg` no recorte publico critico para `bg-gradient`, `gradient-`, `bg-clip-text`, `text-transparent`, `transition-all`, `blur-[`, `animate-pulse`, `backdrop-blur`, `shadow-2xl`, `rounded-2xl` e `rounded-3xl`; sem ocorrencias.
- 2026-06-02: Validado servidor local em `/home`: HTTP 200, `text/html`, 2948 bytes.
- 2026-06-02: Executado `npx.cmd impeccable detect` em `/home`, `/preco`, `/blog`, `/blog/como-estruturar-rdo` e `/legal/privacidade`; resultado: 63 achados renderizados restantes, concentrados em `cramped-padding`, `line-length`, kickers repetidos, `nested-cards` e sinais globais de gradiente/layout.
- 2026-06-02: Executado scan isolado de `/home` apos ajuste do hero; resultado: 33 achados. Alertas de clipping e kicker do hero foram removidos; permanecem secoes antigas e residuais globais.
- 2026-06-02: Executado `npm.cmd run lint`; passou com 32 warnings preexistentes e 0 erros. Executado `npm.cmd run test`; 12 arquivos passaram, 40 testes passaram.
- 2026-06-02: `npm.cmd run build` bloqueado por erro fora do PRD_SEO e dentro do app autenticado: `src/components/NovaObraForm.tsx(319,33): Property 'onFilesChange' does not exist on type 'IntrinsicAttributes'`.
- 2026-06-02: Criado resumo de evidencia `docs/evidence/prd-seo-global-residual-2026-06-02.md`.
- 2026-06-03: Removidos kickers repetidos em `HeroSectionNew`, `ModernFeaturesSection`, `StatsSection`, `VideoDemo`, `FAQSection` e `EnhancedTestimonials`.
- 2026-06-03: Achatadas secoes publicas da home (`ModernFeaturesSection`, `StatsSection`, `CaseStudies`, `BenefitsSection`, `EnhancedTestimonials` e `FAQSection`) de grades de cards para blocos com divisorias.
- 2026-06-03: Removidos fundos decorativos dos icones em blocos publicos para reduzir `nested-cards`; `VideoDemo` passou a usar lista com divisorias em vez de card dentro de card.
- 2026-06-03: Limitada largura de textos longos no FAQ e no banner de integracoes.
- 2026-06-03: Executado `npx.cmd impeccable detect` nos componentes publicos alterados da home; sem achados reportados nos arquivos fonte.
- 2026-06-03: Executado `rg` para confirmar ausencia dos kickers e padroes de cards antigos no recorte editado; sem ocorrencias.
- 2026-06-03: Validado servidor local em `/home`: HTTP 200, `text/html`, 2948 bytes.
- 2026-06-03: Executado `npx.cmd impeccable detect http://127.0.0.1:5173/home`; resultado caiu de 33 para 17 achados. Residuais: `cramped-padding`, `nested-cards` e sinais globais de `gradient-text`, `ai-color-palette` e `layout-transition`.
- 2026-06-03: Executado scan renderizado em `/home`, `/preco`, `/blog`, `/blog/como-estruturar-rdo` e `/legal/privacidade`; resultado caiu de 63 para 43 achados.
- 2026-06-03: Executado `npm.cmd run lint`; passou com 32 warnings preexistentes e 0 erros. Executado `npm.cmd run test`; 12 arquivos passaram, 40 testes passaram.
- 2026-06-03: Executado `npm.cmd run build`; passou com `postbuild` e `Prerendered 18 public route HTML files.` O bloqueio anterior de `NovaObraForm` nao reapareceu neste build.
- 2026-06-03: Criado resumo de evidencia `docs/evidence/prd-seo-home-kickers-depth-2026-06-03.md`.
- 2026-06-03: Ajustadas paginas legais publicas para remover `line-length`: `LegalPageLayout` reduziu o wrapper para `max-w-3xl` e as secoes legais passaram de `max-w-[75ch]` para `max-w-[64ch]`.
- 2026-06-03: Achatada a listagem de categorias em `/legal/cookies`, substituindo cards aninhados por linhas com divisorias.
- 2026-06-03: Ajustado `FooterSection` publico para `bg-background` e links sociais iconicos sem superficie de card, reduzindo profundidade visual no rodape de marketing.
- 2026-06-03: Executado `npx.cmd impeccable detect` nos arquivos legais e no footer publico; sem achados reportados nos arquivos fonte alterados.
- 2026-06-03: Executado `npx.cmd impeccable detect` em `/legal/privacidade`, `/legal/termos`, `/legal/cookies` e `/legal/lgpd`; `line-length` nao reapareceu. Restaram achados renderizados concentrados em `cramped-padding`, `nested-cards`, `ai-color-palette`, `gradient-text` e `layout-transition`.
- 2026-06-03: Inspecao DOM em `/legal/termos` confirmou `bodyClass: marketing-surface`, H1 com `Archivo, "Noto Sans", Inter, system-ui, sans-serif` e paragrafo com `"Noto Sans", Inter, system-ui, sans-serif`; os achados intermitentes de fonte unica foram classificados como falso positivo do scan renderizado.
- 2026-06-03: Executado `rg` no recorte legal para confirmar ausencia de `max-w-[75ch]` e padroes antigos de card legal; sem ocorrencias.
- 2026-06-03: Executado `curl.exe` em `/legal/privacidade`; HTTP 200 com `text/html`.
- 2026-06-03: Executado `npm.cmd run lint`; passou com 32 warnings preexistentes e 0 erros. Executado `npm.cmd run test`; 13 arquivos passaram, 43 testes passaram.
- 2026-06-03: Executado `npm.cmd run build`; passou com `postbuild` e `Prerendered 18 public route HTML files.`
- 2026-06-03: Criado resumo de evidencia `docs/evidence/prd-seo-legal-line-length-2026-06-03.md`.
- 2026-06-03: Reestruturadas `/api`, `/central-ajuda` e `/carreiras` para remover gradientes publicos diretos, grids de cards decorativos e conteudo ficticio que havia reaparecido no workspace.
- 2026-06-03: `/central-ajuda` deixou de exibir busca fake, contadores de artigos, ticket fake e chat ao vivo sem contrato publico validado; agora usa topicos reais e CTA para `/contato`.
- 2026-06-03: `/carreiras` deixou de exibir vagas e beneficios inventados; agora declara ausencia de vagas especificas no momento e direciona candidatura espontanea para contato.
- 2026-06-03: `/api` passou a usar superficie neutra sem `bg-gradient-to-b`, blocos com divisorias em vez de cards e contrato publico com largura de leitura controlada.
- 2026-06-03: Executado `npx.cmd impeccable detect src\pages\APIPage.tsx src\pages\CentralAjuda.tsx src\pages\Carreiras.tsx`; sem achados reportados nos arquivos fonte.
- 2026-06-03: Executado `rg` nos tres arquivos para `bg-gradient`, `gradient-`, `bg-clip-text`, `text-transparent`, `transition-all`, `hover:shadow`, `rounded-2xl`, `rounded-3xl`, `Abrir Ticket`, `Chat ao Vivo`, `Desenvolvedor`, `Designer UX`, `Engenheiro Civil` e `Vagas Abertas`; sem ocorrencias.
- 2026-06-03: Executado `curl.exe -I` em `/api`, `/central-ajuda` e `/carreiras`; as tres rotas retornaram HTTP 200 com `text/html`.
- 2026-06-03: Executado `npx.cmd impeccable detect` renderizado em `/api`, `/central-ajuda` e `/carreiras`; resultado final ficou em 15 achados. `line-length` local foi removido; restaram `cramped-padding` generico por rota e sinais globais recorrentes de `ai-color-palette`, `gradient-text` e `layout-transition`.
- 2026-06-03: Executado `npm.cmd run lint`; passou com 31 warnings preexistentes e 0 erros. Executado `npm.cmd run test`; 14 arquivos passaram, 47 testes passaram.
- 2026-06-03: Executado `npm.cmd run build`; passou com `postbuild` e `Prerendered 18 public route HTML files.`
- 2026-06-03: Criado resumo de evidencia `docs/evidence/prd-seo-public-hubs-gradient-2026-06-03.md`.
- 2026-06-03: Reestruturadas `/sobre` e `/contato` para remover gradientes publicos diretos, `transition-all`, sombras pesadas, cards repetidos e acentos azul/roxo em blocos publicos.
- 2026-06-03: Recriados `TeamSection`, `InstitutionalTestimonials` e `TimelineSection` em texto limpo, sem nomes, fotos, emails, depoimentos, logos, metricas ou encoding quebrado que pudessem gerar sinais ficticios de confianca.
- 2026-06-03: Ajustado `ImpactMetrics` para superficie neutra com divisorias, mantendo beneficios operacionais sem metricas inventadas.
- 2026-06-03: Removidos fallbacks visuais `Carregando...` das secoes lazy de `/sobre`, eliminando o achado de baixo contraste no scan renderizado.
- 2026-06-03: Executado `npx.cmd impeccable detect` nos arquivos fonte de `/sobre`, `/contato` e componentes institucionais; sem achados reportados.
- 2026-06-03: Executado `rg` no recorte `/sobre` e `/contato` para `bg-gradient`, `gradient-`, `bg-clip-text`, `text-transparent`, `transition-all`, `hover:shadow`, `rounded-2xl`, `rounded-3xl`, `purple`, `blue-`, `from-primary`, `to-secondary`, `shadow-2xl`, `backdrop-blur`, `animate-pulse`, `Ana Silva`, `Roberto Mendes`, `40%`, `24/7` e `centenas de construtoras`; sem ocorrencias.
- 2026-06-03: Executado `curl.exe -I` em `/sobre` e `/contato`; as duas rotas retornaram HTTP 200 com `text/html`.
- 2026-06-03: Executado `npx.cmd impeccable detect` renderizado em `/sobre` e `/contato`; resultado final ficou em 10 achados. Restam `cramped-padding` generico por rota e sinais globais recorrentes de `ai-color-palette`, `gradient-text` e `layout-transition`.
- 2026-06-03: Executado `npm.cmd run lint`; passou com 31 warnings preexistentes e 0 erros. Executado `npm.cmd run test`; 14 arquivos passaram, 47 testes passaram.
- 2026-06-03: Executado `npm.cmd run build`; passou com `postbuild` e `Prerendered 18 public route HTML files.`
- 2026-06-03: Criado resumo de evidencia `docs/evidence/prd-seo-sobre-contato-public-cleanup-2026-06-03.md`.
- 2026-06-03: Executado scan consolidado em 13 URLs publicas antes deste ciclo; baseline imediato ficou em 104 achados renderizados, com residuos concentrados em `/documentacao`, `/status`, `/atualizacoes`, `/preco` e sinais globais de bundle/CSS.
- 2026-06-03: Reestruturadas novamente `/documentacao`, `/status` e `/atualizacoes` para layout publico minimalista, sem `Card`, `Badge`, `Tabs`, badges coloridos, versoes/datas antigas, uptime ficticio, latencia ficticia ou metricas sem fonte.
- 2026-06-03: Criado `src/hooks/useMarketingSurface.ts` para aplicar `body.marketing-surface` em paginas publicas especificas, garantindo tipografia publica mesmo quando a rota nao depender exclusivamente de `LandingNavigation`.
- 2026-06-03: Executado `npx.cmd impeccable detect src\pages\Documentacao.tsx src\pages\Status.tsx src\pages\Atualizacoes.tsx`; sem achados reportados nos arquivos fonte alterados.
- 2026-06-03: Executado `rg` nos tres arquivos para `Card`, `CardHeader`, `CardTitle`, `Badge`, gradientes, `transition-all`, `rounded-2xl`, `hover:shadow`, datas/versoes antigas e conteudos ficticios; restaram apenas usos textuais benignos de `versao`.
- 2026-06-03: Executado `curl.exe -I` em `/documentacao`, `/status` e `/atualizacoes`; as tres rotas retornaram HTTP 200 com `text/html`.
- 2026-06-03: Scan renderizado focado em `/documentacao`, `/status` e `/atualizacoes` caiu de 18 para 16 achados apos `useMarketingSurface`; alertas de fonte unica nao reapareceram nas rotas focadas.
- 2026-06-03: Scan consolidado de 13 URLs publicas depois da reestruturacao e antes do hook caiu de 104 para 93 achados; residuos globais permanecem documentados por envolverem CSS/bundle compartilhado e possiveis fontes do app autenticado.
- 2026-06-03: Executado `npm.cmd run lint`; passou com 31 warnings preexistentes e 0 erros. Executado `npm.cmd run test`; 14 arquivos passaram, 47 testes passaram.
- 2026-06-03: Executado `npm.cmd run build`; passou com `postbuild` e `Prerendered 18 public route HTML files.`
- 2026-06-03: Criado resumo de evidencia `docs/evidence/prd-seo-docs-status-updates-2026-06-03.md`.
- 2026-06-03: Proxima execucao recomendada: investigar com evidencia DOM o `nested-cards` residual de `/status`, depois atacar `/preco` e seus componentes publicos de pricing; manter intocado o layout autenticado do app.
- 2026-06-04: Investigado o `nested-cards` residual de `/status` com evidencia DOM; o problema vinha de selos com borda dentro de secoes publicas tambem bordadas.
- 2026-06-04: Ajustado `src/pages/Status.tsx` para trocar os selos com borda por rotulos tipograficos simples. Scan renderizado focado confirmou que `nested-cards` saiu de `/status`.
- 2026-06-04: Reestruturado `src/components/ui/pricing.tsx` para remover `framer-motion`, confetti, `transition-all`, sombras fortes, escala visual, `ring` decorativo e imports nao usados no carousel publico de planos.
- 2026-06-04: Ajustado `src/components/pricing/PricingHero.tsx` para remover badge do hero de `/preco`, mantendo rotulo tipografico simples.
- 2026-06-04: Ajustado `src/components/pricing/FaqSection.tsx` para remover promessa publica de chat, gerente dedicado e condicoes nao validadas; copy ficou objetiva para planos, faturamento e suporte.
- 2026-06-04: Ajustado `src/pages/Preco.tsx` para reduzir skeleton publico de `rounded-2xl` para `rounded-lg` e normalizar CTAs/textos da rota de precos.
- 2026-06-04: Executado `npx.cmd impeccable detect` nos arquivos fonte de `/status` e `/preco`; sem achados reportados nos arquivos alterados.
- 2026-06-04: Executado `npx.cmd impeccable detect http://127.0.0.1:5173/status http://127.0.0.1:5173/preco`; resultado final ficou em 8 achados. `/status` e `/preco` nao reportaram mais `nested-cards`; restaram `cramped-padding` e sinais globais de `gradient-text`/`layout-transition`.
- 2026-06-04: Executado scan consolidado em 13 URLs publicas locais; resultado caiu de 93 para 67 achados. Residuos concentrados em `/home`, artigo do blog, legal, `cramped-padding`, e sinais globais de CSS/bundle.
- 2026-06-04: DOM smoke em `/status` confirmou H1 unico, `body.marketing-surface`, ausencia de overflow horizontal e `nestedBorderedCount=0`. DOM smoke em `/preco` confirmou H1 unico, `body.marketing-surface` e ausencia de overflow horizontal.
- 2026-06-04: Executado `curl.exe -I` em `/status` e `/preco`; ambas retornaram HTTP 200 com `text/html`.
- 2026-06-04: Executado `npm.cmd run lint -- --quiet`; passou. Executado `npm.cmd run test`; 16 arquivos passaram, 53 testes passaram.
- 2026-06-04: `npm.cmd run build` e `npx.cmd vite build` ficaram bloqueados por erro fora do escopo PRD_SEO em arquivos de admin: `AdminEventTimeline` sem default export e conflito de casing entre `AdminEventTimeline.ts` e `adminEventTimeline.ts`. Nenhum arquivo de admin foi alterado para respeitar o comando de nao mexer no layout interno do app.
- 2026-06-04: Criado resumo de evidencia `docs/evidence/prd-seo-status-pricing-depth-2026-06-04.md`.
- 2026-06-04: Proxima execucao recomendada: atacar os `nested-cards` restantes em `/home`, artigo do blog e legal com evidencia DOM por rota antes de editar; manter os residuos globais documentados ate existir isolamento publico seguro.
- 2026-06-04: Localizada a pasta `fotos criativo` na raiz do workspace, contendo 416 imagens reais de obras.
- 2026-06-04: Criada folha de contato `docs/evidence/prd-seo-fotos-criativo-contact-sheet-2026-06-04.jpg` para triagem visual dos assets reais.
- 2026-06-04: Criado diretorio publico `public/marketing/obras-reais/` como local propicio para assets de marketing versionaveis e otimizados, sem referenciar originais pesados diretamente.
- 2026-06-04: Geradas quatro imagens web otimizadas a partir de `fotos criativo`: `estrutura-metalica-aerea.jpg` (249 KB), `cobertura-metalica-canteiro.jpg` (319 KB), `equipe-cobertura-metalica.jpg` (334 KB) e `quadra-coberta-finalizada.jpg` (163 KB).
- 2026-06-04: Adicionado `public/marketing/obras-reais/README.md` com origem, uso publico e regra operacional para nao publicar originais pesados.
- 2026-06-04: Atualizada a home publica para usar fotos reais em `HeroSectionNew`, `VisualWorkflowSection` e `BenefitsSection`, mantendo texto em superficies solidas para evitar baixo contraste.
- 2026-06-04: Atualizada `/sobre` para substituir mockup antigo por foto real de obra finalizada e usar `seoPages.sobre` no lugar de SEO hardcoded com canonical antigo.
- 2026-06-04: Atualizados `src/config/seo.ts`, `index.html` e `scripts/prerender-public-routes.mjs` para usar `https://www.metaconstrutor.app.br/marketing/obras-reais/estrutura-metalica-aerea.jpg` como imagem padrao de Open Graph/Twitter, mantendo `logo-meta-construtor.png` apenas como `LOGO_IMAGE` no JSON-LD de organizacao.
- 2026-06-04: Executado `npx.cmd impeccable detect` nos arquivos fonte alterados de home, sobre, SEO, HTML e prerender; sem achados reportados.
- 2026-06-04: Smoke DOM em `/home` confirmou H1 unico, `body.marketing-surface`, imagens reais no DOM, `og:image` real, canonical `https://www.metaconstrutor.app.br/home` e ausencia de overflow horizontal.
- 2026-06-04: Smoke DOM em `/sobre` confirmou H1 unico, imagem real carregada, `og:image` real, canonical `https://www.metaconstrutor.app.br/sobre` e ausencia de overflow horizontal.
- 2026-06-04: Executado `curl.exe -I` em `/home`, `/sobre` e `/marketing/obras-reais/estrutura-metalica-aerea.jpg`; todos retornaram HTTP 200 e a imagem retornou `Content-Type: image/jpeg`.
- 2026-06-04: Executado `npx.cmd impeccable detect http://127.0.0.1:5173/home http://127.0.0.1:5173/sobre`; resultado final ficou em 19 achados, sem os novos problemas de contraste apos retirar a foto de fundo do texto.
- 2026-06-04: Executado scan consolidado em 13 URLs publicas locais; resultado caiu de 67 para 65 achados. Residuos seguem concentrados em `cramped-padding`, `nested-cards`, `gradient-text` e `layout-transition`.
- 2026-06-04: Executado `npm.cmd run lint -- --quiet`; passou. Executado `npm.cmd run test`; 17 arquivos passaram, 58 testes passaram.
- 2026-06-04: Executado `npm.cmd run build`; passou com `postbuild`, sitemap e `Prerendered 18 public route HTML files.`
- 2026-06-04: Confirmado em `dist/home/index.html` e `dist/sobre/index.html` que canonical, `og:image` e `twitter:image` usam o dominio/prova visual corretos.
- 2026-06-04: Criado resumo de evidencia `docs/evidence/prd-seo-real-photos-public-pages-2026-06-04.md`.
- 2026-06-04: Proxima execucao recomendada: continuar reducao de `nested-cards` em `/home`, artigo do blog e paginas legais preservando as fotos reais como prova visual publica.
- 2026-06-04: Removidos `nested-cards` residuais de `/home` achatando bordas/superficies em `HeroSectionNew`, `VisualWorkflowSection`, `ModernFeaturesSection`, `StatsSection`, `CaseStudies`, `BenefitsSection`, `EnhancedTestimonials`, `VideoDemo` e `IntegrationsBanner`, preservando as fotos reais de obras.
- 2026-06-04: `IntegrationsBanner` deixou de usar `Badge` com borda dentro de secao publica e passou a rotulos tipograficos simples, eliminando os ultimos `nested-cards` renderizados da home.
- 2026-06-04: Removidos `nested-cards` do artigo `/blog/como-estruturar-rdo` achatando categoria, aside e CTA final; `LegalPageLayout` tambem passou a usar eyebrow textual simples em vez de pill com borda.
- 2026-06-04: Executado `npx.cmd impeccable detect` nos arquivos fonte alterados da home, artigo, legal e footer publico; sem achados reportados nos arquivos fonte.
- 2026-06-04: Executado scan renderizado em `/home`; resultado caiu de 15 para 9 achados e `nested-cards` foi removido.
- 2026-06-04: Executado scan renderizado em `/blog/como-estruturar-rdo` e `/legal/privacidade`; resultado final ficou em 8 achados, sem `nested-cards`.
- 2026-06-04: Executado scan consolidado em 13 URLs publicas locais; resultado caiu de 65 para 57 achados e nenhum `nested-cards` reapareceu. Residuos restantes: `cramped-padding`, `gradient-text` e `layout-transition`.
- 2026-06-04: Executado `npm.cmd run lint -- --quiet`; passou. Executado `npm.cmd run test`; 18 arquivos passaram, 61 testes passaram.
- 2026-06-04: Executado `npm.cmd run build`; passou com `postbuild`, sitemap e `Prerendered 18 public route HTML files.`
- 2026-06-04: Criado resumo de evidencia `docs/evidence/prd-seo-nested-cards-final-public-2026-06-04.md`.
- 2026-06-04: Proxima execucao recomendada: investigar `cramped-padding` restante com evidencia DOM por rota; manter `gradient-text` e `layout-transition` documentados como residuos globais ate existir isolamento publico seguro, sem alterar o layout autenticado do app.
- 2026-06-04: Investigado `cramped-padding` restante com evidencia DOM em rotas publicas; achados corrigiveis vinham de footer publico, hero sections independentes, grids publicos da home, linhas bordadas do hero/video, FAQ publica de precos e listas de ajuda/status/atualizacoes.
- 2026-06-04: Ajustados `FooterSection`, `HeroSectionNew`, `StatsSection`, `CaseStudies`, `EnhancedTestimonials`, `VideoDemo`, `FaqSection`, `src/components/ui/pricing.tsx`, `CentralAjuda`, `APIPage`, `Carreiras`, `Status` e `Atualizacoes` para adicionar inset real em superficies publicas com fundo/borda.
- 2026-06-04: Executado `npx.cmd impeccable detect` nos arquivos fonte alterados deste ciclo; sem achados reportados.
- 2026-06-04: Executado scan consolidado em 13 URLs publicas locais; resultado caiu de 57 para 53 achados. `nested-cards` nao reapareceu; residuos restantes incluem wrappers raiz/full-width, `gradient-text` e `layout-transition` globais.
- 2026-06-04: Executado `npm.cmd run lint -- --quiet`; passou. Executado `npm.cmd run test`; 19 arquivos passaram, 62 testes passaram.
- 2026-06-04: Executado `npm.cmd run build`; passou com `postbuild`, sitemap e `Prerendered 18 public route HTML files.`
- 2026-06-04: Criado resumo de evidencia `docs/evidence/prd-seo-cramped-padding-public-2026-06-04.md`.
- 2026-06-04: Proxima execucao recomendada: continuar somente em residuos com seletor DOM confiavel e arquivo publico claro; nao perseguir `#root`, `main.min-h-screen.bg-background`, `gradient-text` ou `layout-transition` sem isolamento publico seguro.
- 2026-06-04: Investigados residuos de `gradient-text`, `layout-transition` e `cramped-padding` com DOM em rotas publicas. `gradient-text` nao apresentou elemento renderizado com `background-clip:text`; segue documentado como residuo de CSS/bundle compartilhado.
- 2026-06-04: Corrigida a navegacao publica `LandingNavigation` para substituir `duration-*` sem propriedade por `transition-opacity`/`transition-colors`, removendo `transition: all` dos elementos renderizados da navegacao.
- 2026-06-04: Aplicado `useMarketingSurface` em `/api`, `/central-ajuda` e `/carreiras`; DOM confirmou `body.marketing-surface`, H1 unico, tipografia publica e ausencia de overflow horizontal.
- 2026-06-04: Adicionado inset minimo `p-2` em wrappers publicos com `bg-background` de `/home`, `/preco`, `/sobre`, `/contato`, `/api`, `/central-ajuda`, `/carreiras`, `/documentacao`, `/status` e `/atualizacoes`.
- 2026-06-04: Ajustados `FAQSection` e `src/components/ui/expandable-chat.tsx` para reduzir padding apertado real na FAQ da home e remover `transition-all` do chat flutuante publico de `/contato`.
- 2026-06-04: Executado `npx.cmd impeccable detect` nos arquivos fonte alterados deste ciclo; sem achados reportados.
- 2026-06-04: Executado scan consolidado em 13 URLs publicas locais; resultado caiu de 53 para 46 achados. `nested-cards` nao reapareceu.
- 2026-06-04: Executado `npm.cmd run lint -- --quiet`; passou. Executado `npm.cmd run test`; 19 arquivos passaram, 62 testes passaram.
- 2026-06-04: Executado `npm.cmd run build`; passou com `postbuild`, sitemap e `Prerendered 18 public route HTML files.`
- 2026-06-04: Criado resumo de evidencia `docs/evidence/prd-seo-public-surface-residuals-2026-06-04.md`.
- 2026-06-04: Proxima execucao recomendada: nao perseguir `gradient-text` e `layout-transition` sem seletor DOM publico reproduzivel; revisar `cramped-padding` restante somente quando o DOM apontar container publico real, nao `#root` ou superficie full-width intencional.
- 2026-06-05: Continuado ciclo de limpeza publica com foco em residuos renderizados de `cramped-padding`, chat publico de `/contato` e pricing publico de `/preco`, mantendo o layout autenticado fora do escopo.
- 2026-06-05: Adicionado inset minimo em secoes full-width de home, preco, sobre e contato (`HeroSectionNew`, `StatsSection`, `CaseStudies`, `EnhancedTestimonials`, `IntegrationsBanner`, `BenefitsSection`, `FAQSection`, `VideoDemo`, `PricingHero`, `FaqSection`, `Preco`, `Sobre` e `Contato`).
- 2026-06-05: Corrigido o chat publico de `/contato`: titulo interno mudou de `h1` para `h2`, painel ganhou padding proprio, `overflow-hidden` foi removido e a pagina ganhou `h2` antes dos canais oficiais para evitar salto de heading.
- 2026-06-05: Ajustado `SafeSuspense` para respeitar `fallback={null}` e aplicado esse fallback apenas nas rotas publicas de marketing/documentacao/legal em `PerformanceOptimizedApp`, evitando o fallback textual `Carregando...` nas paginas publicas renderizadas.
- 2026-06-05: Achatado o selo "Mais Popular" em `src/components/ui/pricing.tsx`, removendo borda dentro do card do plano; `/preco` isolado caiu para 3 achados e deixou de reportar `nested-cards`, `cramped-padding` e `overused-font`.
- 2026-06-05: `/contato` isolado caiu para 3 achados e deixou de reportar `low-contrast`, `skipped-heading`, `line-length` e `clipped-overflow-container`. Smoke DOM confirmou `h1=1`, `hasCarregando=false`, `marketingSurface=true` e `overflow=0`.
- 2026-06-05: Executado scan consolidado em 13 URLs publicas locais; resultado caiu de 46 para 45 achados. Residuos restantes seguem concentrados em `gradient-text`, `layout-transition`, `cramped-padding` de wrappers/full-width e heuristica tipografica intermitente em `/sobre`.
- 2026-06-05: Executado `npm.cmd run lint -- --quiet`; passou. Executado `npm.cmd run test`; 20 arquivos passaram, 66 testes passaram.
- 2026-06-05: Executado `npm.cmd run build`; passou com `postbuild`, sitemap e `Prerendered 18 public route HTML files.` Avisos restantes: `color-adjust` depreciado e import dinamico/estatico de Supabase, ambos preexistentes.
- 2026-06-05: Criado resumo de evidencia `docs/evidence/prd-seo-public-padding-chat-pricing-2026-06-05.md`.
- 2026-06-05: Proximo comando recomendado: investigar exclusivamente o `cramped-padding` restante de `/home` com DOM selector mais especifico que ignore `#root`, overlays fixos e superficies intencionais; se nao houver seletor publico real, registrar como falso positivo e avancar para revisao de metadados/copy SEO.
- 2026-06-05: Investigado o `cramped-padding` restante de `/home` com DOM selector especifico, ignorando `#root`, overlays e superficies sem fundo/borda real. A origem corrigivel eram CTAs publicos com fundo/borda e padding vertical computado como `0px`.
- 2026-06-05: Ajustados os CTAs publicos de `HeroSectionNew`, `VideoDemo`, `CaseStudies`, `EnhancedTestimonials` e `BenefitsSection` para incluir `py-3`, preservando a estrutura visual e dando padding vertical real aos botoes.
- 2026-06-05: Executado `npx.cmd impeccable detect` nos componentes alterados da home; sem achados reportados em fonte.
- 2026-06-05: Executado `npx.cmd impeccable detect http://127.0.0.1:5173/home`; `/home` caiu de 7 para 3 achados, removendo todos os `cramped-padding`. Restaram apenas `gradient-text` x2 e `layout-transition` x1.
- 2026-06-05: Smoke DOM da home confirmou `h1=1`, `body.marketing-surface=true`, `overflow=0` e CTAs publicos com padding computado `12px` no topo e na base.
- 2026-06-05: Executado scan consolidado em 13 URLs publicas locais; resultado caiu de 45 para 39 achados. Todas as rotas do consolidado agora reportam somente os 3 residuos globais recorrentes: `gradient-text` x2 e `layout-transition` x1.
- 2026-06-05: Executado `npm.cmd run lint -- --quiet`; passou. Executado `npm.cmd run test`; 20 arquivos passaram, 66 testes passaram.
- 2026-06-05: Executado `npm.cmd run build`; passou com `postbuild`, sitemap e `Prerendered 18 public route HTML files.` Avisos restantes: `color-adjust` depreciado e import dinamico/estatico de Supabase, ambos preexistentes.
- 2026-06-05: Criado resumo de evidencia `docs/evidence/prd-seo-home-cta-padding-final-2026-06-05.md`.
- 2026-06-05: Proximo comando recomendado: investigar `gradient-text` com busca CSS/DOM focada em `bg-clip-text`, `text-transparent`, `background-clip: text` e classes geradas; corrigir apenas se houver seletor publico renderizado claro. Se a origem for CSS/bundle compartilhado sem elemento publico, registrar como residuo global e avancar para metadados/copy SEO.
- 2026-06-05: Investigado `gradient-text` com busca fonte e DOM computado nas 13 rotas publicas. As ocorrencias fonte de `bg-clip-text`/`text-transparent` ficaram em `RecuperarEmail` e `FluidMenuDemo`, fora das paginas publicas de marketing; o DOM publico retornou `gradientItems=0` em todas as rotas.
- 2026-06-05: Encontrado e corrigido um resíduo publico real de `layout-transition` na FAQ de `/preco`; `FaqSection` passou a usar `transition-colors duration-150` no trigger e `Accordion` removeu `transition-all` do trigger/content, mantendo as animacoes de abertura existentes.
- 2026-06-05: DOM consolidado das 13 rotas publicas confirmou `h1=1`, `body.marketing-surface=true`, `overflow=0`, `gradientItems=0` e `transitionItems=[]` em todas as rotas apos o ajuste.
- 2026-06-05: Executado `npx.cmd impeccable detect src/components/ui/accordion.tsx src/components/pricing/FaqSection.tsx`; sem achados reportados nos arquivos alterados.
- 2026-06-05: Executado scan consolidado Impeccable em 13 URLs publicas locais; resultado permaneceu em 39 achados globais (`gradient-text` x2 e `layout-transition` x1 por rota), mas sem seletor DOM publico reproduzivel. Classificado como residuo global/heuristico fora de acao segura no escopo publico atual.
- 2026-06-05: Executado `npm.cmd run lint -- --quiet`; passou. Executado `npm.cmd run test`; 21 arquivos passaram, 69 testes passaram.
- 2026-06-05: Executado `npm.cmd run build`; passou com `postbuild`, sitemap e `Prerendered 18 public route HTML files.` Avisos restantes: `color-adjust` depreciado e import dinamico/estatico de Supabase, ambos preexistentes.
- 2026-06-05: Criado resumo de evidencia `docs/evidence/prd-seo-gradient-layout-residuals-2026-06-05.md`.
- 2026-06-05: Proximo comando recomendado: avancar para revisao SEO de metadados e copy publica das rotas restantes, priorizando title, description, canonical, OG/Twitter e texto acima da dobra. Nao perseguir `gradient-text`/`layout-transition` sem seletor DOM publico reproduzivel.
- 2026-06-05: Centralizados metadados publicos de `Contato`, `APIPage`, `Status`, `Atualizacoes`, `CentralAjuda`, `Documentacao` e `Carreiras` para usar `seoPages.*`, removendo SEO hardcoded e corrigindo canonical antigo de `/contato`.
- 2026-06-05: Removidos do `index.html` os metadados SEO especificos de rota que ficavam antes do Helmet e causavam description/OG genericos em rotas publicas renderizadas no cliente.
- 2026-06-05: Criado `seoBlogArticles` em `src/config/seo.ts` e ajustado `BlogArticle` para usar SEO por slug; `/blog/como-estruturar-rdo` deixou de herdar title/description/canonical do indice `/blog`.
- 2026-06-05: Sincronizado `scripts/prerender-public-routes.mjs` com o catalogo central para `/sobre`, `/documentacao`, `/api`, `/status`, `/atualizacoes` e `/carreiras`, mantendo descricoes honestas sobre limites reais de API, webhooks, status e vagas.
- 2026-06-05: Smoke DOM em 13 rotas publicas confirmou `descriptionCount=1`, `canonicalCount=1`, `ogTitleCount=1`, canonical no dominio `https://www.metaconstrutor.app.br`, H1 unico e ausencia de overflow horizontal.
- 2026-06-05: Leitura direta dos HTMLs prerenderizados em `dist` confirmou description/canonical/OG unicos em `/home`, `/contato`, `/documentacao`, `/api`, `/status`, `/atualizacoes`, `/carreiras` e `/blog/como-estruturar-rdo`.
- 2026-06-05: Executado `npx.cmd impeccable detect` nos arquivos alterados de SEO/copy/prerender; sem achados reportados.
- 2026-06-05: Executado `npm.cmd run lint -- --quiet`; passou. Executado `npm.cmd run test`; 21 arquivos passaram, 69 testes passaram.
- 2026-06-05: Executado `npm.cmd run build`; passou com `postbuild`, sitemap e `Prerendered 18 public route HTML files.` Avisos restantes: `color-adjust` depreciado e import dinamico/estatico de Supabase, ambos preexistentes.
- 2026-06-05: Criado resumo de evidencia `docs/evidence/prd-seo-public-metadata-centralization-2026-06-05.md`.
- 2026-06-05: Proximo comando recomendado: revisar copy acima da dobra nas rotas publicas ainda genericas (`/contato`, `/central-ajuda`, `/documentacao`, `/api`, `/status`, `/atualizacoes`, `/carreiras`) para alinhar H1, subtitulo e CTA ao mesmo vocabulario operacional dos metadados, sem alterar layout autenticado.
- 2026-06-05: Revisada a copy acima da dobra de `/contato`, `/central-ajuda`, `/documentacao`, `/api`, `/status`, `/atualizacoes` e `/carreiras` para responder com mais clareza quem usa a pagina, qual decisao ela apoia e qual limite operacional deve ser entendido.
- 2026-06-05: Ajustados H1/subtitulos publicos para vocabulario de obra, RDO, documentos, equipe, integracoes reais, status sem metricas ficticias e vagas sem anuncio falso.
- 2026-06-05: Alinhadas descriptions em `src/config/seo.ts` e `scripts/prerender-public-routes.mjs` para `/contato`, `/central-ajuda`, `/documentacao`, `/api` e `/atualizacoes`.
- 2026-06-05: Smoke DOM em sete rotas publicas alteradas confirmou `h1Count=1`, `descriptionCount=1`, canonical/OG no dominio `https://www.metaconstrutor.app.br`, `body.marketing-surface=true` e `overflow=0` no viewport mobile.
- 2026-06-05: Executado `npx.cmd impeccable detect` nos arquivos alterados de copy/SEO/prerender; sem achados reportados.
- 2026-06-05: Executado `npm.cmd run lint -- --quiet`; passou. Executado `npm.cmd run test`; 22 arquivos passaram, 72 testes passaram.
- 2026-06-05: Executado `npm.cmd run build`; passou com `postbuild`, sitemap e `Prerendered 18 public route HTML files.` Avisos restantes: `color-adjust` depreciado e import dinamico/estatico de Supabase, ambos preexistentes.
- 2026-06-05: Criado resumo de evidencia `docs/evidence/prd-seo-public-hero-copy-2026-06-05.md`.
- 2026-06-05: Proximo comando recomendado: revisar consistencia entre copy publica e snippets dos artigos restantes do blog (`/blog/documentos-por-obra` e `/blog/checklist-qualidade-obra`), confirmando title, description, canonical, H1 unico, texto acima da dobra e prerender HTML.
- 2026-06-06: Revisados os artigos publicos `/blog/documentos-por-obra` e `/blog/checklist-qualidade-obra` como etapa final dos artigos restantes do blog, mantendo o escopo em paginas publicas de publicidade.
- 2026-06-06: Smoke DOM local confirmou `title`, `description`, canonical, OG, JSON-LD, H1 unico, resumo acima da dobra, `body.marketing-surface=true` e `overflow=0` em viewport mobile para os dois artigos.
- 2026-06-06: Leitura direta de `dist/blog/documentos-por-obra/index.html` e `dist/blog/checklist-qualidade-obra/index.html` confirmou description/canonical/OG unicos e JSON-LD nos HTMLs prerenderizados.
- 2026-06-06: Executado `npx.cmd impeccable detect src/content/blogArticles.ts src/pages/BlogArticle.tsx src/config/seo.ts scripts/prerender-public-routes.mjs`; sem achados reportados.
- 2026-06-06: Executado `npm.cmd run lint -- --quiet`; passou. Executado `npm.cmd run test`; 23 arquivos passaram, 75 testes passaram.
- 2026-06-06: Executado `npm.cmd run build`; passou com `postbuild`, sitemap e `Prerendered 18 public route HTML files.` Avisos restantes: `color-adjust` depreciado e import dinamico/estatico de Supabase, ambos preexistentes.
- 2026-06-06: Criado resumo de evidencia `docs/evidence/prd-seo-blog-remaining-articles-2026-06-06.md`.
- 2026-06-06: Proximo comando recomendado: revisar o indice `/blog` como hub SEO, validando densidade de links internos para artigos, consistencia entre cards e snippets, breadcrumbs/Schema e copy acima da dobra, sem alterar o layout autenticado do app.
