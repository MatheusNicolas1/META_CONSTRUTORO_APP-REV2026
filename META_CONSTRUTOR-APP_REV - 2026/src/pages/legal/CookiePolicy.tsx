import { seoPages } from '@/config/seo';
import LegalPageLayout from './LegalPageLayout';

const CookiePolicy = () => {
  return (
    <LegalPageLayout
      seo={seoPages.cookies}
      eyebrow="Politica de cookies"
      title="Como usamos cookies e tecnologias similares"
      description="Esta pagina descreve os tipos de cookies que podem ser usados no site e na plataforma, com foco em funcionamento, seguranca, preferencias e medicao."
      updatedAt="Junho de 2026"
    >
      <section className="max-w-[64ch]">
        <h2 className="text-2xl font-semibold tracking-tight">1. O que sao cookies</h2>
        <p className="mt-4 leading-8 text-muted-foreground">
          Cookies sao pequenos arquivos ou identificadores armazenados no navegador para
          lembrar informacoes de sessao, preferencias ou interacoes. Tecnologias similares
          podem cumprir funcoes parecidas em aplicativos web.
        </p>
      </section>

      <section className="max-w-[64ch]">
        <h2 className="text-2xl font-semibold tracking-tight">2. Categorias usadas</h2>
        <div className="mt-4 divide-y divide-border border-y border-border">
          {[
            ['Essenciais', 'Necessarios para login, seguranca, sessao e funcionamento basico.'],
            ['Preferencias', 'Podem lembrar escolhas de interface ou configuracoes do usuario.'],
            ['Medicao', 'Podem ajudar a entender uso agregado do site e melhorar comunicacao publica.'],
            ['Suporte', 'Podem apoiar atendimento, diagnostico de erros e estabilidade operacional.'],
          ].map(([title, body]) => (
            <div key={title} className="py-4">
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="mt-1 text-sm leading-7 text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-[64ch]">
        <h2 className="text-2xl font-semibold tracking-tight">3. Controle pelo usuario</h2>
        <p className="mt-4 leading-8 text-muted-foreground">
          O usuario pode ajustar cookies pelo navegador. Bloquear cookies essenciais pode
          impedir login, seguranca de sessao ou partes importantes da plataforma.
        </p>
      </section>

      <section className="max-w-[64ch]">
        <h2 className="text-2xl font-semibold tracking-tight">4. Cookies de terceiros</h2>
        <p className="mt-4 leading-8 text-muted-foreground">
          Alguns provedores podem usar tecnologias similares para autenticacao, hospedagem,
          pagamentos, atendimento, seguranca ou medicao. O uso depende das ferramentas
          efetivamente configuradas em cada periodo.
        </p>
      </section>
    </LegalPageLayout>
  );
};

export default CookiePolicy;
