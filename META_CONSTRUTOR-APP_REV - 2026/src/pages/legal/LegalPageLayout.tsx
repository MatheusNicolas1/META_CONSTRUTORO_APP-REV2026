import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import type { SeoConfig } from "@/config/seo";
import LandingNavigation from "@/components/landing/LandingNavigation";
import FooterSection from "@/components/landing/FooterSection";

interface LegalPageLayoutProps {
  seo: SeoConfig;
  eyebrow: string;
  title: string;
  description: string;
  updatedAt: string;
  children: ReactNode;
}

const LegalPageLayout = ({
  seo,
  eyebrow,
  title,
  description,
  updatedAt,
  children,
}: LegalPageLayoutProps) => {
  return (
    <>
      <SEO {...seo} />
      <LandingNavigation />

      <main className="min-h-screen bg-background pt-28">
        <section className="border-b border-border bg-[#fbfaf7] px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <nav className="mb-8 text-sm text-muted-foreground" aria-label="Breadcrumb">
              <Link to="/home" className="hover:text-foreground">
                Inicio
              </Link>
              <span className="mx-2">/</span>
              <span>{eyebrow}</span>
            </nav>

            <p className="mb-4 text-sm font-semibold text-primary">
              {eyebrow}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              {title}
            </h1>
            <p className="mt-6 max-w-[64ch] text-base leading-8 text-muted-foreground md:text-lg">
              {description}
            </p>
            <p className="mt-6 text-sm text-muted-foreground">Atualizado em {updatedAt}</p>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-12">{children}</div>
        </section>
      </main>

      <FooterSection />
    </>
  );
};

export default LegalPageLayout;
