import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RDONewForm } from "@/components/rdo/RDONewForm";
import { DatePicker } from "@/components/DatePicker";
import { RDOExpandableCard } from "@/components/RDOExpandableCard";
import { CreditsDisplay } from "@/components/CreditsDisplay";
import { useRDOs } from "@/hooks/useRDOs";
import { useObras } from "@/hooks/useObras";
import { RDO } from "@/types/rdo";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Search,
  Plus,
  Download,
  Filter,
  Loader2
} from "lucide-react";
import { useRDODownload } from "@/hooks/useRDODownload";
import { useReportPdfDownload } from "@/hooks/useReportPdfDownload";
import { toast } from "sonner";

const RDOPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedObra, setSelectedObra] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [editingRDO, setEditingRDO] = useState<RDO | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const navigate = useNavigate();

  const { rdos, isLoading, deleteRDO, createRDO, updateRDO } = useRDOs();
  const { obras } = useObras();
  const { downloadReportPdf, isDownloading: isReportDownloading } = useReportPdfDownload();
  const { downloadRDO, isDownloading: isPdfDownloading } = useRDODownload();

  const filteredRDOs = rdos.filter(rdo => {
    const obraNome = (rdo as any).obras?.nome || '';
    const matchesSearch = obraNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rdo.observacoes || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesObra = !selectedObra || selectedObra === "all" || rdo.obra_id === selectedObra;
    const matchesDate = !selectedDate || rdo.data === selectedDate.toISOString().split('T')[0];

    return matchesSearch && matchesObra && matchesDate;
  });

  const handleDeleteRDO = (id: number | string) => {
    if (confirm("Tem certeza que deseja excluir este RDO?")) {
      deleteRDO.mutate(String(id));
    }
  };

  const handleEditRDO = (rdo: RDO) => {
    setEditingRDO(rdo);
    setIsFormOpen(true);
  };

  const handleExportRDOs = () => {
    if (!filteredRDOs.length) {
      toast.error("Não há RDOs para exportar.");
      return;
    }

    const rows = filteredRDOs.map(rdo => [
      (rdo as any).numero || rdo.id,
      rdo.data,
      (rdo as any).obras?.nome || 'N/A',
      rdo.status,
      rdo.clima || 'N/A',
      rdo.periodo || 'N/A',
      (rdo as any).equipes_presentes?.length || 0,
      (rdo as any).equipamentos_utilizados?.length || 0
    ]);

    downloadReportPdf({
      reportType: "RDO",
      title: "Relatorio de RDOs",
      subtitle: "Listagem consolidada dos relatorios diarios de obra",
      meta: [
        { label: "Total de RDOs", value: filteredRDOs.length },
        { label: "Obra", value: selectedObra === "all" ? "Todas" : obras.find((obra: any) => obra.id === selectedObra)?.nome || selectedObra },
        { label: "Data", value: selectedDate ? selectedDate.toLocaleDateString("pt-BR") : "Todas" },
        { label: "Busca", value: searchTerm || "Sem filtro" },
      ],
      sections: [
        {
          title: "Informacoes Basicas",
          meta: [
            { label: "Tipo de relatorio", value: "RDO" },
            { label: "Total de registros", value: filteredRDOs.length },
          ],
        },
        {
          title: "Filtros Aplicados",
          meta: [
            { label: "Obra", value: selectedObra === "all" ? "Todas" : obras.find((obra: any) => obra.id === selectedObra)?.nome || selectedObra },
            { label: "Data", value: selectedDate ? selectedDate.toLocaleDateString("pt-BR") : "Todas" },
          ],
        },
        {
          title: "Indicadores",
          meta: [
            { label: "Aprovados", value: filteredRDOs.filter((rdo) => rdo.status === "aprovado" || rdo.status === "Aprovado").length },
            { label: "Pendentes", value: filteredRDOs.filter((rdo) => rdo.status !== "aprovado" && rdo.status !== "Aprovado").length },
          ],
        },
        {
          title: "RDOs",
          columns: [
            { key: "numero", label: "Numero" },
            { key: "data", label: "Data" },
            { key: "obra", label: "Obra" },
            { key: "status", label: "Status" },
            { key: "clima", label: "Clima" },
            { key: "periodo", label: "Periodo" },
            { key: "equipes", label: "Equipes" },
            { key: "equipamentos", label: "Equipamentos" },
          ],
          rows: rows.map((row) => ({
            numero: row[0],
            data: row[1],
            obra: row[2],
            status: row[3],
            clima: row[4],
            periodo: row[5],
            equipes: row[6],
            equipamentos: row[7],
          })),
        },
        { title: "Equipes Presentes" },
        { title: "Problemas e Ocorrencias" },
        { title: "Observacoes Gerais", notes: ["Relatorio consolidado gerado a partir dos RDOs filtrados."] },
        { title: "Anexos" },
      ],
    });
  };


  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingRDO(null);
  };

  // Helper functions for mapping
  const mapAtividades = (atividades: any[], isExtra: boolean) =>
    Array.isArray(atividades) ? atividades.filter(a => a.is_extra === isExtra).map(a => ({
      id: a.id,
      nome: a.nome,
      categoria: a.categoria,
      quantidade: a.quantidade,
      unidadeMedida: a.unidade_medida,
      percentualConcluido: a.percentual_concluido,
      status: a.status,
      observacoes: !isExtra ? a.observacoes : undefined,
      justificativa: isExtra ? a.justificativa : undefined,
      descricao: isExtra ? a.justificativa : (a.observacoes || '')
    })) : [];

  const mapEquipes = (rdo: any) => {
    const fromDb = Array.isArray(rdo.rdo_equipes) ? rdo.rdo_equipes.map((re: any) => ({
      id: re.equipe_id,
      nome: re.equipes?.nome || 'Equipe',
      funcao: re.equipes?.funcao || 'Geral',
      horasTrabalho: re.horas_trabalho,
      presente: re.presente,
      horasOciosas: re.horas_ociosas
    })) : [];
    const fromJson = Array.isArray(rdo.detalhes?.equipes) ? rdo.detalhes.equipes : [];
    return [...fromDb, ...fromJson];
  };

  const mapEquipamentos = (rdo: any) => {
    const fromDb = Array.isArray(rdo.rdo_equipamentos) ? rdo.rdo_equipamentos.map((re: any) => ({
      id: re.equipamento_id,
      nome: re.equipamentos?.nome || 'Equipamento',
      categoria: re.equipamentos?.categoria || 'Geral',
      horasUso: re.horas_uso,
      status: re.status,
      observacoes: re.observacoes
    })) : [];
    const fromJson = Array.isArray(rdo.detalhes?.equipamentos) ? rdo.detalhes.equipamentos : [];
    return [...fromDb, ...fromJson];
  };

  // Map Supabase RDO to component format
  const mapRDOToComponent = (rdo: any) => ({
    id: rdo.id,
    numero: (rdo as any).numero || rdo.id.toString().substring(0, 8),
    data: rdo.data,
    obraId: rdo.obra_id,
    obraNome: rdo.obras?.nome || 'Obra não encontrada',
    status: rdo.status,
    criadoPorId: rdo.created_by,
    criadoPorNome: 'Usuário',
    aprovadoPorId: rdo.aprovado_por_id,
    aprovadoPorNome: rdo.aprovado_por_id ? 'Aprovador' : undefined,
    dataAprovacao: rdo.data_aprovacao,
    atividadesRealizadas: mapAtividades(rdo.rdo_atividades, false),
    atividadesExtras: mapAtividades(rdo.rdo_atividades, true),
    periodo: rdo.periodo,
    clima: rdo.clima,
    equipeOciosa: rdo.equipe_ociosa,
    equipesPresentes: mapEquipes(rdo),
    equipamentosUtilizados: mapEquipamentos(rdo),
    equipamentosQuebrados: rdo.detalhes?.equipamentosQuebrados || [],
    acidentes: rdo.detalhes?.acidentes || [],
    materiaisFalta: rdo.detalhes?.materiaisFalta || [],
    estoqueMateriais: rdo.detalhes?.estoqueMateriais || [],
    observacoes: rdo.observacoes || '',
    // Map documents to images and files
    imagens: rdo.documentos?.filter((d: any) => d.tipo && (d.tipo.includes('image') || ['jpg', 'jpeg', 'png', 'webp'].includes(d.tipo))).map((d: any) => d.url) || [],
    documentos: rdo.documentos || [],
    criadoEm: rdo.created_at,
    atualizadoEm: rdo.updated_at,
  });

  return (
    <div className="responsive-spacing">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Relatórios Diários de Obra (RDO)</h1>
          <p className="text-muted-foreground">Gerencie todos os relatórios diários das obras</p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={handleExportRDOs}
            disabled={isReportDownloading}
          >
            {isReportDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Exportar PDF
          </Button>
          <Button
            className="gradient-construction border-0 hover:opacity-90 w-full sm:w-auto"
            onClick={() => navigate('/app/rdo/novo')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo RDO
          </Button>
        </div>
      </div>

      <CreditsDisplay />

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-card-foreground flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-card-foreground">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por obra ou observações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-card-foreground">Obra</label>
              <Select value={selectedObra} onValueChange={setSelectedObra}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as obras" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as obras</SelectItem>
                  {(obras as any[]).map((obra: any) => (
                    <SelectItem key={obra.id} value={obra.id}>
                      {obra.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-card-foreground">Data</label>
              <DatePicker
                date={selectedDate}
                onDateChange={setSelectedDate}
                placeholder="Todas as datas"
                className="w-full"
              />
            </div>
            <div className="space-y-2 flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedObra("all");
                  setSelectedDate(undefined);
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {
        isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-1">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-1">
            {filteredRDOs.map((rdo) => {
              const mappedRDO = mapRDOToComponent(rdo);
              return (
                <RDOExpandableCard
                  key={rdo.id}
                  rdo={mappedRDO}
                  onEdit={handleEditRDO}
                  onDelete={handleDeleteRDO}
                  onDownload={() => downloadRDO(String(mappedRDO.id))}
                />
              );
            })}
          </div>
        )
      }

      {
        !isLoading && filteredRDOs.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-card-foreground">Nenhum RDO encontrado</h3>
            <p className="mt-2 text-muted-foreground">
              {searchTerm || selectedObra !== "all" || selectedDate
                ? "Tente ajustar os filtros de busca"
                : "Comece criando seu primeiro RDO"}
            </p>
            <div className="mt-6">
              <Button
                className="gradient-construction border-0 hover:opacity-90"
                onClick={() => navigate('/app/rdo/novo')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro RDO
              </Button>
            </div>
          </div>
        )
      }

      <RDONewForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        isEditing={!!editingRDO}
        initialData={editingRDO}
        onSubmit={async (data): Promise<void> => {
          if (editingRDO) {
            await updateRDO.mutateAsync({ id: editingRDO.id, ...data });
          } else {
            await createRDO.mutateAsync(data);
          }
        }}
      />
    </div >
  );
};

export default RDOPage;
 

