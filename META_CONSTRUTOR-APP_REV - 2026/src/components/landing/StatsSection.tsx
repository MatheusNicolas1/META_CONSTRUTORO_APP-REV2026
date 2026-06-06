import { Database, FileSearch, LockKeyhole, RefreshCw } from "lucide-react";

const proofItems = [
  {
    icon: Database,
    title: "Dados persistidos",
    text: "RDOs, checklists, documentos e atividades usam registros do app, nao listas demonstrativas na interface autenticada.",
  },
  {
    icon: FileSearch,
    title: "Evidencia rastreavel",
    text: "PDFs e relatorios sao gerados a partir do estado salvo e podem ser revisados antes do compartilhamento.",
  },
  {
    icon: RefreshCw,
    title: "Rotina sincronizada",
    text: "Acoes criticas passam por mutations, Edge Functions ou bloqueio explicito quando nao ha backend ativo.",
  },
  {
    icon: LockKeyhole,
    title: "Acesso protegido",
    text: "As rotas operacionais exigem sessao e respeitam papeis/permissoes definidos para a organizacao.",
  },
];

const StatsSection = () => {
  return (
    <section className="bg-muted/30 px-2 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="max-w-3xl text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
            Sem estatisticas infladas na pagina publica.
          </h2>
          <p className="mt-4 max-w-[64ch] text-base leading-7 text-muted-foreground">
            Enquanto nao houver base publica auditavel de numeros comerciais, a home destaca
            garantias operacionais verificaveis no produto.
          </p>
        </div>

        <div className="grid bg-background p-2 md:grid-cols-2 lg:grid-cols-4">
          {proofItems.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.title} className="border-b border-border p-5 last:border-b-0 md:border-r lg:border-b-0 lg:last:border-r-0">
                <div className="mb-4 flex h-10 w-10 items-center justify-center text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
