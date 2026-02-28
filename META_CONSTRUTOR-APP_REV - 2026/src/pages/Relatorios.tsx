import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/DatePicker";
import { Badge } from "@/components/ui/badge";
import { RDOReportSection } from "@/components/reports/RDOReportSection";

import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Building2,
  Users,
  Wrench,
  ClipboardList,
  Download,
  FileText,
  PieChart,
  Activity,
  CalendarDays
} from "lucide-react";
import { useObras } from "@/hooks/useObras";
import { useRDOs } from "@/hooks/useRDOs";
import { format, subDays, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useEquipesSupabase } from "@/hooks/useEquipesSupabase";
import { useEquipamentosSupabase } from "@/hooks/useEquipamentosSupabase";
import { RDOSupabase } from "@/types/supabase-rdo";
import { RDO, RDOStatus } from "@/types/rdo";
import { useDownload } from "@/hooks/useDownload";
import { generateStandardFilename } from "@/utils/downloadHelper";
import { Loader2 } from "lucide-react";

const Relatorios = () => {
  const [selectedObra, setSelectedObra] = useState("all");
  const [selectedPeriodo, setSelectedPeriodo] = useState("");
  const [dataInicio, setDataInicio] = useState<Date | undefined>();
  const [dataFim, setDataFim] = useState<Date | undefined>();

  const { obras: obrasData, isLoading: isLoadingObras } = useObras();
  const { rdos: rdosData, isLoading: isLoadingRDOs } = useRDOs();
  const { equipes: equipesData } = useEquipesSupabase();
  const { equipamentos: equipamentosData } = useEquipamentosSupabase();
  const { isLoading: isDownloading, startDownload } = useDownload();

  // Filter RDOs based on selection
  const filteredRDOs = rdosData?.filter(rdo => {
    // Obra filter
    if (selectedObra !== "all" && rdo.obra_id?.toString() !== selectedObra) return false;

    // Date filter
    if (selectedPeriodo === "custom" && dataInicio && dataFim) {
      const rdoDate = parseISO(rdo.data);
      return isWithinInterval(rdoDate, { start: dataInicio, end: dataFim });
    } else if (selectedPeriodo) {
      const days = parseInt(selectedPeriodo);
      if (!isNaN(days)) {
        const rdoDate = parseISO(rdo.data);
        const cutoffDate = subDays(new Date(), days);
        return rdoDate >= cutoffDate;
      }
    }

    return true;
  }) || [];

  // Adapt Supabase RDO data to component interface
  // Note: The useRDOs hook returns a simpler structure than the detailed RDO interface
  // We map what we can and provide defaults for the rest to avoid crashes

  const mappedRDOs: RDO[] = filteredRDOs.map((rdo: RDOSupabase) => ({
    id: rdo.id,
    data: rdo.data,
    obraId: rdo.obra_id,
    obraNome: rdo.obras?.nome || "Sem nome",
    status: rdo.status as RDOStatus,
    criadoPorId: rdo.criado_por_id,
    criadoPorNome: "Usuário", // Name not fetched in simple query
    periodo: rdo.periodo as RDO['periodo'],
    clima: rdo.clima,
    equipeOciosa: rdo.equipe_ociosa,
    atividadesRealizadas: [], // Detailed data might not be in the fetch
    atividadesExtras: [],
    equipesPresentes: [],
    equipamentosUtilizados: [],
    equipamentosQuebrados: [],
    acidentes: [],
    materiaisFalta: [],
    estoqueMateriais: [],
    observacoes: rdo.observacoes || "",
    imagens: [],
    documentos: [],
    criadoEm: rdo.created_at,
    atualizadoEm: rdo.updated_at || rdo.created_at,
  }));

  const handleExportData = () => {
    if (mappedRDOs.length === 0) {
      toast.error("Não há dados para exportar com os filtros atuais.");
      return;
    }

    const headers = ["ID", "Data", "Obra", "Período", "Clima", "Status", "Observações"];
    const csvContent = [
      headers.join(","),
      ...mappedRDOs.map(row => [
        row.id,
        row.data,
        `"${row.obraNome}"`,
        row.periodo,
        row.clima,
        row.status,
        `"${row.observacoes}"`
      ].join(","))
    ].join("\n");

    const filename = generateStandardFilename("relatorio", "rdos", "csv");
    startDownload(Promise.resolve(csvContent), filename, "text/csv;charset=utf-8;");
  };

  const calculateMetrics = () => {
    const totalObras = obrasData?.length || 0;

    // Progresso Médio
    const totalProgresso = obrasData?.reduce((acc, obra) => acc + (obra.progresso || 0), 0) || 0;
    const progressoMedio = totalObras > 0 ? Math.round(totalProgresso / totalObras) : 0;

    // RDOs Emitidos
    const totalRDOs = rdosData?.length || 0;

    // Colaboradores Ativos
    const totalColaboradores = equipesData?.filter(e => e.ativo).length || 0;

    return {
      totalObras,
      progressoMedio,
      totalRDOs,
      totalColaboradores
    };
  };

  const metrics = calculateMetrics();

  const handleExportObras = () => {
    if (!obrasData?.length) {
      toast.error("Não há dados de obras para exportar.");
      return;
    }
    const headers = ["ID", "Nome", "Cliente", "Status", "Progresso (%)", "Responsável"];
    const csvContent = [
      headers.join(","),
      ...obrasData.map((row: any) => [
        row.id,
        `"${row.nome}"`,
        `"${row.cliente}"`,
        row.status,
        row.progresso,
        `"${row.responsavel}"`
      ].join(","))
    ].join("\n");
    downloadCSV(csvContent, "relatorio_obras");
  };

  const handleExportEquipes = () => {
    if (!equipesData?.length) {
      toast.error("Não há dados de equipes para exportar.");
      return;
    }
    const headers = ["Nome", "Função", "Status", "Email", "Telefone"];
    const csvContent = [
      headers.join(","),
      ...equipesData.map((row: any) => [
        `"${row.nome}"`,
        `"${row.funcao}"`,
        row.ativo ? "Ativo" : "Inativo",
        row.email || "",
        row.telefone || ""
      ].join(","))
    ].join("\n");
    downloadCSV(csvContent, "relatorio_equipes");
  };

  const handleExportEquipamentos = () => {
    if (!equipamentosData?.length) {
      toast.error("Não há dados de equipamentos para exportar.");
      return;
    }
    const headers = ["Nome", "Categoria", "Marca/Modelo", "Status", "Identificação"];
    const csvContent = [
      headers.join(","),
      ...equipamentosData.map((row: any) => [
        `"${row.nome}"`,
        `"${row.categoria}"`,
        `"${row.marca}"`,
        row.status,
        `"${row.identificacao}"`
      ].join(","))
    ].join("\n");
    downloadCSV(csvContent, "relatorio_equipamentos");
  };

  const downloadCSV = (content: string, identificador: string) => {
    const filename = generateStandardFilename("relatorio", identificador, "csv");
    startDownload(Promise.resolve(content), filename, "text/csv;charset=utf-8;");
  };

  const handleGenerateReport = (reportTitle: string) => {
    switch (reportTitle) {
      case "Relatório de Progresso por Obra":
        handleExportObras();
        break;
      case "Relatório de Produtividade de Equipes":
        handleExportEquipes();
        break;
      case "Relatório de Utilização de Equipamentos":
        handleExportEquipamentos();
        break;
      case "Relatório de Atividades (RDO)":
        handleExportData(); // Reusing the main RDO export
        break;
      default:
        toast.info(`O relatório "${reportTitle}" será implementado em breve.`);
    }
  };

  const periodos = [
    { value: "7d", label: "Últimos 7 dias" },
    { value: "30d", label: "Últimos 30 dias" },
    { value: "90d", label: "Últimos 3 meses" },
    { value: "custom", label: "Período personalizado" }
  ];

  const relatoriosDisponiveis = [
    {
      id: 1,
      titulo: "Relatório de Progresso por Obra",
      descricao: "Acompanhe o progresso físico e financeiro das obras",
      categoria: "Obras",
      icon: Building2,
      color: "text-construction-blue"
    },
    {
      id: 2,
      titulo: "Relatório de Produtividade de Equipes",
      descricao: "Análise de performance das equipes por período",
      categoria: "Equipes",
      icon: Users,
      color: "text-construction-green"
    },
    {
      id: 3,
      titulo: "Relatório de Utilização de Equipamentos",
      descricao: "Controle de uso e disponibilidade dos equipamentos",
      categoria: "Equipamentos",
      icon: Wrench,
      color: "text-construction-orange"
    },
    {
      id: 4,
      titulo: "Relatório Financeiro Consolidado",
      descricao: "Análise financeira completa de custos e receitas",
      categoria: "Financeiro",
      icon: DollarSign,
      color: "text-yellow-500"
    },
    {
      id: 5,
      titulo: "Relatório de Atividades (RDO)",
      descricao: "Consolidação dos relatórios diários de obra",
      categoria: "Atividades",
      icon: ClipboardList,
      color: "text-purple-500"
    },
    {
      id: 6,
      titulo: "Relatório de Cronograma vs Realizado",
      descricao: "Comparativo entre planejado e executado",
      categoria: "Cronograma",
      icon: Calendar,
      color: "text-red-500"
    }
  ];

  const metricas = [
    {
      titulo: "Total de Obras",
      valor: metrics.totalObras.toString(),
      variacao: "+0",
      percentual: 0,
      tipo: "neutro",
      icon: Building2
    },
    {
      titulo: "Progresso Médio",
      valor: `${metrics.progressoMedio}%`,
      variacao: "+0%",
      percentual: 0,
      tipo: "neutro",
      icon: TrendingUp
    },
    {
      titulo: "RDOs Emitidos",
      valor: metrics.totalRDOs.toString(),
      variacao: "+0",
      percentual: 0,
      tipo: "neutro",
      icon: ClipboardList
    },
    {
      titulo: "Colaboradores Ativos",
      valor: metrics.totalColaboradores.toString(),
      variacao: "+0",
      percentual: 0,
      tipo: "neutro",
      icon: Users
    }
  ];

  const getVariacaoColor = (tipo: string) => {
    switch (tipo) {
      case "positivo":
        return "text-construction-green";
      case "negativo":
        return "text-red-500";
      default:
        return "text-construction-orange";
    }
  };

  const getVariacaoIcon = (tipo: string) => {
    switch (tipo) {
      case "positivo":
        return TrendingUp;
      case "negativo":
        return TrendingDown;
      default:
        return Activity;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Central de Relatórios</h1>
          <p className="text-muted-foreground">Análises e insights das suas obras e operações</p>
        </div>
        <Button
          className="gradient-construction border-0 hover:opacity-90"
          onClick={handleExportData}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Exportar Dados
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-card-foreground">Filtros de Relatório</CardTitle>
          <CardDescription>Configure os parâmetros para gerar relatórios personalizados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-card-foreground">Obra</label>
              <Select value={selectedObra} onValueChange={setSelectedObra}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as obras" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as obras</SelectItem>
                  {obrasData?.map((obra) => (
                    <SelectItem key={obra.id} value={obra.id.toString()}>
                      {obra.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-card-foreground">Período</label>
              <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map((periodo) => (
                    <SelectItem key={periodo.value} value={periodo.value}>
                      {periodo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedPeriodo === "custom" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-card-foreground">Data Início</label>
                  <DatePicker
                    date={dataInicio}
                    onDateChange={setDataInicio}
                    placeholder="Data início"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-card-foreground">Data Fim</label>
                  <DatePicker
                    date={dataFim}
                    onDateChange={setDataFim}
                    placeholder="Data fim"
                    className="w-full"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metrics Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metricas.map((metrica, index) => {
          const VariacaoIcon = getVariacaoIcon(metrica.tipo);
          return (
            <Card key={index} className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">
                  {metrica.titulo}
                </CardTitle>
                <metrica.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">{metrica.valor}</div>
                <div className={`flex items-center text-xs ${getVariacaoColor(metrica.tipo)}`}>
                  <VariacaoIcon className="h-3 w-3 mr-1" />
                  {metrica.variacao} este mês
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-card-foreground flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-construction-blue" />
              Progresso das Obras
            </CardTitle>
            <CardDescription>Acompanhamento do progresso físico por obra</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {obrasData?.map((obra, index) => {
                const progresso = obra.progresso || 0;
                return (
                  <div key={obra.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-card-foreground">{obra.nome}</span>
                      <span className="font-medium text-construction-green">{progresso}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-construction-green h-2 rounded-full transition-all"
                        style={{ width: `${progresso}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-card-foreground flex items-center">
              <PieChart className="mr-2 h-5 w-5 text-construction-orange" />
              Distribuição de Recursos
            </CardTitle>
            <CardDescription>Alocação de equipes e equipamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-construction-blue/10 rounded-lg">
                  <Users className="h-8 w-8 text-construction-blue mx-auto mb-2" />
                  <p className="text-2xl font-bold text-card-foreground">{equipesData?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Colaboradores</p>
                </div>
                <div className="text-center p-4 bg-construction-orange/10 rounded-lg">
                  <Wrench className="h-8 w-8 text-construction-orange mx-auto mb-2" />
                  <p className="text-2xl font-bold text-card-foreground">{equipamentosData?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Equipamentos</p>
                </div>
              </div>
              <div className="text-center p-4 bg-construction-green/10 rounded-lg">
                <Building2 className="h-8 w-8 text-construction-green mx-auto mb-2" />
                <p className="text-2xl font-bold text-card-foreground">{obrasData?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Obras Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RDO Integration Section */}
      <RDOReportSection
        rdos={mappedRDOs}
        selectedObra={selectedObra}
        dateRange={dataInicio && dataFim ? { start: dataInicio, end: dataFim } : undefined}
      />

      {/* Available Reports */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-card-foreground">Relatórios Disponíveis</CardTitle>
          <CardDescription>Selecione o tipo de relatório que deseja gerar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {relatoriosDisponiveis.map((relatorio) => (
              <Card key={relatorio.id} className="bg-muted/20 border-border hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <relatorio.icon className={`h-5 w-5 ${relatorio.color}`} />
                        <CardTitle className="text-base text-card-foreground">
                          {relatorio.titulo}
                        </CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {relatorio.categoria}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-4">
                    {relatorio.descricao}
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleGenerateReport(relatorio.titulo)}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Gerar
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Relatorios;