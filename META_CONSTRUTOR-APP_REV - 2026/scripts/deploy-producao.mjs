// Deploy oficial da rodada 2 das páginas públicas (branch claude/elegant-mayer-ok0ydp).
//
// Rodar no PC que tem o master de produção, dentro da pasta do app:
//   node scripts/deploy-producao.mjs [--rollback-id=dpl_...]
//
// Etapas (para na primeira falha, sem publicar nada pela metade):
//   1. Envia o master local ao GitHub (a versão em produção hoje fica guardada).
//   2. Junta a branch da rodada 2 no master. Em conflito: desfaz a junção e para.
//   3. Testes, checagem de claims e build.
//   4. Confere o projeto do domínio, guarda o deploy atual (rollback) e faz uma prévia:
//      você confere a URL e digita PUBLICAR.
//   5. Publica em produção e envia o master ao GitHub.
import { execSync, spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const BRANCH = "claude/elegant-mayer-ok0ydp";
const DOMAIN = "www.metaconstrutor.app.br";

const run = (cmd) => {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
};
const read = (cmd) => execSync(cmd, { encoding: "utf8" }).trim();
const fail = (message, undo) => {
  console.error(`\n✖ ${message}`);
  if (undo) console.error(`  Para voltar o master local ao estado anterior: ${undo}`);
  process.exit(1);
};
const ask = async (question) => {
  const rl = createInterface({ input: stdin, output: stdout });
  const answer = await rl.question(question);
  rl.close();
  return answer.trim();
};

// 1. Pré-condições e backup do master no GitHub.
if (read("git rev-parse --abbrev-ref HEAD") !== "master") fail("Mude para o master antes: git checkout master");
if (read("git status --porcelain --untracked-files=no")) fail("Há alterações não commitadas. Faça commit ou stash antes.");
const before = read("git rev-parse HEAD");
const undo = `git reset --hard ${before}`;
try {
  run("git push origin master");
} catch {
  fail("Não consegui enviar o master ao GitHub. Resolva o push e rode de novo.");
}

// 2. Junta a rodada 2.
run(`git fetch origin ${BRANCH}`);
try {
  run(`git merge --no-ff --no-edit origin/${BRANCH}`);
} catch {
  spawnSync("git", ["merge", "--abort"], { stdio: "inherit" });
  fail(
    "Conflito ao juntar a rodada 2 com o master (junção desfeita; nada foi publicado).\n" +
      `  O master já está no GitHub: peça ao Claude para trazer o master para a branch ${BRANCH},\n` +
      "  resolver os conflitos e validar. Depois rode este script de novo."
  );
}

// 3. Validação.
try {
  run("npm install");
  run("npx vitest run");
  run("node scripts/check-unsourced-claims.mjs");
  run("npm run build");
} catch {
  fail("Validação falhou (testes, claims ou build). Nada foi publicado.", undo);
}

// 4. Confere se a pasta está ligada ao projeto que serve o domínio e guarda o deploy atual (rollback).
console.log(`\n$ npx vercel inspect ${DOMAIN}`);
const inspect = spawnSync("npx", ["vercel", "inspect", DOMAIN], { encoding: "utf8", shell: true });
const rollbackArg = process.argv.find((arg) => arg.startsWith("--rollback-id="))?.split("=")[1];
const current = rollbackArg || `${inspect.stdout}\n${inspect.stderr}`.match(/dpl_[A-Za-z0-9]+/)?.[0];
if (!current) {
  fail(
    `Não encontrei ${DOMAIN} na conta/projeto ligado a esta pasta. Nada foi publicado.\n` +
      "  Ligue a pasta ao projeto do domínio (npx vercel link --scope meta-construtors-projects) e rode de novo,\n" +
      "  ou informe o deploy atual copiado do painel da Vercel: node scripts/deploy-producao.mjs --rollback-id=dpl_...",
    undo
  );
}
console.log(`Deploy de produção atual (guardado para rollback): ${current}`);

// Prévia para conferência.
let preview;
try {
  console.log("\n$ npx vercel deploy");
  preview = execSync("npx vercel deploy", { encoding: "utf8", stdio: ["inherit", "pipe", "inherit"] }).trim().split(/\s+/).pop();
} catch {
  fail("O deploy de prévia falhou. Nada foi publicado em produção.", undo);
}
console.log(`\nPrévia pronta: ${preview}`);
console.log("Confira home, /funcionalidades/rdo-digital, /contato, /criar-conta e /preco no celular e no computador.");
if ((await ask('Digite PUBLICAR para enviar à produção (qualquer outra coisa cancela): ')) !== "PUBLICAR") {
  fail("Cancelado. Produção não foi alterada.", undo);
}

// 5. Publica.
try {
  run("npx vercel deploy --prod");
} catch {
  fail("O deploy de produção falhou; o site continua na versão anterior.", undo);
}
run("git push origin master");

console.log("\n✔ Publicado.");
console.log(`  Para voltar à versão anterior: npx vercel rollback ${current}`);
