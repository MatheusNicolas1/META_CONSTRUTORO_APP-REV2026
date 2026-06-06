import { ClipboardCheck, FileText, FolderKanban, Users } from "lucide-react";

const workflow = [
  {
    icon: FolderKanban,
    title: "Obra organizada",
    description: "Cada rotina fica conectada a uma obra, responsavel e etapa.",
  },
  {
    icon: FileText,
    title: "RDO registrado",
    description: "O dia de campo ganha contexto, fotos, atividades e pendencias.",
  },
  {
    icon: ClipboardCheck,
    title: "Checklist verificavel",
    description: "Critérios de qualidade deixam de depender de memoria ou planilha.",
  },
  {
    icon: Users,
    title: "Equipe alinhada",
    description: "Gestores acompanham responsabilidades sem procurar informacao solta.",
  },
];

export function VisualWorkflowSection() {
  return (
    <section className="bg-[#fbfaf7] px-3 py-12 md:py-16">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
        <div className="space-y-6">
          <figure className="overflow-hidden bg-background">
            <img
              src="/marketing/obras-reais/equipe-cobertura-metalica.jpg"
              alt="Equipe trabalhando em cobertura metalica durante execucao de obra"
              className="h-64 w-full object-cover"
              loading="lazy"
            />
          </figure>
          <p className="text-sm font-semibold text-primary">Fluxo operacional</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Da rotina de campo ao historico consultavel.
          </h2>
          <p className="mt-5 max-w-[64ch] text-base leading-8 text-muted-foreground">
            A pagina publica precisa explicar o produto com clareza: obra, RDO, checklist,
            documentos e equipe fazem parte do mesmo ciclo de decisao.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {workflow.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.title} className="border border-border bg-background p-5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
