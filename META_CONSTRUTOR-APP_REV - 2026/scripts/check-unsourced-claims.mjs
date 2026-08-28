#!/usr/bin/env node
/**
 * check-unsourced-claims.mjs — check de PREVENÇÃO do padrão FALSO-036/055/056.
 *
 * Uso (CI): `node scripts/check-unsourced-claims.mjs`
 *
 *  1) BLOQUEANTE (exit code != 0): roda a regra `meta-construtor/no-unsourced-claims`
 *     (a MESMA regra do `npm run lint`) sobre os arquivos TypeScript em `src`
 *     (glob .ts/.tsx, recursivo) com severidade ERROR. Se qualquer claim
 *     numérica/social-proof sem fonte reaparecer, o CI falha. Exclui testes.
 *
 *  2) ADVISORY (não altera o exit code): varredura FALSO-056 de preços "redondos"
 *     ("R$NNN" sem centavos) em superfícies de marketing/pricing, listados para
 *     revisão manual contra o pricing canônico (src/pages/Preco.tsx). Não bloqueia
 *     porque o conteúdo (blog/SEO) cita legitimamente preços reais e de terceiros.
 */

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import urk from "eslint/use-at-your-own-risk";
import tsParser from "@typescript-eslint/parser";
import plugin from "./eslint-plugin-no-unsourced-claims.mjs";

const { FlatESLint } = urk;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(__dirname, "..");
const TARGET = ["src/**/*.{ts,tsx}"];

// ---------------------------------------------------------------------------
// 1) BLOQUEANTE — rule no-unsourced-claims (severity ERROR)
// ---------------------------------------------------------------------------

async function runClaimCheck() {
  const eslint = new FlatESLint({
    cwd: APP_DIR,
    overrideConfigFile: null,
    overrideConfig: [
      {
        ignores: [
          "**/node_modules/**",
          "**/dist/**",
          "**/output/**",
          "**/test-results/**",
          "**/*.d.ts",
          "**/*.test.ts",
          "**/*.test.tsx",
          "**/*.spec.ts",
          "**/*.spec.tsx",
          "**/__tests__/**",
        ],
      },
      {
        files: TARGET,
        plugins: { "meta-construtor": plugin },
        rules: { "meta-construtor/no-unsourced-claims": "error" },
        languageOptions: {
          ecmaVersion: "latest",
          sourceType: "module",
          parser: tsParser,
          parserOptions: { ecmaFeatures: { jsx: true } },
        },
      },
    ],
  });

  const results = await eslint.lintFiles(TARGET);
  const violations = [];
  for (const r of results) {
    for (const msg of r.messages) {
      if (msg.severity === 2) {
        violations.push({
          file: path.relative(APP_DIR, r.filePath).replace(/\\/g, "/"),
          line: msg.line,
          col: msg.column,
          message: msg.message,
        });
      }
    }
  }
  return violations;
}

// ---------------------------------------------------------------------------
// 2) ADVISORY — FALSO-056 (preço "redondo" em superfícies de marketing)
// ---------------------------------------------------------------------------

const PRICING_SURFACES = [
  "src/pages-gemini/Preco2.tsx",
  "src/pages/Preco.tsx",
  "src/config/seo.ts",
  "src/content/blogArticles.pt-BR.ts",
  "src/remotion/**",
];

// "R$79/mês", "R$299" — valor redondo SEM centavos, associado a mês/ano/plano.
const ROUND_PRICE =
  /R\$\s?(\d{2,4})\b(?!\s*(?:[.,]\d{2}))(?:[^.\n]{0,40}?(?:\/m[êe]s|m[êe]s|anual|\/ano|por ano|plano|Plano))/gi;

function runPricingAdvisory() {
  const seen = new Set();
  const hits = [];

  const files = [];
  for (const pattern of PRICING_SURFACES) {
    if (pattern.includes("*")) {
      collectFiles(path.join(APP_DIR, pattern), files);
    } else {
      const p = path.join(APP_DIR, pattern);
      if (fs.existsSync(p)) files.push(p);
    }
  }

  for (const file of files) {
    if (!/\.(ts|tsx)$/.test(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    const lines = text.split("\n");
    ROUND_PRICE.lastIndex = 0;
    lines.forEach((line, idx) => {
      ROUND_PRICE.lastIndex = 0;
      let m;
      while ((m = ROUND_PRICE.exec(line)) !== null) {
        const key = `${file}:${idx + 1}:${m[1]}`;
        if (seen.has(key)) continue;
        seen.add(key);
        hits.push({
          file: path.relative(APP_DIR, file).replace(/\\/g, "/"),
          line: idx + 1,
          price: `R$${m[1]}`,
          snippet: line.trim().substring(0, 90),
        });
      }
    });
  }
  return hits;
}

function collectFiles(pattern, out) {
  // pattern é relativo a APP_DIR e pode conter um único "**".
  const [dirPart] = pattern.split("/**");
  const base = path.join(APP_DIR, dirPart);
  if (!fs.existsSync(base)) return;
  const stack = [base];
  while (stack.length) {
    const cur = stack.pop();
    for (const entry of fs.readdirSync(cur, { withFileTypes: true })) {
      const full = path.join(cur, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "node_modules") stack.push(full);
      } else if (/\.(ts|tsx)$/.test(entry.name)) {
        out.push(full);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  let failed = false;

  console.log("=== PREVENÇÃO FALSO-036/055 — claims numéricas/social-proof sem fonte ===\n");
  let violations;
  try {
    violations = await runClaimCheck();
  } catch (err) {
    console.error("ERRO ao executar a checagem:", err?.message ?? err);
    process.exit(2);
  }

  if (violations.length === 0) {
    console.log("OK — nenhuma claim numérica/social-proof sem fonte encontrada.\n");
  } else {
    failed = true;
    console.log(`BLOQUEADO — ${violations.length} violação(ões) encontrada(s):\n`);
    for (const v of violations) {
      console.log(`  ${v.file}:${v.line}:${v.col}`);
      console.log(`    ${v.message}\n`);
    }
  }

  console.log("=== FALSO-056 (advisory) — preços redondos em superfícies de marketing ===\n");
  const pricingHits = runPricingAdvisory();
  if (pricingHits.length === 0) {
    console.log("OK — nenhum preço redondo suspeito encontrado.\n");
  } else {
    console.log(
      `REVISÃO (não bloqueia) — ${pricingHits.length} preço(s) redondo(s) para conferir contra o pricing canônico:\n`,
    );
    for (const h of pricingHits) {
      console.log(`  ${h.file}:${h.line}  [${h.price}]  ${h.snippet}`);
    }
    console.log("");
  }

  if (failed) {
    console.log("RESULTADO: BLOQUEADO (claims sem fonte encontradas).");
    process.exit(1);
  }
  console.log("RESULTADO: OK (0 claims sem fonte).");
  process.exit(0);
}

main();
