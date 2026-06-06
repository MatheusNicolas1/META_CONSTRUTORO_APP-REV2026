import { seoPages } from '@/config/seo';
import LegalPageLayout from './LegalPageLayout';

const TermsOfService = () => {
  return (
    <LegalPageLayout
      seo={seoPages.termos}
      eyebrow="Termos de uso"
      title="Regras de uso do Meta Construtor"
      description="Estes termos organizam as condicoes gerais para acesso e uso da plataforma web de gestao de obras, RDOs, checklists, documentos e relatorios."
      updatedAt="Junho de 2026"
    >
      <section className="max-w-[64ch]">
        <h2 className="text-2xl font-semibold tracking-tight">1. Uso da plataforma</h2>
        <p className="mt-4 leading-8 text-muted-foreground">
          O Meta Construtor e uma plataforma web para construtoras e equipes autorizadas.
          O usuario deve usar a ferramenta de forma licita, manter dados corretos e proteger
          suas credenciais de acesso.
        </p>
      </section>

      <section className="max-w-[64ch]">
        <h2 className="text-2xl font-semibold tracking-tight">2. Conta, organizacao e permissoes</h2>
        <p className="mt-4 leading-8 text-muted-foreground">
          Cada organizacao e responsavel por definir usuarios, perfis, permissoes e dados
          inseridos na plataforma. Acoes realizadas por usuarios autorizados podem gerar
          registros operacionais e historico de auditoria.
        </p>
      </section>

      <section className="max-w-[64ch]">
        <h2 className="text-2xl font-semibold tracking-tight">3. Planos e pagamentos</h2>
        <p className="mt-4 leading-8 text-muted-foreground">
          Planos, limites, valores e condicoes comerciais devem seguir a pagina de precos,
          proposta comercial ou contrato vigente. Pagamentos podem ser processados por
          provedores especializados e sujeitos as regras desses fornecedores.
        </p>
      </section>

      <section className="max-w-[64ch]">
        <h2 className="text-2xl font-semibold tracking-tight">4. Uso aceitavel</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 leading-8 text-muted-foreground">
          <li>Nao usar a plataforma para finalidade ilegal, fraudulenta ou abusiva.</li>
          <li>Nao tentar acessar dados de outra organizacao sem autorizacao.</li>
          <li>Nao interferir na seguranca, disponibilidade ou integridade do servico.</li>
          <li>Nao compartilhar credenciais ou burlar controles de acesso.</li>
        </ul>
      </section>

      <section className="max-w-[64ch]">
        <h2 className="text-2xl font-semibold tracking-tight">5. Dados e conteudo da organizacao</h2>
        <p className="mt-4 leading-8 text-muted-foreground">
          A organizacao continua responsavel pelos dados de obra, documentos e informacoes
          inseridas por sua equipe. A plataforma fornece os meios para registrar, organizar,
          consultar e exportar esses dados conforme os recursos contratados.
        </p>
      </section>
    </LegalPageLayout>
  );
};

export default TermsOfService;
