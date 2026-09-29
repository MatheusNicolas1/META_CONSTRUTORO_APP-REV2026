import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const siteUrl = "https://www.metaconstrutor.app.br";
const fallbackLastmod = "2026-06-06";

// Rotas fixas indexáveis (núcleo + V2 + legais). [path, changefreq, priority]
const coreRoutes = [
  ["/", "weekly", "1.0"],
  ["/preco", "weekly", "0.9"],
  ["/sobre", "monthly", "0.8"],
  ["/contato", "monthly", "0.8"],
  ["/blog", "weekly", "0.7"],
  // V2 (/home2, /preco2, /sobre2, /contato2, /blog2) fora do sitemap: duplicam as páginas
  // principais e estão com noindex até a consolidação (PRD_ROTAS_PUBLICAS §5).
  // Conteúdo, suporte e autoridade
  ["/central-ajuda", "weekly", "0.7"],
  ["/documentacao", "monthly", "0.7"],
  ["/api", "monthly", "0.6"],
  ["/status", "daily", "0.5"],
  ["/atualizacoes", "weekly", "0.5"],
  ["/carreiras", "monthly", "0.4"],
  // Legal
  ["/legal/privacidade", "yearly", "0.4"],
  ["/legal/termos", "yearly", "0.4"],
  ["/legal/cookies", "yearly", "0.4"],
  ["/legal/lgpd", "yearly", "0.4"],
];

// Artigos do blog: lidos do catálogo pt-BR (fonte de verdade única).
// Cada artigo tem `path: '/blog/<slug>'` e `updatedAt: 'YYYY-MM-DD'`.
function readBlogArticles() {
  const contentPath = resolve("src/content/blogArticles.pt-BR.ts");
  if (!existsSync(contentPath)) return [];

  const source = readFileSync(contentPath, "utf8");
  const articles = [];
  const re = /path:\s*'([^']+)'[\s\S]*?updatedAt:\s*'([^']+)'/g;
  let match;
  while ((match = re.exec(source)) !== null) {
    const path = match[1];
    // Somente rotas reais de artigo em /blog/<slug>
    if (!path.startsWith("/blog/")) continue;
    articles.push({ path, lastmod: match[2] || fallbackLastmod });
  }
  return articles;
}

const blogArticles = readBlogArticles();

// Deduplica por path preservando a ordem
const seen = new Set();
const uniqueArticles = blogArticles.filter((article) => {
  if (seen.has(article.path)) return false;
  seen.add(article.path);
  return true;
});

// Funcionalidades, soluções e modelos: lidos de src/content/marketingPages.ts (`path: '...'`).
function readMarketingPaths() {
  const contentPath = resolve("src/content/marketingPages.ts");
  if (!existsSync(contentPath)) return [];
  const source = readFileSync(contentPath, "utf8");
  return [...source.matchAll(/^\s*path:\s*'(\/(?:funcionalidades|solucoes|modelos)[^']*)'/gm)].map((match) => match[1]);
}

const marketingRoutes = readMarketingPaths().map((path) => ({
  path,
  changefreq: "monthly",
  priority: path.startsWith("/funcionalidades/") ? "0.8" : "0.7",
  lastmod: "2026-09-29",
}));

const routes = [
  ...coreRoutes.map(([path, changefreq, priority]) => ({
    path,
    changefreq,
    priority,
    lastmod: fallbackLastmod,
  })),
  ...marketingRoutes,
  ...uniqueArticles.map((article) => ({
    path: article.path,
    changefreq: "monthly",
    priority: "0.6",
    lastmod: article.lastmod,
  })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    ({ path, changefreq, priority, lastmod }) => `  <url>
    <loc>${siteUrl}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

writeFileSync(resolve("public/sitemap.xml"), xml);

const distSitemapPath = resolve("dist/sitemap.xml");
if (existsSync(resolve("dist"))) {
  writeFileSync(distSitemapPath, xml);
}

console.log(`Sitemap gerado com ${routes.length} rotas (${uniqueArticles.length} artigos do blog).`);
