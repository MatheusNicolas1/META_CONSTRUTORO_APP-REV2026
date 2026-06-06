import { ArrowRight, Eye, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const VideoDemo = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-background px-2 py-2">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="flex flex-col justify-center">
          <h2 className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
            Sem video ficticio: teste o fluxo dentro da plataforma.
          </h2>
          <p className="mt-4 max-w-[64ch] text-base leading-7 text-muted-foreground">
            A demonstracao publica foi substituida por caminhos reais para login, plano gratuito e atendimento.
            Assim a experiencia mostrada depende do app ativo, nao de uma animacao com dados inventados.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="py-3" onClick={() => navigate("/login")}>
              <LogIn className="mr-2 h-4 w-4" />
              Entrar no app
            </Button>
            <Button size="lg" variant="outline" className="py-3" onClick={() => navigate("/preco")}>
              Ver planos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="bg-muted/40 p-5">
          <div className="p-5">
            <div className="mb-5 flex items-center gap-3 border-b border-border px-2 py-4">
              <div className="flex h-10 w-10 items-center justify-center text-primary">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">O que validar no teste</h3>
                <p className="text-sm text-muted-foreground">Use dados reais da sua conta ou do ambiente QA.</p>
              </div>
            </div>
            <ul className="divide-y divide-border text-sm leading-6 text-muted-foreground">
              <li className="py-3 first:pt-0">1. Criar ou abrir uma obra existente.</li>
              <li className="py-3">2. Registrar RDO, checklist ou documento vinculado.</li>
              <li className="py-3">3. Gerar PDF ou enviar fluxo somente quando a integracao estiver configurada.</li>
              <li className="py-3 last:pb-0">4. Revisar historico e permissoes na rota autenticada.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoDemo;
