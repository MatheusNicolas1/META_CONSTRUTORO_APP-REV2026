# PRD — Botão de Download PWA com Detecção de Dispositivo

**Data:** 2026-06-16
**Status:** 📝 PROPOSTO
**Owner:** Hermes Agent (Jarvis)
**Produto:** Meta Construtor Web
**Escopo:** Botão de download do PWA que se adapta ao dispositivo do visitante (PC, tablet ou mobile), posicionado na seção Hero da página inicial (`/`), ao lado do botão "Ver planos", com efeito visual animado.
**Skill:** `prd-authoring`, `saas-landing-page`
**Baseline:** `PRD_MESTRE.md` (seção 3.1 Layout, 3.6 SEO), `PRD_LAYOUT.md`, `PRD_PUBLICAS_V2_GEMINI.md`, `DESIGN.md`

---

## 0. Resumo Executivo

O Meta Construtor é um **PWA** (Progressive Web App) — isso significa que ele já é instalável em qualquer dispositivo sem passar por loja de aplicativos. No entanto, **não existe nenhum botão ou chamada para instalação** na landing page. Visitantes que poderiam instalar o app no celular ou tablet acabam saindo sem saber que podem adicionar à tela inicial.

Este PRD propõe um **botão de download adaptativo** no Hero da página `/` que:

1. **Detecta o dispositivo** do visitante (PC, tablet ou mobile)
2. **Exibe texto contextual** ("Baixar para PC", "Baixar para Android", "Instalar no iPhone", etc.)
3. **Aciona o prompt de instalação PWA** (`beforeinstallprompt`) em dispositivos compatíveis
4. **Mostra instruções visuais** passo-a-passo para iOS (que não suporta o evento automático)
5. **Aplica efeito visual animado** (pulse/glow/shimmer) compatível com o design system atual

---

## 1. Contexto Técnico

### 1.1 PWA já implementado

O Meta Construtor já possui:
- `public/manifest.json` com ícones, nome, short_name, display, theme_color
- `public/sw.js` — Service Worker registrado e funcional
- `public/robots.txt` e `public/sitemap.xml` configurados
- Tema PWA configurado (tema claro/escuro com suporte a media query)

### 1.2 Evento `beforeinstallprompt`

O Chrome/Edge/Android WebView disparam o evento `beforeinstallprompt` quando:
- O PWA atende aos critérios de instalabilidade (manifest, service worker, HTTPS)
- O usuário ainda não instalou o app
- O evento não foi prevenido anteriormente na sessão

O evento permite exibir um prompt nativo de instalação ao ser chamado com `.prompt()`.

### 1.3 iOS Safari

O iOS **não dispara** `beforeinstallprompt`. A instalação é feita manualmente via "Compartilhar → Adicionar à Tela de Início". A solução é exibir um modal com instruções visuais.

---

## 2. Arquitetura da Feature

### 2.1 Componentes

```
src/
├── components/
│   ├── public/
│   │   ├── DownloadButton.tsx       ← NOVO: botão adaptativo principal
│   │   └── InstallInstructions.tsx   ← NOVO: modal de instruções iOS/fallback
│   └── hooks/
│       └── useInstallPrompt.ts      ← NOVO: hook de detecção + prompt PWA
```

### 2.2 Fluxo de Detecção

```
Visitante acessa /home
         │
         ▼
useInstallPrompt()
  ├── Detecta dispositivo (userAgent)
  │     ├── mobile (iPhone/iPad/Android)
  │     ├── tablet (iPadOS/surface/etc)
  │     └── desktop (Windows/Mac/Linux)
  │
  ├── Já instalado? (display-mode: standalone)
  │     └── SIM → esconde botão (não mostrar para quem já instalou)
  │
  ├── beforeinstallprompt disponível? (Chrome/Edge/Android)
  │     └── SIM → armazena evento, mostra botão para instalar
  │
  └── iOS?
        └── SIM → mostra botão que abre modal de instruções
```

### 2.3 Comportamento por Dispositivo

| Dispositivo | Texto do Botão | Ação | Ícone |
|------------|----------------|------|-------|
| **Desktop (Win/Mac/Linux)** | "Baixar para PC" | Abre modal com QR code + link do PWA | `Monitor` ou `Download` |
| **Android (Chrome)** | "Instalar app Android" | Chama `beforeinstallprompt.prompt()` | `Smartphone` |
| **iPhone/iPad (Safari)** | "Instalar no iPhone" | Abre modal com instruções passo-a-passo | `Smartphone` |
| **Outros (navegador)** | "Adicionar à tela inicial" | Abre modal com instruções genéricas | `Download` |
| **Já instalado** | `(oculto)` | — | — |

### 2.4 Efeito Visual

O botão deve receber um efeito chamativo (mas elegante) para destacá-lo do botão "Ver planos" ao lado:

- **Pulse/Glow animado**: borda com brilho pulsante em laranja (`brand-orange`)
- **Shimmer sutil**: gradiente animado no background que se move horizontalmente
- **Oscilação vertical leve**: `y` oscilando ±2px com easing suave
- Efeito ativado apenas nos primeiros 10 segundos após carregar a página, depois reduz para hover normal

```tsx
// Exemplo de variante do efeito
const downloadBtnAnim = {
  initial: { scale: 1 },
  hover: { scale: 1.03, boxShadow: "0 0 20px rgba(251, 146, 60, 0.4)" },
  pulse: {
    scale: [1, 1.02, 1],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  }
};
```

---

## 3. Especificação Técnica

### 3.1 Hook `useInstallPrompt`

```typescript
interface UseInstallPromptReturn {
  /** Se o PWA já está instalado (display-mode: standalone) */
  isInstalled: boolean;
  /** Se o dispositivo suporta beforeinstallprompt */
  canInstall: boolean;
  /** Tipo de dispositivo detectado */
  deviceType: 'desktop' | 'mobile' | 'tablet';
  /** Plataforma específica */
  platform: 'android' | 'ios' | 'windows' | 'mac' | 'linux' | 'other';
  /** Exibe o prompt nativo de instalação (Android/Chrome) */
  install: () => Promise<void>;
  /** Se o modal de instruções deve ser exibido (iOS) */
  showInstructions: boolean;
  /** Controla a exibição do modal */
  setShowInstructions: (show: boolean) => void;
  /** Texto contextual do botão baseado no dispositivo */
  buttonText: string;
  /** Ícone do botão */
  buttonIcon: LucideIcon;
}
```

### 3.2 Componente `DownloadButton`

- Props: aceita `className` para estilização externa
- Usa o hook `useInstallPrompt` internamente
- Renderiza condicionalmente baseado em `isInstalled`
- Aplica efeito pulse nos primeiros 10s via `useEffect` com timer
- Para desktop: ao clicar, copia URL para área de transferência + abre modal "Acesse pelo celular"
- Para Android: ao clicar, chama `install()`
- Para iOS: ao clicar, abre `InstallInstructions` modal
- Totalmente responsivo (texto adaptado em mobile para "Instalar" curto)

### 3.3 Modal `InstallInstructions`

- Overlay com backdrop blur
- Card central com instruções visuais:
  - **iOS**: 3 passos com ícones (Compartilhar → Adicionar à Tela de Início → Confirmar)
  - **Desktop**: QR code + "Escaneie com seu celular"
  - **Genérico**: "Digite a URL no navegador e adicione à tela inicial"
- Botão "Entendi" para fechar
- Animação de entrada: scale + fade

### 3.4 Integração no Hero (Index.tsx)

Posicionamento: após o botão "Ver planos" existente (linha 312-316), dentro do mesmo `motion.div` flex container.

```tsx
<Button variant="outline" ...>
  <Link to="/preco">Ver planos</Link>
</Button>

{/* NOVO: botão de download adaptativo */}
<DownloadButton />
```

O container `flex flex-col sm:flex-row gap-3 sm:gap-4` já acomoda 3+ botões naturalmente.

### 3.5 PWA Manifest Check

Garantir que o `manifest.json` e `sw.js` estejam configurados de acordo com boas práticas:

```json
{
  "name": "Meta Construtor",
  "short_name": "Meta Construtor",
  "description": "Gestão de obras completa — RDO digital, checklists, equipes e relatórios",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#f97316",
  "icons": [
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

---

## 4. Design Visual

### 4.1 Aparência do Botão

Baseado no design system atual:
- **Background**: gradient sutil `from-brand-orange to-brand-orange-dark` ou outline
- **Hover**: glow laranja + elevação
- **Ícone**: `Download` (ou `Smartphone`/`Monitor` conforme plataforma)
- **Texto**: `font-semibold`, branco ou laranja conforme variante
- **Border-radius**: `rounded-full` (consistente com os demais botões do Hero)
- **Padding**: `px-6 py-5 sm:px-8 sm:py-6`

### 4.2 Efeito de Destaque

```css
/* Glow pulsante no botão */
.download-button-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 8px rgba(249, 115, 22, 0.3); }
  50% { box-shadow: 0 0 20px rgba(249, 115, 22, 0.6); }
}
```

O efeito desativa após 10 segundos da montagem do componente.

### 4.3 Responsividade

| Breakpoint | Comportamento |
|------------|--------------|
| **Mobile (< 640px)** | Texto reduzido para "Instalar" + ícone; botões empilhados verticalmente |
| **Tablet (640-1023px)** | Texto completo; botões lado a lado |
| **Desktop (≥ 1024px)** | Texto completo; botões lado a lado com espaço generoso |

---

## 5. Critérios de Aceitação

### 5.1 Funcionais

- [ ] `useInstallPrompt` detecta corretamente o dispositivo e plataforma
- [ ] Botão **não aparece** quando o PWA já está instalado (`display-mode: standalone`)
- [ ] Botão **não aparece** em navegadores que não suportam PWA (Safari desktop, navegadores antigos)
- [ ] Android/Chrome: ao clicar, dispara o prompt nativo de instalação
- [ ] iOS Safari: ao clicar, abre modal com instruções visuais passo-a-passo
- [ ] Desktop: ao clicar, abre modal com instruções + cópia do link
- [ ] Modal `InstallInstructions` fecha ao clicar "Entendi" ou no backdrop
- [ ] Texto do botão muda conforme dispositivo detectado
- [ ] Ícone do botão muda conforme plataforma

### 5.2 Visuais

- [ ] Efeito pulse/glow ativo nos primeiros 10 segundos
- [ ] Hover com elevação e glow laranja
- [ ] Botão integrado harmoniosamente ao container flex do Hero
- [ ] Modal com backdrop blur e animação de entrada suave
- [ ] Responsivo: empilha verticalmente em mobile

### 5.3 Técnicos

- [ ] `npm run build` passa sem erros
- [ ] Service Worker continua funcional após alterações
- [ ] Nenhum warning novo de acessibilidade ou lint
- [ ] Bundle size do componente não excede 5KB gzipped
- [ ] Performance: hook não causa re-renders desnecessários

---

## 6. Dependências

| Item | Status | Observação |
|------|--------|------------|
| Service Worker registrado | ✅ EXISTENTE | `public/sw.js` |
| Manifest.json | ✅ EXISTENTE | `public/manifest.json` |
| Ícones PWA (192x192, 512x512) | ✅ EXISTENTE | `public/icons/` |
| Tailwind CSS | ✅ EXISTENTE | Versão atual |
| Framer Motion | ✅ EXISTENTE | v11+ |
| Lucide React | ✅ EXISTENTE | `Download`, `X`, `Smartphone`, `Monitor` icons |
| Componentes UI base | ✅ EXISTENTE | `Button`, `Dialog/Modal` |
| QR Code library | ❌ NOVO | `qrcode.react` (2KB gzipped) |

---

## 7. Casos de Borda

| Cenário | Comportamento Esperado |
|---------|----------------------|
| Safari desktop (sem PWA) | Botão oculto ou mostra "Acesse pelo celular" |
| Firefox (não suporta `beforeinstallprompt`) | Exibe instruções genéricas |
| PWA já instalado | Botão completamente oculto |
| Dispositivo corporativo (sem permissão de instalar) | Mostra instruções, não o prompt nativo |
| Huawei (sem Google Play Services) | Instruções genéricas + link direto |
| 3G / conexão lenta | Botão aparece normalmente (sem dependência de network) |
| Dispositivo em landscape | Layout se adapta normalmente |

---

## 8. Roadmap

| Fase | Descrição | Estimativa |
|------|-----------|-----------|
| **1. Hook** | Criar `useInstallPrompt` com detecção e armazenamento do evento | 1h |
| **2. Botão** | Criar `DownloadButton` com texto/ícone adaptativo + efeito pulse | 1h |
| **3. Modal** | Criar `InstallInstructions` com instruções iOS/desktop | 1h |
| **4. Integração** | Adicionar ao Hero da Index.tsx | 0.5h |
| **5. Testes** | Build, verificar comportamento em mobile/desktop | 0.5h |
| **Total** | | **4h** |

---

## 9. Pendências Abertas

- [ ] Validar comportamento do `beforeinstallprompt` em dispositivos reais (não apenas emulador)
- [ ] Verificar se QR code library `qrcode.react` já está no `package.json`
- [ ] Definir URL mockup do QR code (pode ser gerado estaticamente via lib)
- [ ] Testar em iOS Safari real para validar instruções passo-a-passo

---

## 10. Referências

- `PRD_MESTRE.md` — diretrizes de layout e responsividade (seção 3.1)
- `PRD_LAYOUT.md` — padrões de layout, overflow, PWA, responsividade
- `DESIGN.md` — design tokens e identidade visual
- `src/pages/Index.tsx` — Hero atual com botões "Comece grátis" e "Ver planos"
- `public/manifest.json` — configuração atual do PWA
- `public/sw.js` — Service Worker atual
- `src/components/public/SingleCarousel.tsx` — exemplo de componente público existente
- MDN: [Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- MDN: [beforeinstallprompt event](https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent)
