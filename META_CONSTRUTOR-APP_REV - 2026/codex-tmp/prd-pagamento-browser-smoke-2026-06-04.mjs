import { chromium } from "playwright";
import fs from "node:fs/promises";

const baseUrl = "https://www.metaconstrutor.app.br";
const evidenceDir = "docs/evidence";

const routes = [
  { path: "/preco", expected: ["Planos", "Comece"] },
  { path: "/checkout?plan=basic&billing=monthly", expected: ["Dados da Conta", "Continuar para Pagamento"] },
  { path: "/criar-conta", expected: ["Criar", "conta"] },
  { path: "/contato", expected: ["Contato", "Mensagem"] },
];

const relevantConsole = (messages) =>
  messages.filter((item) => {
    const text = `${item.type} ${item.text} ${item.location?.url || ""}`;
    return !/favicon|manifest|chrome-extension|DevTools|ResizeObserver loop/i.test(text);
  });

const browser = await chromium.launch({ headless: true });
const smoke = [];

for (const route of routes) {
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const consoleMessages = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (["error", "warning", "warn"].includes(message.type())) {
      consoleMessages.push({
        type: message.type(),
        text: message.text(),
        location: message.location(),
      });
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(`${baseUrl}${route.path}`, { waitUntil: "load", timeout: 45_000 });
  await page.waitForTimeout(2500);

  const bodyText = await page.locator("body").innerText({ timeout: 10_000 });
  const finalUrl = page.url();
  const title = await page.title();
  const expectedFound = route.expected.some((text) => bodyText.includes(text));
  const overlayFound = /vite|webpack|failed to compile|runtime error|error overlay/i.test(bodyText);

  if (route.path.startsWith("/checkout")) {
    await page.screenshot({
      path: `${evidenceDir}/prd-pagamento-browser-checkout-basic-2026-06-04.png`,
      fullPage: false,
    });
  }

  smoke.push({
    route: route.path,
    finalUrl,
    title,
    notBlank: bodyText.trim().length > 100 && expectedFound,
    frameworkOverlay: overlayFound,
    relevantConsole: relevantConsole(consoleMessages),
    pageErrors,
  });

  await context.close();
}

const context = await browser.newContext({
  viewport: { width: 1366, height: 768 },
  ignoreHTTPSErrors: true,
});
const page = await context.newPage();
const interactionConsole = [];
const interactionErrors = [];

page.on("console", (message) => {
  if (["error", "warning", "warn"].includes(message.type())) {
    interactionConsole.push({
      type: message.type(),
      text: message.text(),
      location: message.location(),
    });
  }
});
page.on("pageerror", (error) => interactionErrors.push(error.message));

const email = `codex.playwright.payment.master.${Date.now()}@example.com`;
await page.goto(`${baseUrl}/checkout?plan=master&billing=monthly`, {
  waitUntil: "load",
  timeout: 45_000,
});
await page.waitForTimeout(2500);

await page.getByPlaceholder("Seu nome completo").fill("Smoke Pagamento Playwright");
await page.getByPlaceholder("seu@email.com").fill(email);
await page.getByRole("textbox", { name: "Senha", exact: true }).fill("TestPassword123!");
await page.getByRole("textbox", { name: "Confirmar Senha", exact: true }).fill("TestPassword123!");
await page.getByPlaceholder("(00) 00000-0000").fill("11999999999");
await page.getByPlaceholder("000.000.000-00").fill("00000000000");
await page.getByPlaceholder("Sua empresa").fill("Meta Construtor Smoke");

await Promise.all([
  page.waitForURL(/checkout\.stripe\.com/, { timeout: 60_000 }),
  page.getByRole("button", { name: "Continuar para Pagamento" }).click(),
]);
await page.waitForLoadState("load", { timeout: 45_000 }).catch(() => {});
await page.waitForTimeout(4000);

const stripeText = await page.locator("body").innerText({ timeout: 20_000 });
await page.screenshot({
  path: `${evidenceDir}/prd-pagamento-browser-stripe-master-2026-06-04.png`,
  fullPage: false,
});

const interaction = {
  route: "/checkout?plan=master&billing=monthly",
  email,
  finalUrlHost: new URL(page.url()).host,
  title: await page.title(),
  reachedStripe: page.url().startsWith("https://checkout.stripe.com/"),
  stripeSnapshotHasPlan: /Plano Master|Master|Meta Construtor/i.test(stripeText),
  relevantConsole: relevantConsole(interactionConsole),
  pageErrors: interactionErrors,
};

await context.close();
await browser.close();

const result = {
  environment: {
    baseUrl,
    viewport: "1366x768",
    browserPath: "Playwright isolated context fallback after in-app Browser screenshot/session isolation limits",
  },
  smoke,
  interaction,
  screenshots: [
    "docs/evidence/prd-pagamento-browser-checkout-basic-2026-06-04.png",
    "docs/evidence/prd-pagamento-browser-stripe-master-2026-06-04.png",
  ],
};

await fs.writeFile(
  `${evidenceDir}/prd-pagamento-browser-smoke-2026-06-04.json`,
  JSON.stringify(result, null, 2),
);

console.log(JSON.stringify(result, null, 2));

const failures = [
  ...smoke.filter((item) => !item.notBlank || item.frameworkOverlay || item.pageErrors.length > 0 || item.relevantConsole.length > 0),
  ...(interaction.reachedStripe && interaction.stripeSnapshotHasPlan && interaction.pageErrors.length === 0 ? [] : [interaction]),
];

if (failures.length > 0) {
  process.exitCode = 1;
}
