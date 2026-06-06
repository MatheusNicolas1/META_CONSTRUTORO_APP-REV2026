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
  DollarSign,
  Calendar,
  Building2,
  Users,
  Wrench,
  ClipboardList,
  Download,
  PieChart,
  CalendarDays
} from "lucide-react";
import { useObras } from "@/hooks/useObras";
import { useRDOs } from "@/hooks/useRDOs";
import { format, subDays, isWithinInterval, parseISO, isValid } from "date-fns";
import { toast } from "sonner";
import { useEquipesSupabase } from "@/hooks/useEquipesSupabase";
import { useEquipamentosSupabase } from "@/hooks/useEquipamentosSupabase";
import { RDOSupabase } from "@/types/supabase-rdo";
import { RDO, RDOStatus } from "@/types/rdo";
import { useReportPdfDownload } from "@/hooks/useReportPdfDownload";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type FinanceiroConsolidadoRow = {
  org_id: string | null;
  obra_id: string | null;
  obra_nome: string;
  periodo: string;
  periodo_mes: string;
  categoria: string;
  total_lancamentos: number;
  total_despesas: number;
  total_aprovado: number;
  total_pendente: number;
};

type CronogramaVsRealizadoRow = {
  org_id: string | null;
  obra_id: string | null;
  obra_nome: string;
  atividade_id: string;
  atividade: string;
  categoria: string | null;
  data_planejada: string;
  data_realizada: string | null;
  quantidade_prevista: number | null;
  quantidade_realizada: number | null;
  percentual_realizado: number;
  status_planejado: string;
  status_realizado: string | null;
  dias_desvio: number | null;
  situacao: string;
};

type ReportAvailability = {
  count: number;
  note: string;
};

const Relatorios = () => {
  const [selectedObra, setSelectedObra] = useState("all");
  const [selectedPeriodo, setSelectedPeriodo] = useState("");
  const [dataInicio, setDataInicio] = useState<Date | undefined>();
  const [dataFim, setDataFim] = useState<Date | undefined>();

  const { obras: obrasData } = useObras();
  const { rdos: rdosData } = useRDOs();
  const { equipes: equipesData } = useEquipesSupabase();
  const { equipamentos: equipamentosData } = useEquipamentosSupabase();
  const { downloadReportPdf, isDownloading } = useReportPdfDownload();

  const { data: financeiroData = [], isLoading: isLoadingFinanceiro } = useQuery({
    queryKey: ["relatorio-financeiro-consolidado"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financeiro_consolidado")
        .select("*")
        .order("periodo", { ascending: false });

      if (error) throw error;
      return (data || []) as FinanceiroConsolidadoRow[];
    },
  });

  const { data: cronogramaData = [], isLoading: isLoadingCronograma } = useQuery({
    queryKey: ["relatorio-cronograma-vs-realizado"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cronograma_vs_realizado")
        .select("*")
        .order("data_planejada", { ascending: false });

      if (error) throw error;
      return (data || []) as CronogramaVsRealizadoRow[];
    },
  });

  const isInSelectedPeriod = (dateValue?: string | null) => {
    if (!dateValue) return true;
    const parsedDate = parseISO(dateValue);
    if (!isValid(parsedDate)) return true;

    if (selectedPeriodo === "custom" && dataInicio && dataFim) {
      return isWithinInterval(parsedDate, { start: dataInicio, end: dataFim });
    }

    if (selectedPeriodo) {
      const days = parseInt(selectedPeriodo);
      if (!isNaN(days)) {
        return parsedDate >= subDays(new Date(), days);
      }
    }

    return true;
  };

  const getObraPeriodDate = (obra: any) =>
    obra.data_inicio || obra.dataInicio || obra.created_at || obra.updated_at;

  const filteredObras = obrasData?.filter((obra: any) => {
    if (selectedObra !== "all" && obra.id?.toString() !== selectedObra) return false;
    return isInSelectedPeriod(getObraPeriodDate(obra));
  }) || [];

  // Filter RDOs based on selected obra and period.
  const filteredRDOs = rdosData?.filter(rdo => {
    if (selectedObra !== "all" && rdo.obra_id?.toString() !== selectedObra) return false;
    return isInSelectedPeriod(rdo.data);
  }) || [];

  // Adapt Supabase RDO data to component interface
  // Note: The useRDOs hook returns a simpler structure than the detailed RDO interface
  // We map what we can and provide defaults for the rest to avoid crashes

  const toArray = <T,>(value: T[] | null | undefined): T[] => Array.isArray(value) ? value : [];

  const normalizeActivityStatus = (status?: string) => {
    if (status === "Concluida") return "Concluída";
    if (status === "Em andamento") return "Em Andamento";
    return (status || "Iniciada") as RDO["atividadesRealizadas"][number]["status"];
  };

  const normalizeEquipmentStatus = (status?: string): RDO["equipamentosUtilizados"][number]["status"] => {
    if (status === "Manutenção" || status === "Manutencao") return "Manutenção";
    if (status === "Parado") return "Parado";
    return "Operacional";
  };

  const mapRdoToReport = (rdo: RDOSupabase): RDO => {
    const raw = rdo as any;
    const detalhes = raw.detalhes || {};
    const atividades = toArray<any>(raw.rdo_atividades);
    const equipesJoin = toArray<any>(raw.rdo_equipes);
    const equipamentosJoin = toArray<any>(raw.rdo_equipamentos);

    return {
      id: rdo.id,
      data: rdo.data,
      obraId: rdo.obra_id,
      obraNome: rdo.obras?.nome || "Sem nome",
      status: rdo.status as RDOStatus,
      criadoPorId: rdo.criado_por_id,
      criadoPorNome: "Usuário",
      periodo: rdo.periodo as RDO['periodo'],
      clima: rdo.clima,
      equipeOciosa: rdo.equipe_ociosa,
      tempoOcioso: Number(detalhes.tempo_ocioso || 0),
      atividadesRealizadas: atividades
        .filter((atividade) => !atividade.is_extra)
        .map((atividade) => ({
          id: atividade.id,
          nome: atividade.nome || "Atividade",
          categoria: atividade.categoria || "-",
          quantidade: Number(atividade.quantidade || 0),
          unidadeMedida: atividade.unidade_medida || "-",
          percentualConcluido: Number(atividade.percentual_concluido || 0),
          status: normalizeActivityStatus(atividade.status),
          observacoes: atividade.observacoes || undefined,
        })),
      atividadesExtras: atividades
        .filter((atividade) => atividade.is_extra)
        .map((atividade) => ({
          id: atividade.id,
          nome: atividade.nome || "Atividade extra",
          descricao: atividade.observacoes || atividade.nome || "Atividade extra",
          categoria: atividade.categoria || "-",
          quantidade: Number(atividade.quantidade || 0),
          unidadeMedida: atividade.unidade_medida || "-",
          percentualConcluido: Number(atividade.percentual_concluido || 100),
          justificativa: atividade.justificativa || atividade.observacoes || "-",
        })),
      equipesPresentes: [
        ...equipesJoin.map((item) => ({
          id: item.equipe_id || item.id,
          nome: item.equipes?.nome || "Colaborador",
          funcao: item.equipes?.funcao || "-",
          horasTrabalho: Number(item.horas_trabalho || 0),
          presente: item.presente ?? true,
          horasOciosas: Number(item.horas_ociosas || 0),
        })),
        ...toArray<any>(detalhes.equipes).map((item, index) => ({
          id: item.id || `${rdo.id}-equipe-${index}`,
          nome: item.nome || "Colaborador",
          funcao: item.funcao || "-",
          horasTrabalho: Number(item.horasTrabalho || item.horas_trabalho || 0),
          presente: item.presente ?? true,
          horasOciosas: Number(item.horasOciosas || item.horas_ociosas || 0),
        })),
      ],
      equipamentosUtilizados: [
        ...equipamentosJoin.map((item) => ({
          id: item.equipamento_id || item.id,
          nome: item.equipamentos?.nome || "Equipamento",
          categoria: item.equipamentos?.categoria || "-",
          horasUso: Number(item.horas_uso || 0),
          status: normalizeEquipmentStatus(item.status),
          observacoes: item.observacoes || undefined,
        })),
        ...toArray<any>(detalhes.equipamentos).map((item, index) => ({
          id: item.id || `${rdo.id}-equipamento-${index}`,
          nome: item.nome || "Equipamento",
          categoria: item.categoria || "-",
          horasUso: Number(item.horasUso || item.horas_uso || 0),
          status: normalizeEquipmentStatus(item.status),
          observacoes: item.observacoes || undefined,
        })),
      ],
      equipamentosQuebrados: toArray<any>(detalhes.equipamentosQuebrados).map((item, index) => ({
        id: item.id || `${rdo.id}-quebra-${index}`,
        nome: item.nome || "Equipamento",
        categoria: item.categoria || "-",
        descricaoProblema: item.descricaoProblema || "-",
        causouOciosidade: Boolean(item.causouOciosidade),
        horasParada: Number(item.horasParada || 0),
        impactoProducao: item.impactoProducao || "-",
        issueType: item.issueType || "equipment",
        tipoOcorrencia: item.tipoOcorrencia,
        envolvidos: item.envolvidos || [],
        acoesTomadas: item.acoesTomadas,
      })),
      acidentes: toArray<any>(detalhes.acidentes),
      materiaisFalta: toArray<any>(detalhes.materiaisFalta),
      estoqueMateriais: toArray<any>(detalhes.estoqueMateriais),
      observacoes: rdo.observacoes || "",
      imagens: [],
      documentos: toArray<any>(rdo.documentos).map((documento) => ({
        id: documento.id,
        nome: documento.nome,
        tipo: documento.tipo,
        url: documento.url,
        descricao: documento.categoria,
        timestamp: documento.created_at || rdo.created_at,
      })),
      criadoEm: rdo.created_at,
      atualizadoEm: rdo.updated_at || rdo.created_at,
    };
  };

  const mappedRDOs: RDO[] = filteredRDOs.map(mapRdoToReport);

  const delimitedValue = (value: unknown) => {
    const text = value === null || value === undefined ? "" : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  const filteredFinanceiro = financeiroData.filter((row) => {
    if (selectedObra !== "all" && row.obra_id !== selectedObra) return false;
    return isInSelectedPeriod(row.periodo);
  });

  const filteredCronograma = cronogramaData.filter((row) => {
    if (selectedObra !== "all" && row.obra_id !== selectedObra) return false;
    return isInSelectedPeriod(row.data_planejada);
  });

  const selectedObraLabel = selectedObra === "all"
    ? "Todas"
    : obrasData?.find((obra) => obra.id.toString() === selectedObra)?.nome || selectedObra;

  const periodosOptions = [
    { value: "7d", label: "Ultimos 7 dias" },
    { value: "30d", label: "Ultimos 30 dias" },
    { value: "90d", label: "Ultimos 3 meses" },
    { value: "custom", label: "Periodo personalizado" }
  ];

  const selectedPeriodoLabel = selectedPeriodo === "custom"
    ? `${dataInicio ? dataInicio.toLocaleDateString("pt-BR") : "Inicio"} a ${dataFim ? dataFim.toLocaleDateString("pt-BR") : "Fim"}`
    : periodosOptions.find((periodo) => periodo.value === selectedPeriodo)?.label || "Todos";

  const filteredEquipeRows = mappedRDOs.flatMap((rdo) =>
    rdo.equipesPresentes.map((equipe) => ({
      nome: equipe.nome,
      funcao: equipe.funcao,
      status: equipe.presente ? "Presente" : "Ausente",
      horasTrabalho: equipe.horasTrabalho,
      horasOciosas: equipe.horasOciosas || 0,
      obra: rdo.obraNome,
      data: rdo.data,
    }))
  );

  const filteredEquipamentoRows = mappedRDOs.flatMap((rdo) =>
    rdo.equipamentosUtilizados.map((equipamento) => ({
      nome: equipamento.nome,
      categoria: equipamento.categoria,
      status: equipamento.status,
      horasUso: equipamento.horasUso,
      obra: rdo.obraNome,
      data: rdo.data,
      observacoes: equipamento.observacoes || "-",
    }))
  );

  const hasContextualRDOFilter = selectedObra !== "all" || Boolean(selectedPeriodo);

  const reportAvailability: Record<string, ReportAvailability> = {
    obras: {
      count: filteredObras.length,
      note: "Obras conforme os filtros selecionados",
    },
    equipes: {
      count: hasContextualRDOFilter ? filteredEquipeRows.length : equipesData?.length || 0,
      note: hasContextualRDOFilter
        ? "Participações de equipes registradas nos RDOs filtrados"
        : "Colaboradores cadastrados pelo usuário",
    },
    equipamentos: {
      count: hasContextualRDOFilter ? filteredEquipamentoRows.length : equipamentosData?.length || 0,
      note: hasContextualRDOFilter
        ? "Utilizações de equipamentos registradas nos RDOs filtrados"
        : "Equipamentos cadastrados pelo usuário",
    },
    financeiro: {
      count: filteredFinanceiro.length,
      note: "Lançamentos financeiros consolidados dos filtros",
    },
    rdo: {
      count: mappedRDOs.length,
      note: "RDOs registrados nos filtros selecionados",
    },
    cronograma: {
      count: filteredCronograma.length,
      note: "Atividades planejadas x executadas dos filtros",
    },
  };

  const downloadTableReport = ({
    reportType,
    title,
    subtitle,
    detailTitle,
    columns,
    rows,
    metrics = [],
    notes = [],
  }: {
    reportType: string;
    title: string;
    subtitle: string;
    detailTitle: string;
    columns: Array<{ key: string; label: string }>;
    rows: Record<string, unknown>[];
    metrics?: Array<{ label: string; value: unknown }>;
    notes?: string[];
  }) => {
    downloadReportPdf({
      reportType,
      title,
      subtitle,
      meta: [
        { label: "Obra", value: selectedObraLabel },
        { label: "Periodo", value: selectedPeriodoLabel },
        { label: "Total de registros", value: rows.length },
      ],
      sections: [
        {
          title: "Informacoes Basicas",
          meta: [
            { label: "Tipo de relatorio", value: reportType },
            { label: "Total de registros", value: rows.length },
          ],
        },
        {
          title: "Filtros Aplicados",
          meta: [
            { label: "Obra", value: selectedObraLabel },
            { label: "Periodo", value: selectedPeriodoLabel },
          ],
        },
        {
          title: "Indicadores",
          meta: metrics.length ? metrics : [{ label: "Registros", value: rows.length }],
        },
        {
          title: detailTitle,
          columns,
          rows,
        },
        { title: "Analise Complementar" },
        { title: "Problemas e Ocorrencias" },
        { title: "Observacoes Gerais", notes: notes.length ? notes : ["Relatorio gerado a partir dos dados reais filtrados."] },
        { title: "Anexos" },
      ],
    });
  };

  const handleExportData = () => {
    if (mappedRDOs.length === 0) {
      toast.error("Não há dados para exportar com os filtros atuais.");
      return;
    }

    downloadTableReport({
      reportType: "RDO",
      title: "Relatorio de Atividades RDO",
      subtitle: "Consolidacao dos relatorios diarios de obra",
      detailTitle: "RDOs",
      columns: [
        { key: "id", label: "ID" },
        { key: "data", label: "Data" },
        { key: "obra", label: "Obra" },
        { key: "periodo", label: "Periodo" },
        { key: "clima", label: "Clima" },
        { key: "status", label: "Status" },
        { key: "observacoes", label: "Observacoes" },
      ],
      rows: mappedRDOs.map((row) => ({
        id: row.id,
        data: row.data,
        obra: row.obraNome,
        periodo: row.periodo || "-",
        clima: row.clima || "-",
        status: row.status,
        observacoes: row.observacoes || "-",
      })),
      metrics: [
        { label: "RDOs emitidos", value: mappedRDOs.length },
      ],
    });
  };

  const calculateMetrics = () => {
    const totalObras = filteredObras.length;

    // Progresso Médio
    const totalProgresso = filteredObras.reduce((acc, obra) => acc + (obra.progresso || 0), 0) || 0;
    const progressoMedio = totalObras > 0 ? Math.round(totalProgresso / totalObras) : 0;

    // RDOs Emitidos
    const totalRDOs = mappedRDOs.length;

    // Colaboradores Ativos
    const totalColaboradores = hasContextualRDOFilter
      ? new Set(filteredEquipeRows.map((equipe) => `${equipe.nome}-${equipe.funcao}`)).size
      : equipesData?.filter(e => e.ativo).length || 0;

    return {
      totalObras,
      progressoMedio,
      totalRDOs,
      totalColaboradores
    };
  };

  const metrics = calculateMetrics();

  const handleExportObras = () => {
    if (!filteredObras.length) {
      toast.error("Não há dados de obras para exportar com os filtros atuais.");
      return;
    }
    downloadTableReport({
      reportType: "OBRAS",
      title: "Relatório de Progresso por Obra",
      subtitle: "Progresso físico e financeiro das obras filtradas",
      detailTitle: "Obras",
      columns: [
        { key: "id", label: "ID" },
        { key: "nome", label: "Nome" },
        { key: "cliente", label: "Cliente" },
        { key: "status", label: "Status" },
        { key: "progresso", label: "Progresso (%)" },
        { key: "responsavel", label: "Responsável" },
        { key: "inicio", label: "Início" },
        { key: "previsao", label: "Previsão" },
      ],
      rows: filteredObras.map((row: any) => ({
        id: row.id,
        nome: row.nome || "-",
        cliente: row.cliente || "-",
        status: row.status || "-",
        progresso: row.progresso ?? 0,
        responsavel: row.responsavel || "-",
        inicio: row.data_inicio || row.dataInicio || "-",
        previsao: row.previsao_termino || row.previsaoTermino || "-",
      })),
      metrics: [
        { label: "Obras filtradas", value: filteredObras.length },
        { label: "Progresso médio", value: `${metrics.progressoMedio}%` },
      ],
    });
  };

  const handleExportEquipes = () => {
    const rows = hasContextualRDOFilter
      ? filteredEquipeRows
      : (equipesData || []).map((row: any) => ({
        nome: row.nome,
        funcao: row.funcao,
        status: row.ativo ? "Ativo" : "Inativo",
        email: row.email || "-",
        telefone: row.telefone || "-",
      }));

    if (!rows.length) {
      toast.error("Não há dados de equipes para exportar com os filtros atuais.");
      return;
    }

    downloadTableReport({
      reportType: "EQUIPES",
      title: "Relatório de Produtividade de Equipes",
      subtitle: hasContextualRDOFilter
        ? "Participações de equipes registradas nos RDOs filtrados"
        : "Colaboradores cadastrados pelo usuário",
      detailTitle: "Equipes",
      columns: hasContextualRDOFilter
        ? [
          { key: "nome", label: "Nome" },
          { key: "funcao", label: "Função" },
          { key: "status", label: "Status" },
          { key: "horasTrabalho", label: "Horas trabalhadas" },
          { key: "horasOciosas", label: "Horas ociosas" },
          { key: "obra", label: "Obra" },
          { key: "data", label: "Data" },
        ]
        : [
          { key: "nome", label: "Nome" },
          { key: "funcao", label: "Função" },
          { key: "status", label: "Status" },
          { key: "email", label: "Email" },
          { key: "telefone", label: "Telefone" },
        ],
      rows,
      metrics: [
        { label: hasContextualRDOFilter ? "Participações em RDO" : "Colaboradores", value: rows.length },
      ],
    });
  };

  const handleExportEquipamentos = () => {
    const rows = hasContextualRDOFilter
      ? filteredEquipamentoRows
      : (equipamentosData || []).map((row: any) => ({
        nome: row.nome,
        categoria: row.categoria,
        marcaModelo: row.marca || row.modelo || "-",
        status: row.status || "-",
        identificacao: row.identificacao || "-",
      }));

    if (!rows.length) {
      toast.error("Não há dados de equipamentos para exportar com os filtros atuais.");
      return;
    }

    downloadTableReport({
      reportType: "EQUIPAMENTOS",
      title: "Relatório de Utilização de Equipamentos",
      subtitle: hasContextualRDOFilter
        ? "Utilizações de equipamentos registradas nos RDOs filtrados"
        : "Equipamentos cadastrados pelo usuário",
      detailTitle: "Equipamentos",
      columns: hasContextualRDOFilter
        ? [
          { key: "nome", label: "Nome" },
          { key: "categoria", label: "Categoria" },
          { key: "status", label: "Status" },
          { key: "horasUso", label: "Horas de uso" },
          { key: "obra", label: "Obra" },
          { key: "data", label: "Data" },
          { key: "observacoes", label: "Observações" },
        ]
        : [
          { key: "nome", label: "Nome" },
          { key: "categoria", label: "Categoria" },
          { key: "marcaModelo", label: "Marca/Modelo" },
          { key: "status", label: "Status" },
          { key: "identificacao", label: "Identificação" },
        ],
      rows,
      metrics: [
        { label: hasContextualRDOFilter ? "Utilizações em RDO" : "Equipamentos", value: rows.length },
      ],
    });
  };

  const downloadPdfFromDelimitedRows = (content: string, identificador: string) => {
    const lines = content.split("\n").filter(Boolean);
    const parseLine = (line: string) =>
      line.match(/("([^"]|"")*"|[^,]+)/g)?.map((cell) =>
        cell.replace(/^"|"$/g, "").replace(/""/g, '"')
      ) || [];

    const headers = parseLine(lines[0] || "");
    const rows = lines.slice(1).map((line) => {
      const values = parseLine(line);
      return headers.reduce<Record<string, unknown>>((acc, header, index) => {
        acc[header] = values[index] || "";
        return acc;
      }, {});
    });

    downloadTableReport({
      reportType: identificador.replace(/^relatorio_/, "").toUpperCase(),
      title: identificador.replace(/_/g, " ").toUpperCase(),
      subtitle: "Relatorio gerado pela central de relatorios",
      detailTitle: "Dados",
      columns: headers.map((header) => ({ key: header, label: header })),
      rows,
    });
  };

  const handleExportFinanceiro = () => {
    if (!filteredFinanceiro.length) {
      toast.error("Nao ha dados financeiros reais para exportar com os filtros atuais.");
      return;
    }
    const headers = ["Obra", "Periodo", "Categoria", "Lancamentos", "Total Despesas", "Total Aprovado", "Total Pendente"];
    const delimitedContent = [
      headers.join(","),
      ...filteredFinanceiro.map((row) => [
        delimitedValue(row.obra_nome),
        delimitedValue(row.periodo_mes),
        delimitedValue(row.categoria),
        row.total_lancamentos,
        row.total_despesas,
        row.total_aprovado,
        row.total_pendente
      ].join(","))
    ].join("\n");
    downloadPdfFromDelimitedRows(delimitedContent, "relatorio_financeiro");
  };

  const handleExportCronograma = () => {
    if (!filteredCronograma.length) {
      toast.error("Nao ha dados de cronograma reais para exportar com os filtros atuais.");
      return;
    }
    const headers = ["Obra", "Atividade", "Categoria", "Data Planejada", "Data Realizada", "Qtd Prevista", "Qtd Realizada", "% Realizado", "Status Planejado", "Status Realizado", "Dias Desvio", "Situacao"];
    const delimitedContent = [
      headers.join(","),
      ...filteredCronograma.map((row) => [
        delimitedValue(row.obra_nome),
        delimitedValue(row.atividade),
        delimitedValue(row.categoria),
        row.data_planejada || "",
        row.data_realizada || "",
        row.quantidade_prevista ?? "",
        row.quantidade_realizada ?? "",
        row.percentual_realizado,
        delimitedValue(row.status_planejado),
        delimitedValue(row.status_realizado),
        row.dias_desvio ?? "",
        delimitedValue(row.situacao)
      ].join(","))
    ].join("\n");
    downloadPdfFromDelimitedRows(delimitedContent, "relatorio_cronograma");
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
        handleExportData();
        break;
      case "Relatório Financeiro Consolidado":
        handleExportFinanceiro();
        break;
      case "Relatório de Cronograma vs Realizado":
        handleExportCronograma();
        break;
      default:
        toast.error(`Relatório "${reportTitle}" não disponível.`);
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
      availabilityKey: "obras",
      icon: Building2,
      color: "text-construction-blue"
    },
    {
      id: 2,
      titulo: "Relatório de Produtividade de Equipes",
      descricao: "Análise de performance das equipes por período",
      categoria: "Equipes",
      availabilityKey: "equipes",
      icon: Users,
      color: "text-construction-green"
    },
    {
      id: 3,
      titulo: "Relatório de Utilização de Equipamentos",
      descricao: "Controle de uso e disponibilidade dos equipamentos",
      categoria: "Equipamentos",
      availabilityKey: "equipamentos",
      icon: Wrench,
      color: "text-construction-orange"
    },
    {
      id: 4,
      titulo: "Relatório Financeiro Consolidado",
      descricao: "Análise financeira completa de custos e receitas",
      categoria: "Financeiro",
      availabilityKey: "financeiro",
      icon: DollarSign,
      color: "text-yellow-500"
    },
    {
      id: 5,
      titulo: "Relatório de Atividades (RDO)",
      descricao: "Consolidação dos relatórios diários de obra",
      categoria: "Atividades",
      availabilityKey: "rdo",
      icon: ClipboardList,
      color: "text-purple-500"
    },
    {
      id: 6,
      titulo: "Relatório de Cronograma vs Realizado",
      descricao: "Comparativo entre planejado e executado",
      categoria: "Cronograma",
      availabilityKey: "cronograma",
      icon: Calendar,
      color: "text-red-500"
    }
  ];

  const metricas = [
    {
      titulo: "Total de Obras",
      valor: metrics.totalObras.toString(),
      detalhe: "Conforme filtros atuais",
      icon: Building2
    },
    {
      titulo: "Progresso Médio",
      valor: `${metrics.progressoMedio}%`,
      detalhe: "Média das obras filtradas",
      icon: TrendingUp
    },
    {
      titulo: "RDOs Emitidos",
      valor: metrics.totalRDOs.toString(),
      detalhe: "RDOs no período selecionado",
      icon: ClipboardList
    },
    {
      titulo: "Colaboradores Ativos",
      valor: metrics.totalColaboradores.toString(),
      detalhe: hasContextualRDOFilter ? "Presentes nos RDOs filtrados" : "Cadastros ativos",
      icon: Users
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
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
          Exportar PDF
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
                <p className="text-xs text-muted-foreground">{metrica.detalhe}</p>
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
              {filteredObras.map((obra) => {
                const progresso = obra.progresso || 0;
                return (
                  <div key={obra.id} className="space-y-2">
                    <div className="flex items-start justify-between gap-3 text-sm">
                      <span className="min-w-0 break-words text-card-foreground">{obra.nome}</span>
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
              {filteredObras.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma obra encontrada para os filtros atuais.</p>
              )}
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
                  <p className="text-2xl font-bold text-card-foreground">{reportAvailability.equipes.count}</p>
                  <p className="text-sm text-muted-foreground">Colaboradores</p>
                </div>
                <div className="text-center p-4 bg-construction-orange/10 rounded-lg">
                  <Wrench className="h-8 w-8 text-construction-orange mx-auto mb-2" />
                  <p className="text-2xl font-bold text-card-foreground">{reportAvailability.equipamentos.count}</p>
                  <p className="text-sm text-muted-foreground">Equipamentos</p>
                </div>
              </div>
              <div className="text-center p-4 bg-construction-green/10 rounded-lg">
                <Building2 className="h-8 w-8 text-construction-green mx-auto mb-2" />
                <p className="text-2xl font-bold text-card-foreground">{filteredObras.length}</p>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-card-foreground flex items-center">
              <DollarSign className="mr-2 h-5 w-5 text-yellow-500" />
              Financeiro Consolidado
            </CardTitle>
            <CardDescription>Despesas agrupadas por obra, mes e categoria</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingFinanceiro ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando dados financeiros...
              </div>
            ) : filteredFinanceiro.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum dado financeiro encontrado para os filtros atuais.</p>
            ) : (
              <div className="space-y-3">
                {filteredFinanceiro.slice(0, 5).map((row) => (
                  <div key={`${row.obra_id}-${row.periodo_mes}-${row.categoria}`} className="flex flex-col gap-2 border-b border-border pb-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-words font-medium text-card-foreground">{row.obra_nome}</p>
                      <p className="break-words text-muted-foreground">{row.periodo_mes} - {row.categoria}</p>
                    </div>
                    <p className="shrink-0 font-semibold text-card-foreground">
                      {Number(row.total_despesas).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-card-foreground flex items-center">
              <CalendarDays className="mr-2 h-5 w-5 text-red-500" />
              Cronograma vs Realizado
            </CardTitle>
            <CardDescription>Comparativo entre atividades planejadas e execucao registrada em RDO</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCronograma ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando cronograma...
              </div>
            ) : filteredCronograma.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum dado de cronograma encontrado para os filtros atuais.</p>
            ) : (
              <div className="space-y-3">
                {filteredCronograma.slice(0, 5).map((row) => (
                  <div key={row.atividade_id} className="flex flex-col gap-2 border-b border-border pb-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-words font-medium text-card-foreground">{row.atividade}</p>
                      <p className="break-words text-muted-foreground">{row.obra_nome} - planejado {format(parseISO(row.data_planejada), "dd/MM/yyyy")}</p>
                    </div>
                    <Badge className="w-fit shrink-0" variant={row.situacao === "Atrasado" ? "destructive" : "outline"}>
                      {row.situacao}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Available Reports */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-card-foreground">Relatórios Disponíveis</CardTitle>
          <CardDescription>Selecione o tipo de relatório que deseja gerar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {relatoriosDisponiveis.map((relatorio) => {
              const availability = reportAvailability[relatorio.availabilityKey];
              const disabled = isDownloading || availability.count === 0;

              return (
                <Card key={relatorio.id} className="flex min-h-[260px] flex-col bg-muted/20 border-border hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="space-y-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <relatorio.icon className={`mt-0.5 h-5 w-5 shrink-0 ${relatorio.color}`} />
                        <CardTitle className="min-w-0 break-words text-base leading-snug text-card-foreground">
                          {relatorio.titulo}
                        </CardTitle>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="max-w-full text-xs">
                          {relatorio.categoria}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {availability.count} registro{availability.count === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col pt-0">
                    <p className="mb-2 min-h-[44px] break-words text-sm text-muted-foreground">
                      {relatorio.descricao}
                    </p>
                    <p className="mb-4 min-h-[36px] break-words text-xs text-muted-foreground">
                      {availability.note}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-auto w-full"
                      onClick={() => handleGenerateReport(relatorio.titulo)}
                      disabled={disabled}
                    >
                      {isDownloading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      Baixar PDF
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Relatorios;
