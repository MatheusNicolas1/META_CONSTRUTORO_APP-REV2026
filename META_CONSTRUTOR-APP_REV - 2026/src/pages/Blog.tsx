import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";
import { seoPages } from "@/config/seo";
import { blogArticles } from "@/content/blogArticles";
import LandingNavigation from "@/components/landing/LandingNavigation";
import FooterSection from "@/components/landing/FooterSection";

const Blog = () => {
  return (
    <>
      <SEO {...seoPages.blog} />
      <LandingNavigation />

      <main className="min-h-screen bg-background pt-28">
        <section className="border-b border-border bg-[#fbfaf7] px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <p className="mb-4 inline-flex rounded-full border border-[#e8d9cc] bg-background px-3 py-1.5 text-sm font-medium text-primary">
              Blog
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Conteudo pratico sobre RDO, documentos e rotina de obra.
            </h1>
            <p className="mt-6 max-w-[64ch] text-base leading-8 text-muted-foreground md:text-lg">
              Guias diretos para equipes que querem padronizar registros, reduzir retrabalho
              e tornar a informacao de campo mais facil de consultar.
            </p>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="space-y-4">
              {blogArticles.map((article) => (
                <Link
                  key={article.slug}
                  to={article.path}
                  className="group block border border-border bg-background p-5 transition-colors hover:border-primary/40"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-medium text-primary">
                        {article.category} - {article.readingTime}
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                        {article.title}
                      </h2>
                      <p className="mt-3 max-w-[64ch] text-sm leading-7 text-muted-foreground">
                        {article.description}
                      </p>
                      <p className="mt-3 max-w-[64ch] text-sm leading-7 text-muted-foreground">
                        {article.intent}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-primary">
                      Ler artigo
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <FooterSection />
    </>
  );
};

export default Blog;
