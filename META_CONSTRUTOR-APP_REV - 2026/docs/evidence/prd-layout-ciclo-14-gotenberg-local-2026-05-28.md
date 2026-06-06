# Evidencia PRD_LAYOUT - Ciclo 14 - Gotenberg local

Data: 2026-05-28  
Status: concluido localmente.

## Escopo executado

- Validacao local de conversor Gotenberg dedicado.
- Envio real de e-mail mantido fora do escopo desta execucao.

## Container

```text
nome: prd-layout-gotenberg
imagem: gotenberg/gotenberg:8
url local: http://127.0.0.1:3001
```

## Comandos executados

```powershell
docker ps --format "{{.Names}} {{.Image}} {{.Ports}}"
```

Resultado: Docker ativo fora do sandbox, com stack local Supabase em execucao.

```powershell
docker run -d --name prd-layout-gotenberg -p 127.0.0.1:3001:3000 gotenberg/gotenberg:8
```

Resultado:

```text
01b9623dfea49eecc304631fa1a7ef1b9dfc67f693734c67e1aa0cbe83fcb9b1
Status: Downloaded newer image for gotenberg/gotenberg:8
```

Primeira chamada, sem `filename=index.html`:

```text
status=400
Invalid form data: form file 'index.html' is required
```

Chamada corrigida, com `filename=index.html`:

```powershell
curl.exe -sS -o .tmp-prd-layout/gotenberg-smoke.pdf -w "%{http_code}" -F "files=@.tmp-prd-layout/gotenberg-index.html;filename=index.html;type=text/html" http://127.0.0.1:3001/forms/chromium/convert/html
```

Resultado:

```text
status=200
bytes=16730
pdf=.tmp-prd-layout/gotenberg-smoke.pdf
```

## Conclusao

- Gotenberg v8 local respondeu corretamente quando o multipart envia `files` com `filename=index.html`.
- A Edge Function `generate-rdo-pdf` ja monta `File([templateHtml], "index.html", { type: "text/html" })`, portanto o contrato local validado e compativel.
- A pendencia restante e de infraestrutura remota: configurar Supabase Secret `GOTENBERG_URL` com um endpoint publico e estavel. O `127.0.0.1:3001` local nao e acessivel pela Edge Function remota.
