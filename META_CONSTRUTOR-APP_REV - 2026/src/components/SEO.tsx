import { Helmet } from "react-helmet-async";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, absoluteUrl, type JsonLd } from "@/config/seo";

interface SEOProps {
  title: string; // < 60 chars
  description?: string; // < 160 chars
  canonical?: string;
  robots?: string;
  image?: string;
  type?: "website" | "article";
  jsonLd?: JsonLd | JsonLd[];
}

const normalizeJsonLd = (jsonLd?: JsonLd | JsonLd[]) => {
  if (!jsonLd) return [];
  return Array.isArray(jsonLd) ? jsonLd : [jsonLd];
};

const SEO = ({
  title,
  description,
  canonical,
  robots = "index,follow",
  image = DEFAULT_OG_IMAGE,
  type = "website",
  jsonLd,
}: SEOProps) => {
  const canonicalUrl = canonical ? absoluteUrl(canonical) : SITE_URL;
  const imageUrl = absoluteUrl(image);
  const resolvedDescription =
    description || "Plataforma web para gestao de obras, RDO digital, equipes, documentos e relatorios.";

  const schemas = normalizeJsonLd(jsonLd);

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={resolvedDescription} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={resolvedDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:locale" content="pt_BR" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={resolvedDescription} />
      <meta name="twitter:image" content={imageUrl} />

      {schemas.map((entry, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(entry)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
