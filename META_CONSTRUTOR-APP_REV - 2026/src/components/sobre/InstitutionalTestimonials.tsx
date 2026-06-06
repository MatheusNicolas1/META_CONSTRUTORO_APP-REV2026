import { ClipboardCheck, FileText, MessageSquare } from 'lucide-react';

const proofItems = [
  {
    icon: ClipboardCheck,
    title: 'Prova por fluxo',
    description: 'A confianca publica deve vir de telas, documentacao e rotinas reais, nao de depoimentos simulados.',
  },
  {
    icon: FileText,
    title: 'Conteudo auditavel',
    description: 'RDO, checklist, documentos e relatorios sao explicados como capacidades do produto.',
  },
  {
    icon: MessageSquare,
    title: 'Referencias sob demanda',
    description: 'Casos, clientes e resultados devem ser compartilhados somente quando houver autorizacao e fonte valida.',
  },
];

const InstitutionalTestimonials = () => {
  return (
    <section className="overflow-x-hidden bg-muted/30 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-2xl font-semibold leading-tight text-foreground sm:text-3xl md:text-4xl">
            Credibilidade sem depoimentos ficticios
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            A comunicacao publica do Meta Construtor deve priorizar evidencias verificaveis e
            evitar nomes, logos ou resultados sem autorizacao.
          </p>
        </div>

        <div className="grid divide-y divide-border border-y border-border p-4 md:grid-cols-3 md:divide-x md:divide-y-0">
          {proofItems.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="px-3 py-6 md:px-6">
                <Icon className="mb-4 h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold leading-snug text-foreground">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default InstitutionalTestimonials;
