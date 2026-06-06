/**
 * Teste da Edge Function send-campaign v2
 * node test-campaign.mjs
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, ".env") });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  console.log("\n🔍 TESTANDO EDGE FUNCTION SEND-CAMPAIGN v2\n");

  // Teste 1: Dry Run
  console.log("📋 Teste 1 — DRY RUN");
  let res = await fetch(`${SUPABASE_URL}/functions/v1/send-campaign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({
      emails: [
        { to: "delivered@resend.dev", empresa: "Construtora Exemplo 1" },
        { to: "delivered@resend.dev", empresa: "Construtora Exemplo 2" },
      ],
      subject: "Teste DRY RUN - Meta Construtor",
      html: "<h2>Teste</h2><p>Dry run da campanha.</p>",
      dryRun: true,
    }),
  });
  let data = await res.json();
  console.log(`   Status: ${res.status}`);
  console.log(`   Resposta: ${JSON.stringify(data, null, 2)}\n`);

  if (data.error) {
    console.error("❌ Edge Function com erro. Verifique o deploy.");
    process.exit(1);
  }

  // Teste 2: Envio real (para delivered@resend.dev - sempre aceito)
  console.log("📋 Teste 2 — ENVIO REAL (delivered@resend.dev)");
  res = await fetch(`${SUPABASE_URL}/functions/v1/send-campaign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({
      emails: [
        { to: "delivered@resend.dev", empresa: "Teste Real" },
      ],
      subject: "✅ Campanha Meta Construtor - Teste Real",
      html: '<h2 style="color:#e05d2a;">Campanha Meta Construtor</h2><p>Por favor use a tag {{nome_empresa}} se quiser personalizar, ou então não use template tags.</p>',
      dryRun: false,
    }),
  });
  data = await res.json();
  console.log(`   Status: ${res.status}`);
  console.log(`   Resposta: ${JSON.stringify(data, null, 2)}\n`);

  if (data.sent > 0) {
    console.log("✅ PIPELINE COMPLETA — Edge Function → Resend → Entrega OK");
  } else if (data.failed > 0) {
    console.log("❌ Falha no envio:", data.results?.[0]?.error);
  }
}

main().catch(console.error);
