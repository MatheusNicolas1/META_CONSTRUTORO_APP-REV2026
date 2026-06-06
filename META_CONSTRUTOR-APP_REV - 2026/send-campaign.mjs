/**
 * Script de disparo da campanha Meta Construtor via Edge Function
 *
 * Uso:
 *   node send-campaign.mjs [--dry-run] [--lote=N] [--to=email]
 *
 * Opções:
 *   --dry-run    Simula sem enviar
 *   --lote=N     Envia apenas os primeiros N e-mails (modo teste)
 *   --to=email   Envia apenas para um e-mail específico
 */
import { readFileSync, existsSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, ".env") });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no .env");
  process.exit(1);
}

// === CONFIGURAÇÕES DA CAMPANHA ===

const CAMPAIGN_CONFIG = {
  subject: "Gestão de obras sem planilha e WhatsApp — conheça o Meta Construtor",
  csvFile: resolve(__dirname, "lista_prospeccao_construtoras.csv"),
  templateFile: resolve(__dirname, "email-campaign-template.html"),
  batchSize: 10,
  delayBetweenBatches: 2000, // ms
};

// === FUNÇÕES AUXILIARES ===

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === "," && !inQuotes) { result.push(current); current = ""; }
    else { current += char; }
  }
  result.push(current);
  return result;
}

function parseCSV(content) {
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((h, idx) => { row[h] = (values[idx] || "").trim().replace(/"/g, ""); });
      rows.push(row);
    }
  }
  return rows;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function extractEmails(rows) {
  return rows
    .filter(row => row.email && row.email.includes("@"))
    .map(row => ({
      to: row.email.trim(),
      empresa: row.empresa?.trim() || "",
    }));
}

// === MAIN ===

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const loteArg = process.argv.find(a => a.startsWith("--lote="));
  const toArg = process.argv.find(a => a.startsWith("--to="));
  const maxEmails = loteArg ? parseInt(loteArg.split("=")[1], 10) : Infinity;
  const singleEmail = toArg ? toArg.split("=")[1] : null;

  console.log("\n🏗️  META CONSTRUTOR — CAMPANHA DE E-MAIL\n");

  // 1. Ler CSV
  if (!existsSync(CAMPAIGN_CONFIG.csvFile)) {
    console.error(`❌ CSV não encontrado: ${CAMPAIGN_CONFIG.csvFile}`);
    process.exit(1);
  }

  const csvContent = readFileSync(CAMPAIGN_CONFIG.csvFile, "utf-8");
  const rows = parseCSV(csvContent);
  let emails = extractEmails(rows);

  // Filtro por e-mail específico
  if (singleEmail) {
    emails = emails.filter(e => e.to === singleEmail);
    if (emails.length === 0) {
      console.log(`❌ E-mail "${singleEmail}" não encontrado na lista.`);
      console.log("E-mails disponíveis:");
      extractEmails(rows).slice(0, 10).forEach(e => console.log(`   ${e.to} (${e.empresa})`));
      process.exit(1);
    }
  }

  // Limite por lote
  if (emails.length > maxEmails) {
    emails = emails.slice(0, maxEmails);
  }

  console.log(`📊 Empresas na lista: ${rows.length}`);
  console.log(`📧 E-mails para processar: ${emails.length}`);

  if (emails.length === 0) {
    console.error("❌ Nenhum e-mail válido encontrado no CSV");
    process.exit(1);
  }

  // 2. Distribuição por estado
  const estadoContagem = {};
  const ufMap = {};
  rows.filter(r => r.email).forEach(r => {
    const uf = r.uf || "N/I";
    estadoContagem[uf] = (estadoContagem[uf] || 0) + 1;
    if (!ufMap[r.email]) ufMap[r.email] = uf;
  });
  console.log("\n📍 Distribuição por estado:");
  Object.entries(estadoContagem).sort((a, b) => b[1] - a[1]).forEach(([uf, n]) => {
    console.log(`   ${uf}: ${n} e-mails`);
  });

  // 3. Ler template HTML
  if (!existsSync(CAMPAIGN_CONFIG.templateFile)) {
    console.error(`❌ Template não encontrado: ${CAMPAIGN_CONFIG.templateFile}`);
    process.exit(1);
  }

  const htmlTemplate = readFileSync(CAMPAIGN_CONFIG.templateFile, "utf-8");
  console.log(`\n📝 Template carregado: ${htmlTemplate.length} caracteres`);

  // Se for modo --to único, marcamos como dry-run também
  const isDryRun = dryRun || singleEmail !== null;

  if (isDryRun) {
    console.log("\n👀 Preview dos destinatários:");
    emails.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.to} ${e.empresa ? `(${e.empresa})` : ""}`);
    });
    console.log(`\n🔍 MODO SIMULAÇÃO (--dry-run ou --to específico)`);
  }

  // 4. Chamar Edge Function (lote único)
  console.log(`\n${isDryRun ? "🔍" : "🚀"} Chamando Edge Function send-campaign...`);

  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-campaign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({
      emails,
      subject: CAMPAIGN_CONFIG.subject,
      html: htmlTemplate,
      dryRun: isDryRun,
    }),
  });

  const result = await res.json();
  console.log(`\n📋 Status HTTP: ${res.status}`);
  console.log(`📦 Resposta: ${JSON.stringify(result, null, 2)}`);

  // === Relatório final ===
  console.log("\n" + "=".repeat(50));
  if (isDryRun) {
    console.log("✅ SIMULAÇÃO CONCLUÍDA");
    if (singleEmail) {
      console.log(`\nPara enviar para TODOS os ${extractEmails(rows).length} e-mails da lista:`);
      console.log("   node send-campaign.mjs");
      console.log(`\nPara enviar para este contato específico:`);
      console.log("   node send-campaign.mjs --to=email@exemplo.com");
    } else {
      // dry-run normal — mostra próximos passos
      console.log("\n📋 VALIDAÇÃO:");
      console.log(`   ✅ CSV lido: ${rows.length} empresas`);
      console.log(`   ✅ Template: ${htmlTemplate.length} chars`);
      console.log(`   ✅ Edge Function respondeu`);
      console.log(`   📧 ${result.valid} e-mails válidos de ${result.total} na lista`);
      if (result.invalid?.length > 0) {
        console.log(`   ⚠️  ${result.invalid.length} e-mails inválidos ignorados`);
      }
    }
  } else {
    const report = {
      date: new Date().toISOString(),
      total: result.total || emails.length,
      sent: result.sent || 0,
      failed: result.failed || 0,
      invalid: result.invalidEmails || [],
    };
    const logPath = resolve(__dirname, `campaign-log-${new Date().toISOString().slice(0, 10)}.json`);
    writeFileSync(logPath, JSON.stringify(report, null, 2));
    console.log(`✅ CAMPANHA FINALIZADA`);
    console.log(`   Enviados: ${report.sent}`);
    console.log(`   Falhas: ${report.failed}`);
    console.log(`   Log salvo: ${logPath}`);
  }
  console.log("=".repeat(50) + "\n");
}

main().catch(err => {
  console.error("\n💥 ERRO FATAL:", err.message);
  process.exit(1);
});
