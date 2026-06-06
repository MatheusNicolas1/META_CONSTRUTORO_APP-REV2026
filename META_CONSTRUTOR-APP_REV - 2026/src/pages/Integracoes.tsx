import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { N8NConfigCard } from "@/components/integrations/N8NConfigCard";
import { WhatsAppConfigCard } from "@/components/integrations/WhatsAppConfigCard";
import { GmailConfigCard } from "@/components/integrations/GmailConfigCard";
import { GoogleDriveConfigCard } from "@/components/integrations/GoogleDriveConfigCard";
import { IntegrationDashboard } from "@/components/integrations/IntegrationDashboard";
import { useIntegrations } from "@/hooks/useIntegrations";
import { IntegrationHelpers } from "@/utils/integrationHelpers";
import { useToast } from "@/hooks/use-toast";
import {
  Settings,
  Zap,
  Cloud,
  Database,
  CreditCard,
  Calendar,
  FileText,
  Mail,
  Smartphone,
  Users,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  TrendingUp,
  Play,
  Pause,
  BarChart3
} from "lucide-react";

const Integracoes = () => {
  const { toast } = useToast();
  const {
    integrations,
    logs,
    saveN8NConfig,
    testN8NConfig,
    saveWhatsAppConfig,
    testWhatsAppConfig,
    saveGmailConfig,
    testGmailConfig,
    connectGmailOAuth,
    saveGoogleDriveConfig,
    testGoogleDriveConfig,
    connectGoogleDriveOAuth,
    loadIntegrations,
    loadLogs,
    statuses,
    exportLogs
  } = useIntegrations();

  // Serviços disponíveis conforme blueprint
  const integracoes = [
    {
      id: 'whatsapp',
      nome: "WhatsApp Business",
      categoria: "Comunicação",
      descricao: "Canal configuravel para notificacoes quando credenciais e backend estiverem ativos",
      icon: Smartphone,
      conectado: false,
      color: "text-construction-green",
      fluxos: ["Obra Criada", "RDO Aprovado", "Atividade Atrasada"],
      priority: 1
    },
    {
      id: 'gmail',
      nome: "Gmail",
      categoria: "E-mail",
      descricao: "Canal configuravel para e-mails transacionais e testes reais de envio",
      icon: Mail,
      conectado: false,
      color: "text-destructive",
      fluxos: ["Relatórios Diários", "Confirmações", "Alertas Urgentes"],
      priority: 2
    },
    {
      id: 'googledrive',
      nome: "Google Drive",
      categoria: "Armazenamento",
      descricao: "Credenciais para organizar arquivos no Drive quando o fluxo real estiver conectado",
      icon: Cloud,
      conectado: false,
      color: "text-construction-blue",
      fluxos: ["Upload Documentos", "Organizacao de Arquivos"],
      priority: 3
    },
    {
      id: 'googlecalendar',
      nome: "Google Agenda",
      categoria: "Agenda",
      descricao: "Planejado para agenda externa; configure via N8N ate haver backend dedicado",
      icon: Calendar,
      conectado: false,
      color: "text-construction-orange",
      fluxos: ["Cronogramas", "Lembretes", "Reuniões"],
      priority: 4
    },
    {
      id: 'n8n',
      nome: "N8N Automation",
      categoria: "Automação",
      descricao: "Plataforma de workflows configurada pelo desenvolvedor e validada por teste real",
      icon: Zap,
      conectado: false,
      color: "text-construction-orange",
      fluxos: ["Automação Avançada"],
      priority: 8,
      isAdvanced: true
    }
  ];

  const categorias = [
    { nome: "Todas", count: integracoes.length },
    { nome: "Comunicação", count: integracoes.filter(i => i.categoria === "Comunicação").length },
    { nome: "E-mail", count: integracoes.filter(i => i.categoria === "E-mail").length },
    { nome: "Armazenamento", count: integracoes.filter(i => i.categoria === "Armazenamento").length },
    { nome: "Agenda", count: integracoes.filter(i => i.categoria === "Agenda").length },
    { nome: "Organização", count: integracoes.filter(i => i.categoria === "Organização").length },
    { nome: "Colaboração", count: integracoes.filter(i => i.categoria === "Colaboração").length },
    { nome: "Relatórios", count: integracoes.filter(i => i.categoria === "Relatórios").length }
  ];

  const [selectedCategoria, setSelectedCategoria] = useState("Todas");
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);

  const enrichedIntegracoes = integracoes.map((integracao) => {
    const saved = integrations.find((item) => item.id === integracao.id);
    const statusInfo = statuses[integracao.id];
    const conectado = saved?.status === "connected" && statusInfo?.hasEvidence === true && statusInfo?.isHealthy === true;
    return {
      ...integracao,
      conectado,
      configurado: saved?.isConfigured === true,
      config: saved?.configuration,
      statusInfo,
    };
  });

  const filteredIntegracoes = selectedCategoria === "Todas"
    ? enrichedIntegracoes
    : enrichedIntegracoes.filter(i => i.categoria === selectedCategoria);

  const sortedIntegracoes = filteredIntegracoes.sort((a, b) => a.priority - b.priority);

  const handleTestarCadeiaIntegracoes = async () => {
    try {
      toast({
        title: "Iniciando teste",
        description: "Testando cadeia completa de integrações...",
      });

      const result = await IntegrationHelpers.testIntegrationChain();
      await loadLogs();
      await loadIntegrations();

      toast({
        title: result.success ? "Teste com evidencia registrada" : "Falha no teste",
        description: result.success ? result.message : result.error,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Erro no teste",
        description: "Falha ao executar teste da cadeia de integrações",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Configurações de Integrações</h1>
          <p className="text-muted-foreground text-sm md:text-base">Conecte servicos externos somente quando houver credenciais, backend e teste real disponiveis.</p>
        </div>
        <Button onClick={handleTestarCadeiaIntegracoes} variant="outline">
          <Play className="h-4 w-4 mr-2" />
          Testar Integrações
        </Button>
      </div>

      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
          <TabsTrigger value="blueprint">Blueprint</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-6">
          {/* Filtros por categoria */}
          <div className="flex flex-wrap gap-2">
            {categorias.map((categoria) => (
              <Button
                key={categoria.nome}
                variant={selectedCategoria === categoria.nome ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategoria(categoria.nome)}
                className="text-xs"
              >
                {categoria.nome} ({categoria.count})
              </Button>
            ))}
          </div>

          {/* Cards de Integrações - Layout conforme Blueprint */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedIntegracoes.map((integracao) => (
              <Card key={integracao.id} className="bg-card border-border hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <integracao.icon className={`h-6 w-6 ${integracao.color}`} />
                      <div>
                        <CardTitle className="text-base font-medium text-card-foreground">{integracao.nome}</CardTitle>
                        <Badge variant={integracao.conectado ? "default" : "secondary"} className="mt-1">
                          {integracao.conectado ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Conectado
                            </>
                          ) : integracao.configurado ? (
                            <>
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Aguardando teste
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Desconectado
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                    {integracao.isAdvanced && (
                      <Badge variant="outline" className="text-xs">
                        Avançado
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm text-muted-foreground">
                    {integracao.descricao}
                  </CardDescription>

                  {/* Fluxos previstos */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Fluxos previstos:</p>
                    <div className="flex flex-wrap gap-1">
                      {integracao.fluxos.map((fluxo, index) => (
                        <Badge key={index} variant="outline" className="text-xs px-2 py-1">
                          {fluxo}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Botão de ação */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        className="w-full"
                        variant={integracao.conectado ? "outline" : "default"}
                        onClick={() => setSelectedIntegration(integracao.id)}
                      >
                        {integracao.conectado ? (
                          <>
                            <Settings className="h-4 w-4 mr-2" />
                            Configurar
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            {integracao.configurado ? "Testar/Configurar" : "Conectar"}
                          </>
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <integracao.icon className={`h-5 w-5 ${integracao.color}`} />
                          {integracao.nome}
                        </DialogTitle>
                        <DialogDescription>
                          Configure as credenciais e permissões para {integracao.nome}
                        </DialogDescription>
                      </DialogHeader>

                      {/* Renderizar componente de configuração específico */}
                      {selectedIntegration === 'n8n' && (
                        <N8NConfigCard
                          config={integracao.config as any}
                          status={integracao.statusInfo}
                          onSave={saveN8NConfig}
                          onTest={testN8NConfig}
                        />
                      )}
                      {selectedIntegration === 'whatsapp' && (
                        <WhatsAppConfigCard
                          config={integracao.config as any}
                          status={integracao.statusInfo}
                          onSave={saveWhatsAppConfig}
                          onTest={testWhatsAppConfig}
                        />
                      )}
                      {selectedIntegration === 'gmail' && (
                        <GmailConfigCard
                          config={integracao.config as any}
                          status={integracao.statusInfo}
                          onSave={saveGmailConfig}
                          onTest={testGmailConfig}
                          onOAuthConnect={connectGmailOAuth}
                        />
                      )}
                      {selectedIntegration === 'googledrive' && (
                        <GoogleDriveConfigCard
                          config={integracao.config as any}
                          status={integracao.statusInfo}
                          onSave={saveGoogleDriveConfig}
                          onTest={testGoogleDriveConfig}
                          onOAuthConnect={connectGoogleDriveOAuth}
                        />
                      )}
                      {selectedIntegration && !['n8n', 'whatsapp', 'gmail', 'googledrive'].includes(selectedIntegration) && (
                        <Card className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <integracao.icon className={`h-8 w-8 ${integracao.color}`} />
                              <div>
                                <h3 className="font-semibold text-lg">{integracao.nome}</h3>
                                <p className="text-muted-foreground">{integracao.descricao}</p>
                              </div>
                            </div>
                            <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                              Configure este fluxo pela integracao N8N Automation usando os eventos da aba Blueprint. As credenciais e execucoes ficam salvas na tabela integrations da organizacao.
                            </div>
                            <Button onClick={() => setSelectedIntegration('n8n')} className="gradient-construction border-0">
                              <Settings className="h-4 w-4 mr-2" />
                              Configurar via N8N
                            </Button>
                          </div>
                        </Card>
                      )}
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="dashboard">
          <IntegrationDashboard
            logs={logs}
            onRefresh={async () => {
              await loadIntegrations();
              await loadLogs();
            }}
            statuses={Object.values(statuses)}
          />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Avançadas</CardTitle>
                <CardDescription>Configurações técnicas para desenvolvedores</CardDescription>
              </CardHeader>
              <CardContent>
                <N8NConfigCard
                  onSave={saveN8NConfig}
                  onTest={testN8NConfig}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="blueprint" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Blueprint de Integrações</CardTitle>
              <CardDescription>Blueprint de fluxos pretendidos. Cada fluxo so deve ser tratado como ativo apos configuracao e teste real.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4">
                  <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                    <h4 className="font-semibold flex items-center gap-2 text-green-800 dark:text-green-200">
                      <CheckCircle className="h-4 w-4" />
                      Fluxo 1: Obra Criada
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                      Quando uma obra e criada: acionar notificacoes e organizacao externa somente se as integracoes estiverem conectadas e testadas.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                    <h4 className="font-semibold flex items-center gap-2 text-blue-800 dark:text-blue-200">
                      <CheckCircle className="h-4 w-4" />
                      Fluxo 2: RDO Aprovado
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                      Quando RDO e aprovado: envio por e-mail/WhatsApp permanece dependente de integracao conectada e backend valido.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-950">
                    <h4 className="font-semibold flex items-center gap-2 text-purple-800 dark:text-purple-200">
                      <CheckCircle className="h-4 w-4" />
                      Fluxo 3: Documento Carregado
                    </h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">
                      Quando documento e carregado: envio ao Drive fica bloqueado ate existir conexao real e teste aprovado.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950">
                    <h4 className="font-semibold flex items-center gap-2 text-red-800 dark:text-red-200">
                      <AlertCircle className="h-4 w-4" />
                      Fluxo 4: Atividade Atrasada
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                      Quando atividade atrasa: alertas externos dependem de canais conectados; sem isso, o app nao deve simular envio.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-950">
                    <h4 className="font-semibold flex items-center gap-2 text-amber-800 dark:text-amber-200">
                      <Settings className="h-4 w-4" />
                      Fluxo 5: Relatório Diário
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
                      Relatorio diario: rotina agendada ainda depende de backend de agendamento e envio validado.
                    </p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-construction-light border border-construction rounded-lg">
                  <h4 className="font-medium text-construction-dark">Critérios de Aceite ✅</h4>
                  <ul className="mt-2 space-y-1 text-sm text-construction-dark">
                    <li>Registrar configuracao somente quando credenciais obrigatorias forem informadas.</li>
                    <li>Executar teste real antes de marcar uma integracao como conectada.</li>
                    <li>Manter webhooks bloqueados enquanto nao houver backend real ativo.</li>
                    <li>Conexao N8N permanece gerenciada pelo desenvolvedor.</li>
                    <li>Novos aplicativos entram como planejados ate haver contrato tecnico validado.</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Integracoes;
