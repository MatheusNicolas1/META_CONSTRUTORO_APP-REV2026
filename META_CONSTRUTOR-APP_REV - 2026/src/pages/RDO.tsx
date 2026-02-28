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
import { useDownload } from "@/hooks/useDownload";
import { generateStandardFilename } from "@/utils/downloadHelper";
import { generateRDOPdf, type RDOPdfData } from "@/utils/generateRDOPdf";
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
  const { isLoading: isDownloading, startDownload } = useDownload();

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

    const headers = ['Número', 'Data', 'Obra', 'Status', 'Clima', 'Período', 'Equipes', 'Equipamentos'];
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

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const filename = generateStandardFilename("rdo", "listagem", "csv");

    startDownload(Promise.resolve(csv), filename, 'text/csv;charset=utf-8;');
  };

  // Helper para baixar imagem via URL CORS e transformar em Base64
  const urlToBase64 = async (url: string): Promise<string> => {
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error("Erro ao converter URL logo para base64:", e);
      return "";
    }
  };

  const handleDownloadSingleRDO = async (rdo: RDO) => {
    const toastId = toast.loading('Gerando PDF do RDO...');
    try {
      // Lazy Fetch: Busca todos os detalhes do RDO no momento do download para não onerar a listagem
      const { data: rawRdo, error } = await supabase
        .from('rdos')
        .select(`
          *,
          obras (nome, localizacao),
          rdo_atividades (*),
          rdo_equipes (*, equipes(*)),
          rdo_equipamentos (*, equipamentos(*)),
          documentos (*)
        `)
        .eq('id', rdo.id)
        .single();

      if (error) throw error;
      if (!rawRdo) throw new Error("RDO não encontrado");

      const fullRdo = rawRdo as any;

      // Buscar nome do Responsável (temos que buscar na profiles pq a FK é pra auth.users)
      const { data: profile } = await supabase.from('profiles').select('name, avatar_url').eq('id', fullRdo.criado_por_id).single();

      let empresaLogoB64 = "";
      if (profile && (profile as any).avatar_url) {
        empresaLogoB64 = await urlToBase64((profile as any).avatar_url);
      }

      // Mapeamento dos detalhes JSONB (quando criados sem UUID de catálogo)
      const isRecordArray = (val: any): val is any[] => Array.isArray(val) && val.length > 0;
      const getDetalhes = (key: string) => {
        const det = fullRdo.detalhes as Record<string, any>;
        if (!det) return [];
        return isRecordArray(det[key]) ? det[key] : [];
      };

      // Combinando Arrays (Tabelas Relacionais + JSONB fallback)
      const atividadesList = (fullRdo.rdo_atividades || []).map((a: any) => ({
        nome: a.nome,
        status: a.status,
        percentual: a.percentual_concluido,
        quantidade: a.quantidade,
        unidade: a.unidade_medida
      }));

      const equipesList = [
        ...(fullRdo.rdo_equipes || []).map((e: any) => ({
          nome: e.equipes?.nome || 'Equipe',
          funcao: e.equipes?.funcao,
          quantidade: e.quantidade
        })),
        ...getDetalhes('equipes').map((e: any) => ({ nome: e.nome, funcao: e.funcao, quantidade: e.quantidade }))
      ];

      const equipamentosList = [
        ...(fullRdo.rdo_equipamentos || []).map((e: any) => ({
          nome: e.equipamentos?.nome || 'Equipamento',
          status: e.status,
          horasUso: e.horas_uso
        })),
        ...getDetalhes('equipamentos').map((e: any) => ({
          nome: e.nome,
          status: e.status,
          horasUso: e.horasUso
        }))
      ];

      const pdfData: RDOPdfData = {
        id: fullRdo.id,
        numero: fullRdo.numero,
        data: fullRdo.data,
        periodo: fullRdo.periodo ?? 'Integral',
        clima: fullRdo.clima ?? 'N/A',
        status: fullRdo.status,
        obraNome: fullRdo.obras?.nome ?? 'Obra não informada',
        obraLocal: fullRdo.obras?.localizacao,
        responsavel: profile ? (profile as any).name : 'Responsável',
        observacoes: fullRdo.observacoes,
        equipes: equipesList,
        atividades: atividadesList,
        equipamentos: equipamentosList,
        empresaLogo: empresaLogoB64,
        documentos: fullRdo.documentos?.map((d: any) => ({ nome: d.nome, tipo: d.tipo })) ?? [],
      };


      const { blob, filename } = await generateRDOPdf(pdfData);
      startDownload(Promise.resolve(blob), filename, 'application/pdf');
      toast.success('PDF gerado com sucesso!', { id: toastId });
    } catch (err) {
      console.error('Erro ao gerar PDF do RDO:', err);
      toast.error('Falha ao gerar PDF. Tente novamente.', { id: toastId });
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingRDO(null);
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
    atividadesRealizadas: [],
    atividadesExtras: [],
    periodo: rdo.periodo,
    clima: rdo.clima,
    equipeOciosa: rdo.equipe_ociosa,
    equipesPresentes: [],
    equipamentosUtilizados: [],
    equipamentosQuebrados: [],
    acidentes: [],
    materiaisFalta: [],
    estoqueMateriais: [],
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
            disabled={isDownloading}
          >
            {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Exportar
          </Button>
          <Button
            className="gradient-construction border-0 hover:opacity-90 w-full sm:w-auto"
            onClick={() => navigate('/rdo/novo')}
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
                  onDownload={() => handleDownloadSingleRDO(mappedRDO as any)}
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
                onClick={() => navigate('/rdo/novo')}
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
