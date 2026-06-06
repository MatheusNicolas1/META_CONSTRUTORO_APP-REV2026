import { Building2, ClipboardCheck, FileText, UsersRound } from "lucide-react";

const features = [
  {
    icon: Building2,
    title: "Obras organizadas",
    text: "Cada obra concentra dados cadastrais, equipe, documentos e historico de acompanhamento.",
  },
  {
    icon: FileText,
    title: "RDO com evidencias",
    text: "Registre atividades, equipe, equipamentos, ocorrencias e anexos vinculados ao dia de trabalho.",
  },
  {
    icon: ClipboardCheck,
    title: "Checklist por rotina",
    text: "Padronize verificacoes recorrentes e acompanhe itens pendentes, conformes ou nao conformes.",
  },
  {
    icon: UsersRound,
    title: "Responsaveis claros",
    text: "Permissoes e papeis ajudam a separar quem registra, revisa, aprova e acompanha.",
  },
];

const ModernFeaturesSection = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h2 className="max-w-3xl text-2xl font-semibold leading-tight text-foreground sm:text-3xl md:text-4xl">
          O essencial para administrar a rotina da obra.
        </h2>
        <p className="mt-4 max-w-[64ch] text-base leading-7 text-muted-foreground">
          A comunicacao comercial abaixo descreve modulos existentes do app, sem apresentar
          dashboards ficticios ou indicadores sem fonte publica.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <article key={feature.title} className="border-b border-border p-5 last:border-b-0 sm:border-r lg:border-b-0 lg:last:border-r-0">
              <div className="mb-4 flex h-11 w-11 items-center justify-center text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.text}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default ModernFeaturesSection;
