# Guia de Publicação na Google Play Store

**App:** Meta Construtor  
**Versão:** 1.0.0  
**Data:** 2026-06-08  
**Stack:** PWA (React + Vite + Tailwind)

---

## 📱 Opção Escolhida: Bubblewrap (Trusted Web Activity)

O Meta Construtor já é uma PWA completa com:
- ✅ Manifest.json (`/manifest.json`)
- ✅ Service Worker (`/sw.js`)
- ✅ Ícones 192x192 e 512x512
- ✅ HTTPS
- ✅ App standalone (sem bordas do navegador)
- ✅ Screenshots
- ✅ Shortcuts (Dashboard, Obras, RDO)

Usaremos o **Bubblewrap** da Google para empacotar como Android App Bundle (.aab).

---

## 🔧 Pré-requisitos no seu computador

### 1. Java JDK 17

```bash
# Verificar se já tem
java -version

# Se não tiver, baixar:
# https://adoptium.net/temurin/releases/?version=17
# Instalar e configurar:
setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-17.0.xx-hotspot"
```
> **Nota:** O Bubblewrap pode instalar o JDK automaticamente durante a execução.

### 2. Android SDK

O Bubblewrap também pode baixar o Android SDK automaticamente. Você será perguntado na primeira execução:
```
? Do you want Bubblewrap to install the JDK (recommended)? (Y/n) → Y
? Do you want Bubblewrap to install Android SDK (recommended)? (Y/n) → Y
```

### 3. Node.js (já tem)

---

## 🚀 Gerar o APK/AAB

### Passo 1: Inicializar o projeto TWA

```bash
cd "C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"

npx @bubblewrap/cli init --manifest=https://www.metaconstrutor.app.br/manifest.json
```

Isso cria o diretório `twa/` com toda a estrutura Android.

### Passo 2: Gerar chave de assinatura (keystore)

```bash
keytool -genkey -v -keystore metaconstrutor.keystore -alias metaconstrutor -keyalg RSA -keysize 2048 -validity 10000
```

> **⚠️ GUARDE ESSA KEYSTORE COM SEGURANÇA.** Sem ela você não consegue atualizar o app na Play Store.
> Guarde em local seguro (ex: OneDrive, cofre).

### Passo 3: Configurar o Bubblewrap para usar sua keystore

Edite o arquivo `twa/twa-manifest.json` e adicione/configura:

```json
{
  "androidPackageName": "com.metaconstrutor.app",
  "manifestUrl": "https://www.metaconstrutor.app.br/manifest.json",
  "appVersionName": "1.0.0",
  "appVersionCode": 1,
  "orientation": "portrait",
  "display": "standalone",
  "signing": {
    "keystore": "../metaconstrutor.keystore",
    "alias": "metaconstrutor",
    "keyPassword": "<SUA_SENHA>",
    "storePassword": "<SUA_SENHA>"
  }
}
```

### Passo 4: Build

```bash
cd twa
npx @bubblewrap/cli build
```

Isso gera o arquivo: `twa/app-release-bundle.aab`

### Passo 5: (Opcional) Gerar APK universal para teste

```bash
npx @bubblewrap/cli universalaab --bundle app-release-bundle.aab --output metaconstrutor.apk
```

---

## 📦 Enviar para Google Play Console

1. Acesse [play.google.com/console](https://play.google.com/console)
2. Crie uma conta de desenvolvedor (US$ 25, taxa única)
3. Clique em **"Criar app"**
4. Preencha:
   - **Nome:** Meta Construtor
   - **Idioma padrão:** Português (Brasil)
   - **App ou jogo:** App
   - **Gratuito ou pago:** Gratuito (com assinatura in-app)
5. Faça upload do `app-release-bundle.aab`
6. Preencha a **Ficha da loja**:

### Ficha da Loja (Store Listing)

| Campo | Conteúdo |
|-------|----------|
| **Título** | Meta Construtor - Gestão de Obras |
| **Descrição curta** | Sistema completo de gestão de obras e RDO digital |
| **Descrição longa** | O Meta Construtor é a solução completa para engenheiros, construtores e incorporadores gerenciarem suas obras de forma eficiente. Crie RDOs, gerencie equipes, controle contratos, fluxo de caixa e muito mais. Tudo em um só lugar, acessível do celular ou computador. |
| **Categoria** | Produtividade |
| **Screenshots** | Use `/screenshot-desktop.png` (tablet/wide) e `/screenshot-mobile.png` (phone) — pegue prints reais do app |
| **Ícone** | Use `icon-512.png` (adaptado automaticamente) |
| **Política de privacidade** | Link para https://www.metaconstrutor.app.br/privacidade (precisa existir) |

### Classificação etária

Preencha o questionário do Google. Base:
- **Uso de dados de localização aproximada:** Não
- **Uso de dados de localização precisa:** Não
- **Compartilhamento de localização:** Não
- **Violência cartunesca/fantasia:** Não
- **Conteúdo sexual:** Não
- **Linguagem obscena:** Não
- **Compras in-app:** Sim (assinaturas Stripe via web)
- **Informações pessoais:** Sim (e-mail, nome para cadastro)

Resultado esperado: **Classificação Livre (Toda família)** ou **10+**

---

## 🔄 Atualizações futuras

Cada vez que você quiser atualizar o app na Play Store:

1. Faça o deploy do frontend na Vercel (como já faz)
2. A PWA na Google Play **já estará atualizada** (porque o conteúdo vem do `start_url`)

**Atualizações só precisam de novo AAB se:**
- Mudar o nome do app
- Mudar ícones
- Mudar permissões
- Mudar o `start_url`

No dia a dia, o conteúdo do app SEMPRE reflete o site — zero burocracia. 🎉

---

## 📋 Checklist de Pré-requisitos Google Play

- [ ] Conta de desenvolvedor Google Play criada (US$ 25)
- [ ] Política de privacidade publicada em `/privacidade`
- [ ] Screenshots reais do app (2+ mobile, 2+ tablet/wide)
- [ ] Ícone 512x512 com cantos arredondados ✅ (atualizado hoje)
- [ ] App testado em dispositivo Android real
- [ ] Testado em Chrome Android (modo standalone "Adicionar à tela inicial")
- [ ] URLs de email de suporte configuradas

---

## 🐛 Problemas comuns

### "Erro de assinatura"
Sua keystore expirou ou não corresponde ao que está na Google Play. **Sempre use a mesma keystore.**

### "App não instalou no dispositivo"
Verificar se seu Android tem Chrome instalado (TWA depende do Chrome).

### "App fecha na abertura"
Causa comum: seu service worker está offline e não respondeu. Teste primeiro a PWA pelo Chrome no Android.
