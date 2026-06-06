import { chromium } from "playwright";
import fs from "node:fs/promises";

const baseUrl = "https://www.metaconstrutor.app.br";
const plans = ["basic", "professional", "master"];
const evidencePath = "docs/evidence/prd-pagamento-browser-all-plans-2026-06-05.json";

const relevantConsole = (messages) =>
  messages.filter((item) => {
    const text = `${item.type} ${item.text} ${item.location?.url || ""}`;
    return !/favicon|manifest|chrome-extension|DevTools|ResizeObserver loop|unsupported `as` value|OrgContext/i.test(text);
  });

const browser = await chromium.launch({ headless: true });
const results = [];

for (const plan of plans) {
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const consoleMessages = [];
  const pageErrors = [];
  const stamp = `${Date.now()}${plans.indexOf(plan)}`;
  const email = `codex.payment.${plan}.${stamp}@example.com`;
  const phone = `75${stamp.slice(-9)}`.slice(0, 11);
  const cpf = stamp.slice(-11).padStart(11, "1");

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

  await page.goto(`${baseUrl}/checkout?plan=${plan}&billing=monthly`, {
    waitUntil: "load",
    timeout: 45_000,
  });
  await page.waitForTimeout(2500);

  const checkoutText = await page.locator("body").innerText({ timeout: 10_000 });
  const hasBackToPlans = checkoutText.includes("Voltar aos planos");
  const hasSubmit = checkoutText.includes("Continuar para Pagamento");

  await page.getByPlaceholder("Seu nome completo").fill(`Smoke Pagamento ${plan}`);
  await page.getByPlaceholder("seu@email.com").fill(email);
  await page.getByRole("textbox", { name: "Senha", exact: true }).fill("TestPassword123!");
  await page.getByRole("textbox", { name: "Confirmar Senha", exact: true }).fill("TestPassword123!");
  await page.getByPlaceholder("(00) 00000-0000").fill(phone);
  await page.getByPlaceholder("000.000.000-00").fill(cpf);
  await page.getByPlaceholder("Sua empresa").fill(`Meta Smoke ${plan}`);

  await Promise.all([
    page.waitForURL(/checkout\.stripe\.com/, { timeout: 60_000 }),
    page.getByRole("button", { name: "Continuar para Pagamento" }).click(),
  ]);
  await page.waitForLoadState("load", { timeout: 45_000 }).catch(() => {});
  await page.waitForTimeout(2500);

  const stripeText = await page.locator("body").innerText({ timeout: 20_000 });
  const finalUrl = page.url();

  results.push({
    plan,
    billing: "monthly",
    email,
    checkoutRouteRendered: hasBackToPlans && hasSubmit,
    hasBackToPlans,
    reachedStripe: finalUrl.startsWith("https://checkout.stripe.com/"),
    finalUrlHost: new URL(finalUrl).host,
    title: await page.title(),
    stripeSnapshotHasPlan: /Meta Construtor|Plano|Basic|Profissional|Master/i.test(stripeText),
    relevantConsole: relevantConsole(consoleMessages),
    pageErrors,
  });

  await context.close();
}

await browser.close();

const output = {
  environment: {
    baseUrl,
    viewport: "1366x768",
    note: "No card data entered; validation stops at Stripe-hosted Checkout.",
  },
  results,
};

await fs.writeFile(evidencePath, JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

const failures = results.filter(
  (item) =>
    !item.checkoutRouteRendered ||
    !item.reachedStripe ||
    !item.stripeSnapshotHasPlan ||
    item.pageErrors.length > 0 ||
    item.relevantConsole.length > 0,
);

if (failures.length > 0) {
  process.exitCode = 1;
}
