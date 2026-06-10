import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const siteUrl = "https://www.metaconstrutor.app.br";
const lastmod = "2026-06-06";

const routes = [
  ["/", "weekly", "1.0"],
  ["/preco", "weekly", "0.9"],
  ["/sobre", "monthly", "0.8"],
  ["/contato", "monthly", "0.8"],
  ["/blog", "weekly", "0.7"],
  // V2 Pages
  ["/home2", "weekly", "1.0"],
  ["/preco2", "weekly", "0.9"],
  ["/sobre2", "monthly", "0.8"],
  ["/contato2", "monthly", "0.8"],
  ["/blog2", "weekly", "0.7"],
  ["/blog/o-que-e-rdo", "monthly", "0.7"],
  ["/blog/o-que-e-rdos", "monthly", "0.6"],
  ["/blog/rdo-na-policia", "monthly", "0.5"],
  ["/blog/rdo-de-empresa", "monthly", "0.7"],
  ["/blog/como-estruturar-rdo", "monthly", "0.6"],
  ["/blog/documentos-por-obra", "monthly", "0.6"],
  ["/blog/checklist-qualidade-obra", "monthly", "0.6"],
  ["/blog/documentos-obra-exigidos-prefeitura", "monthly", "0.7"],
  ["/central-ajuda", "weekly", "0.7"],
  ["/documentacao", "monthly", "0.7"],
  ["/api", "monthly", "0.6"],
  ["/status", "daily", "0.5"],
  ["/atualizacoes", "weekly", "0.5"],
  ["/carreiras", "monthly", "0.4"],
  ["/legal/privacidade", "yearly", "0.4"],
  ["/legal/termos", "yearly", "0.4"],
  ["/legal/cookies", "yearly", "0.4"],
  ["/legal/lgpd", "yearly", "0.4"],
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    ([path, changefreq, priority]) => `  <url>
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
