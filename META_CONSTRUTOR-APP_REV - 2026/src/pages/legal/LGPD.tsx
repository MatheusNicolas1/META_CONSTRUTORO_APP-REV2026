import { seoPages } from '@/config/seo';
import LegalPageLayout from './LegalPageLayout';

const LGPD = () => {
  return (
    <LegalPageLayout
      seo={seoPages.lgpd}
      eyebrow="LGPD"
      title="Direitos de privacidade e protecao de dados"
      description="Esta pagina resume como o Meta Construtor organiza pedidos relacionados a LGPD e quais principios orientam o tratamento de dados pessoais."
      updatedAt="Junho de 2026"
    >
      <section className="max-w-[64ch]">
        <h2 className="text-2xl font-semibold tracking-tight">1. Principios de tratamento</h2>
        <p className="mt-4 leading-8 text-muted-foreground">
          O tratamento de dados deve observar finalidade, necessidade, transparencia,
          seguranca, prevencao, responsabilizacao e respeito aos direitos dos titulares.
          A plataforma deve limitar acesso conforme organizacao, perfil e necessidade.
        </p>
      </section>

      <section className="max-w-[64ch]">
        <h2 className="text-2xl font-semibold tracking-tight">2. Bases legais</h2>
        <p className="mt-4 leading-8 text-muted-foreground">
          O tratamento pode se apoiar em execucao de contrato, cumprimento de obrigacao
          legal, consentimento, legitimo interesse ou outras bases previstas na LGPD,
          conforme a finalidade concreta e o contexto da organizacao.
        </p>
      </section>

      <section className="max-w-[64ch]">
        <h2 className="text-2xl font-semibold tracking-tight">3. Direitos do titular</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 leading-8 text-muted-foreground">
          <li>Confirmar se ha tratamento de dados pessoais.</li>
          <li>Acessar, corrigir ou atualizar dados quando aplicavel.</li>
          <li>Solicitar portabilidade, anonimizacao, bloqueio ou eliminacao nos casos cabiveis.</li>
          <li>Obter informacoes sobre compartilhamento e criterios de tratamento.</li>
          <li>Revogar consentimento quando essa for a base legal usada.</li>
        </ul>
      </section>

      <section className="max-w-[64ch]">
        <h2 className="text-2xl font-semibold tracking-tight">4. Como solicitar atendimento</h2>
        <p className="mt-4 leading-8 text-muted-foreground">
          Pedidos de privacidade devem ser enviados pelos canais oficiais do Meta Construtor,
          com identificacao suficiente para validar a titularidade ou representacao. O prazo
          de resposta depende da natureza do pedido, da verificacao necessaria e das regras
          legais aplicaveis.
        </p>
      </section>

      <section className="max-w-[64ch]">
        <h2 className="text-2xl font-semibold tracking-tight">5. Incidentes e seguranca</h2>
        <p className="mt-4 leading-8 text-muted-foreground">
          Em caso de incidente relevante envolvendo dados pessoais, a avaliacao deve
          considerar risco aos titulares, medidas de contencao, comunicacao apropriada
          e eventuais notificacoes exigidas pela legislacao.
        </p>
      </section>
    </LegalPageLayout>
  );
};

export default LGPD;
