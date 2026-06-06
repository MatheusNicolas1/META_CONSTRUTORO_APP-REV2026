import { seoPages } from '@/config/seo';
import LegalPageLayout from './LegalPageLayout';

const PrivacyPolicy = () => {
  return (
    <LegalPageLayout
      seo={seoPages.privacidade}
      eyebrow="Politica de privacidade"
      title="Como o Meta Construtor trata dados pessoais"
      description="Esta pagina explica, em linguagem direta, quais dados podem ser tratados na plataforma e como o titular pode buscar informacoes ou exercer direitos."
      updatedAt="Junho de 2026"
    >
      <section className="max-w-[64ch]">
        <h2 className="text-2xl font-semibold tracking-tight">1. Dados que podem ser tratados</h2>
        <p className="mt-4 leading-8 text-muted-foreground">
          A plataforma pode tratar dados de cadastro, contato, organizacao, usuarios, obras,
          equipes, atividades, RDOs, checklists, documentos, anexos, registros de acesso e
          informacoes necessarias para suporte e seguranca.
        </p>
      </section>

      <section className="max-w-[64ch]">
        <h2 className="text-2xl font-semibold tracking-tight">2. Finalidades</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 leading-8 text-muted-foreground">
          <li>Operar a plataforma e permitir a gestao de obras.</li>
          <li>Controlar acesso, permissoes e seguranca da conta.</li>
          <li>Gerar registros, documentos, relatorios e historico operacional.</li>
          <li>Responder solicitacoes de suporte, vendas ou relacionamento.</li>
          <li>Cumprir obrigacoes legais, contratuais e regulatorias quando aplicavel.</li>
        </ul>
      </section>

      <section className="max-w-[64ch]">
        <h2 className="text-2xl font-semibold tracking-tight">3. Compartilhamento</h2>
        <p className="mt-4 leading-8 text-muted-foreground">
          Dados pessoais nao sao vendidos. O compartilhamento pode ocorrer com provedores
          necessarios para hospedagem, autenticacao, pagamento, atendimento, comunicacao,
          seguranca ou cumprimento de obrigacao legal.
        </p>
      </section>

      <section className="max-w-[64ch]">
        <h2 className="text-2xl font-semibold tracking-tight">4. Direitos do titular</h2>
        <p className="mt-4 leading-8 text-muted-foreground">
          O titular pode solicitar confirmacao de tratamento, acesso, correcao, portabilidade,
          informacoes sobre compartilhamento, revisao de consentimento e eliminacao quando
          cabivel. Solicitacoes devem ser feitas pelos canais oficiais de contato.
        </p>
      </section>

      <section className="max-w-[64ch]">
        <h2 className="text-2xl font-semibold tracking-tight">5. Retencao e seguranca</h2>
        <p className="mt-4 leading-8 text-muted-foreground">
          Os dados sao mantidos pelo tempo necessario para operacao, seguranca, auditoria,
          obrigacoes legais e defesa de direitos. A plataforma usa controles tecnicos e
          organizacionais para reduzir riscos de acesso indevido.
        </p>
      </section>
    </LegalPageLayout>
  );
};

export default PrivacyPolicy;
