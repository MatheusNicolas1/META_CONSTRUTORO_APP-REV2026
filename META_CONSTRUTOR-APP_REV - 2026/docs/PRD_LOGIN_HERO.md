# PRD_LOGIN_HERO - Seção Hero Personalizada para Login com Reconhecimento de Lead

**Data de criação:** 2026-06-12  
**Produto:** Meta Construtor Web  
**Status:** Implementado  
**Objetivo:** Implementar seção Hero dinâmica na tela de login que reconhece leads pré-cadastrados pelo e-mail digitado e exibe conteúdo personalizado com personagem 3D animado no lado esquerdo e cards interativos no lado direito.

---

## 1. Visão Geral

A tela de login atual (`/login`) exibe um formulário de entrada + hero image estática genérica. A feature de reconhecimento de lead detecta, em tempo real via Edge Function `lookup-lead`, se o e-mail digitado pertence a um lead pré-cadastrado (tabela `leads_prospeccao` no Supabase). Quando detectado, o hero muda automaticamente para:

|- **Lado esquerdo (40%):** Imagem/imersão visual — background com foto de operário de capacete futurista laranja (referência visual) ou cena Spline 3D animada  
|- **Lado direito (60%):** Navbar + "Que bom que você voltou!" + cartão branco de login (avatar, nome, email, botão "Continuar") + ações secundárias

### 1.1 Modos de Exibição

| Modo | Gatilho | Comportamento |
|------|---------|---------------|
| `default` | Nenhum e-mail digitado ou e-mail não encontrado | Hero padrão: personagem 3D + descrição do produto + cards genéricos |
| `lead` | E-mail reconhecido em `leads_prospeccao` | Saudação personalizada + avatar com inicial + nome da empresa + cards de funcionalidades |
| `saved` | (Futuro) Conta salva no dispositivo | Cards de acesso rápido + trocar conta |

---

## 2. Arquitetura

### 2.1 Componentes

```
Login.tsx
├── SEO
└── SignInPage (sign-in.tsx)
    ├── Formulário (esquerda/mobile)
    └── AuthHeroSection (auth-hero-section.tsx) [NOVO]
        ├── Split-screen: esquerda 40% + direita 60%
        ├── Esquerda: background imagem capacete futurista / Spline 3D
        ├── Direita: Navbar (logo META CONSTRUTOR + links + botão Criar)
        ├── Direita: Título "Que bom que você voltou!" + subtítulo
        ├── Direita: LoginCard (avatar + nome + email + botão Continuar)
        ├── Direita: OtherAccountButton (+ Continuar com outra conta)
        ├── Direita: RemoveAccountLink (Remover conta)
        └── Fundo: laranja queimado (#b06d46)
```

### 2.2 Fluxo de Dados

```
1. Usuário digita e-mail no campo
2. useLeadDetection(email) com debounce 600ms
3. → POST /functions/v1/lookup-lead { email }
4. Edge Function consulta leads_prospeccao no Supabase
5. Retorna { found, lead: { nome, email, site, estado, cidade } }
6. SignInPage recebe leadFound + lead
7. Passa para AuthHeroSection via prop mode='lead' + lead
8. AuthHeroSection renderiza conteúdo personalizado
```

---

## 3. Layout e Design

### 3.1 Estrutura Visual (Desktop)

```
┌─────────────────────────────────────────────────┐
│  [Logo]           [Funcionalidades] [Planos]     │  ← Header (em SignInPage)
│                                                   │
│  ┌──────────────────────┬────────────────────────┐│
│  │                      │  ┌──────────────────┐ ││
│  │   Personagem 3D      │  │  Avatar + Nome   │ ││
│  │   (Spline)           │  │  "Que bom que    │ ││
│  │   Capacete Futurista │  │   você voltou!"  │ ││
│  │   Laranja/Preto     │  │                  │ ││
│  │                      │  ├──────────────────┤ ││
│  │                      │  │ [RDO] [Dashboard]│ ││
│  │                      │  │ [Equipe] [Segur] │ ││
│  │                      │  │  Cards 2x2       │ ││
│  │                      │  ├──────────────────┤ ││
│  │                      │  │ • Conta pré-     │ ││
│  │                      │  │   cadastrada     │ ││
│  │                      │  └──────────────────┘ ││
│  └──────────────────────┴────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### 3.2 Paleta de Cores

| Elemento | Cor |
|----------|-----|
| Background da Hero | Gradiente `from-amber-400 via-orange-500 to-orange-700` |
| Card container | `bg-black/[0.96]` (quase preto) |
| Cards de features | `bg-white/10 backdrop-blur-md border-white/20` (translúcidos) |
| Avatar lead | Gradiente `from-purple-600 to-indigo-800` |
| Avatar genérico | Gradiente `from-blue-500 to-indigo-700` |
| Acento | `construction-orange` (#ff7e5f) |
| Texto | White em várias opacidades (100%, 70%, 50%, 60%) |

### 3.3 Responsividade

- **Desktop (md+):** Layout horizontal com Spline 3D à esquerda (60%) + cards à direita (40%)
- **Mobile (<md):** `hidden md:block` — Hero não aparece; apenas formulário ocupa tela cheia
- O formulário de login fica sempre no lado esquerdo (desktop) ou topo (mobile)
- No mobile, o banner de lead detectado aparece acima do formulário (já implementado)

---

## 4. Cards de Funcionalidades

### 4.1 Modo Lead

| Card | Ícone | Título | Descrição |
|------|-------|--------|-----------|
| 1 | ClipboardCheck | RDO Online | Registre diários de obra digitalmente |
| 2 | TrendingUp | Dashboard | Acompanhe métricas da sua obra |
| 3 | Users | Equipe | Gerencie sua equipe no local |
| 4 | Shield | Segurança | DDS e documentos de segurança |

### 4.2 Modo Saved (Futuro)

| Card | Ícone | Título | Descrição |
|------|-------|--------|-----------|
| 1 | BarChart3 | Relatórios | Acesse seus relatórios recentes |
| 2 | FileText | Documentos | Documentos da sua obra atual |
| 3 | Building2 | Obras | Suas obras em andamento |
| 4 | HardHat | Checklist | Checklists pendentes |

### 4.3 Modo Default

| Card | Ícone | Título | Descrição |
|------|-------|--------|-----------|
| 1 | ClipboardCheck | RDO Digital | Diário de obra online |
| 2 | Users | Equipe | Gestão de colaboradores |
| 3 | TrendingUp | Métricas | Dashboard em tempo real |
| 4 | Shield | Segurança | Documentos e DDS |

---

## 5. Dependências Técnicas

### 5.1 NPM Packages

- `@splinetool/runtime` — ✅ Já instalado
- `@splinetool/react-spline` — ✅ Já instalado
- `framer-motion` — ✅ Já instalado
- `lucide-react` — ✅ Já instalado (usado para ícones dos cards)

### 5.2 Componentes Existentes

- `splite.tsx` — ✅ Componente SplineScene com lazy loading
- `spotlight.tsx` — ✅ Componente Spotlight com efeito SVG
- `card.tsx` — ✅ Componentes Card, CardHeader, CardContent
- `useLeadDetection.ts` — ✅ Hook de detecção de lead
- `sign-in.tsx` — ✅ Componente SignInPage principal (precisa ser modificado)

### 5.3 Edge Function

- `lookup-lead` — ✅ Criada e deployada no Supabase
- Endpoint: `POST {SUPABASE_URL}/functions/v1/lookup-lead`
- Tabela consultada: `leads_prospeccao` (586 registros)

---

## 6. Etapas de Implementação

### Fase 1 — Componente Hero (✅ CONCLUÍDO)

- [x] Criar `auth-hero-section.tsx` com estrutura de layout
- [x] Implementar SplineScene + Spotlight
- [x] Implementar FeatureCard com ícones lucide-react
- [x] Implementar UserGreetingCard para lead reconhecido
- [x] Implementar QuickActionButton para modo saved
- [x] Implementar 3 modos de exibição: `lead`, `saved`, `default`

### Fase 2 — Integração (🔄 PENDENTE)

- [ ] Modificar `sign-in.tsx` para usar `AuthHeroSection` no lugar do SplineHeroSection atual
- [ ] Conectar `leadFound` + `lead` ao componente
- [ ] Testar fluxo completo: digitar email → detectar lead → mostrar hero personalizado
- [ ] Testar edge case: email não encontrado → hero padrão

### Fase 3 — Modo Saved (📋 PLANEJADO)

- [ ] Identificar usuários que já fizeram login (localStorage/sessionStorage sem PII)
- [ ] Implementar toggle `mode='saved'` com cards de acesso rápido
- [ ] Botão "Continuar como {nome}" sem redigitar senha (futuro: magic link)
- [ ] Botão "Trocar de conta"

### Fase 4 — Ajustes e Deploy (📋 PLANEJADO)

- [ ] Substituir URL do Spline de exemplo pela cena real do personagem Meta Construtor
- [ ] Ajustar animações e transições
- [ ] Verificar build (lint + test + build)
- [ ] Deploy Vercel (resolver bloqueio de deploys acumulados)
- [ ] Verificar em produção: login + lead detection + hero

---

## 7. Referência Visual

A página de referência do Canva mostra o resultado final desejado:

- **Fundo:** Gradiente laranja quente (#ff7e5f → #feb47b)
- **Personagem:** Close-up de figura com capacete futurista laranja/preto (3D realista sci-fi)
- **Cartão de login:** Card branco flutuando sobre fundo laranja
- **Mensagem:** "Que bom que você voltou!" + "Acesse sua conta"
- **Avatar:** Círculo roxo escuro com iniciais do usuário
- **Nome/E-mail:** Preenchidos automaticamente
- **Botão:** Laranja grande "Continuar"
- **Header superior:** Logo + "Funcionalidades" + "Planos" + "Criar uma conta"

### 7.1 Inspiração de Layout

O layout segue o padrão de "login com reconhecimento" usado pelo Canva (fonte de inspiração declarada no PRD_DASHBOARD.md):

```
┌────────────────────────────────────────────────────────┐
│  Logo               Nav                [Criar conta]   │
│                                                        │
│  ┌─────────────── 3D ────────────┬───── Cards ──────┐ │
│  │                               │  ┌──────────────┐ │ │
│  │   Personagem animado          │  │ Avatar Nome  │ │ │
│  │   (Spline)                    │  │ "Que bom que │ │ │
│  │   Capacete laranja            │  │  você voltou!"│ │ │
│  │   Fundo escuro com spotlight  │  └──────────────┘ │ │
│  │                               │  ┌────┐ ┌────┐   │ │
│  │                               │  │RDO │ │Dash│   │ │
│  │                               │  └────┘ └────┘   │ │
│  │                               │  ┌────┐ ┌────┐   │ │
│  │                               │  │Equi│ │Seg │   │ │
│  │                               │  └────┘ └────┘   │ │
│  │                               │  ┌──────────────┐ │ │
│  │                               │  │ Conta pré-   │ │ │
│  │                               │  │ cadastrada   │ │ │
│  │                               │  └──────────────┘ │ │
│  └───────────────────────────────┴────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

---

## 8. Regras de Manutenção

1. **Nunca remover o SplineScene sem fallback** — o lazy loading com Suspense é obrigatório para não quebrar o bundle
2. **Manter debounce de 600ms** no hook `useLeadDetection` para não sobrecarregar a Edge Function
3. **Não armazenar PII em localStorage** — o email do lead não deve ser salvo localmente
4. **Preservar modo 'default'** — se a Edge Function falhar (erro de rede), o hero deve cair graciosamente para o modo padrão
5. **URL do Spline** é placeholder — substituir pela cena real do personagem Meta Construtor quando disponível
6. **Cards atualizados conforme funcionalidades do produto** — manter sincronizado com os módulos reais do app

---

## 9. Pendências

| # | Item | Prioridade | Status | Observação |
|---|------|------------|--------|------------|
| 1 | Substituir URL Spline placeholder pela cena real | P1 | Pendente | Aguardando designer/modelador 3D |
| 2 | Integrar AuthHeroSection no sign-in.tsx | P0 | Pendente | Bloqueado por deploys Vercel quebrados |
| 3 | Testar fluxo completo em produção | P0 | Pendente | Após deploy funcional |
| 4 | Implementar modo 'saved' com detecção de device | P2 | Planejado | Após validação do modo lead |
| 5 | Resolver acúmulo de 245 deploys no Vercel | P0 | Pendente | Builds remotos quebrados |
| 6 | Deploy Edge Function lookup-lead atualizada | P0 | Pendente | Após Vercel funcional |

---

## 10. Changelog

| Data | Versão | Autor | Mudança |
|------|--------|-------|---------|
| 2026-06-12 | 1.0 | Hermes | Criação do PRD_LOGIN_HERO com especificação completa da seção Hero |
