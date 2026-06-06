import { HelpCircle } from "lucide-react";

const questions = [
  {
    question: "O Meta Construtor cria RDO automaticamente?",
    answer:
      "Nao. O app organiza o registro digital, mas a equipe ainda precisa informar atividades, equipes, ocorrencias e evidencias reais da obra.",
  },
  {
    question: "As integracoes com e-mail e arquivos ja enviam tudo sozinhas?",
    answer:
      "Somente os fluxos com backend configurado executam envio real. Quando nao ha backend ativo, a interface deve bloquear ou explicar a limitacao.",
  },
  {
    question: "Os numeros da home sao estatisticas de clientes?",
    answer:
      "Esta versao evita metricas comerciais sem fonte publica. A pagina destaca capacidades verificaveis do produto e nao indicadores inflados.",
  },
  {
    question: "Posso testar com dados reais?",
    answer:
      "Sim. Entre no app, use uma conta autorizada e valide os fluxos autenticados com obras, RDOs, checklists e documentos persistidos.",
  },
];

const FAQSection = () => {
  return (
    <section className="bg-background px-2 py-12 md:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
            O que o produto faz, sem promessa ficticia.
          </h2>
        </div>

        <div className="border-y border-border p-2">
          {questions.map((item) => (
            <article key={item.question} className="border-b border-border p-5 last:border-b-0">
              <div className="flex gap-3">
                <HelpCircle className="mt-1 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h3 className="font-semibold text-foreground">{item.question}</h3>
                  <p className="mt-2 max-w-[64ch] text-sm leading-6 text-muted-foreground">{item.answer}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
