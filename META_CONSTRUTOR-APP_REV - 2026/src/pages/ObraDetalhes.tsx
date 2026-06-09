import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building2,
  MapPin,
  User,
  Calendar,
  DollarSign,
  FileText,
  Users,
  Wrench,
  TrendingUp,
  Upload,
  Image as ImageIcon,
  Edit,
  Download,
  Filter,
  AlertTriangle,
  PieChart
} from "lucide-react";
import { Link } from "react-router-dom";
import { NavigationSafety } from "@/utils/navigationSafety";
import { SocialShare } from "@/components/SocialShare";
import { NovaObraForm } from "@/components/NovaObraForm";
import { useObraDetails } from "@/hooks/useObraDetails";
import { useRDOsByObra } from "@/hooks/useRDOsByObra";
import { DocumentType, useDocuments } from "@/hooks/useDocuments";
import { FileText as FileTextIcon, Clock, CheckCircle, AlertCircle, Wrench as WrenchIcon } from "lucide-react";
import { useReportPdfDownload } from "@/hooks/useReportPdfDownload";
import { DOCUMENT_UPLOAD_ACCEPT, DOCUMENT_UPLOAD_HELP_TEXT } from "@/utils/documentUploadValidation";

const ObraDetalhes = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("geral");
  const isEditRoute = location.pathname.endsWith("/editar");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(isEditRoute);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [documentForm, setDocumentForm] = useState<{
    nome: string;
    categoria: DocumentType | "";
    descricao: string;
    file: File | null;
  }>({ nome: "", categoria: "", descricao: "", file: null });

  const { data: obra, isLoading, error } = useObraDetails(id || '');
  const { data: rdosReais = [], isLoading: rdosLoading } = useRDOsByObra(id);
  const { downloadReportPdf, isDownloading } = useReportPdfDownload();
  const { uploadDocument } = useDocuments({ obraId: id || undefined, enabled: false });

  useEffect(() => {
    setIsEditDialogOpen(isEditRoute);
  }, [isEditRoute]);

  const handleOpenEdit = () => {
    if (!id) return;
    navigate(`/app/obras/${id}/editar`);
  };

  const handleCloseEdit = () => {
    setIsEditDialogOpen(false);
    if (id && isEditRoute) {
      navigate(`/app/obras/${id}`, { replace: true });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !obra) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <h2 className="text-xl font-semibold">Erro ao carregar obra</h2>
        <p className="text-muted-foreground">Não foi possível encontrar os detalhes desta obra.</p>
        <Button variant="outline" className="cursor-pointer" onClick={() => NavigationSafety.safeNavigate(navigate, '/app/obras')}>Voltar para Obras</Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Em andamento":
        return "bg-construction-orange text-white";
      case "Finalizando":
        return "bg-construction-green text-white";
      case "Iniciando":
        return "bg-construction-blue text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const documentos = obra.documentos ?? [];
  const imagens = obra.imagens ?? [];
  const atividadesDetalhadas = obra.atividadesDetalhadas ?? [];
  const equipes = obra.equipes ?? [];
  const equipamentos = obra.equipamentos ?? [];
  const despesas = obra.despesas ?? [];

  const formatCurrency = (value?: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00`).toLocaleDateString('pt-BR');
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getItemStatusColor = (status: string) => {
    switch (status) {
      case "Em conformidade":
        return "bg-construction-green text-white";
      case "Ultrapassado":
        return "bg-red-500 text-white";
      case "Em andamento":
      case "Executado":
        return "bg-construction-blue text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const percentualOrcamentoExecutado = obra && obra.financeiro && obra.financeiro.orcamentoTotal > 0
    ? (obra.financeiro.valorExecutado / obra.financeiro.orcamentoTotal) * 100
    : 0;

  const handleExportObraPdf = () => {
    downloadReportPdf({
      reportType: "OBRA",
      title: "Relatorio da Obra",
      subtitle: obra.nome,
      meta: [
        { label: "Obra", value: obra.nome },
        { label: "Status", value: obra.status },
        { label: "Progresso", value: `${obra.progresso}%` },
        { label: "Responsavel", value: obra.responsavel },
      ],
      sections: [
        {
          title: "Informacoes Basicas",
          meta: [
            { label: "Cliente", value: obra.cliente },
            { label: "Localizacao", value: obra.localizacao },
            { label: "Area", value: obra.area },
            { label: "Orcamento", value: formatCurrency(obra.orcamento) },
          ],
        },
        {
          title: "Cronograma",
          meta: [
            { label: "Data de inicio", value: formatDate(obra.dataInicio) },
            { label: "Previsao de termino", value: formatDate(obra.previsaoTermino) },
          ],
        },
        {
          title: "Indicadores",
          meta: [
            { label: "Progresso fisico", value: `${obra.progresso}%` },
            { label: "Progresso financeiro", value: `${percentualOrcamentoExecutado.toFixed(1)}%` },
          ],
        },
        {
          title: "RDOs Vinculados",
          columns: [
            { key: "data", label: "Data" },
            { key: "status", label: "Status" },
            { key: "clima", label: "Clima" },
            { key: "atividades", label: "Atividades" },
            { key: "equipamentos", label: "Equipamentos" },
          ],
          rows: rdosReais.map((rdo) => ({
            data: new Date(rdo.data + 'T00:00:00').toLocaleDateString('pt-BR'),
            status: rdo.status,
            clima: rdo.clima || "-",
            atividades: rdo.totalAtividades,
            equipamentos: rdo.totalEquipamentos,
          })),
        },
        {
          title: "Financeiro",
          meta: [
            { label: "Orcamento total", value: formatCurrency(obra.financeiro.orcamentoTotal) },
            { label: "Valor executado", value: formatCurrency(obra.financeiro.valorExecutado) },
            { label: "Saldo restante", value: formatCurrency(obra.financeiro.saldoRestante) },
          ],
        },
        { title: "Problemas e Ocorrencias" },
        { title: "Observacoes Gerais", notes: [obra.descricao || "Sem observacoes gerais."] },
        { title: "Anexos" },
      ],
    });
  };

  const tiposDocumento: DocumentType[] = [
    "Projeto",
    "Licença",
    "Relatório",
    "Memorial",
    "Cronograma",
    "Contrato",
    "Certificado",
    "Laudo",
    "Outros",
  ];

  const handleUploadDocumentoObra = async () => {
    if (!id || !documentForm.file || !documentForm.nome || !documentForm.categoria) return;

    uploadDocument.mutate({
      nome: documentForm.nome,
      categoria: documentForm.categoria,
      obra_id: id,
      descricao: documentForm.descricao,
      file: documentForm.file,
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['obra', id] });
        setDocumentForm({ nome: "", categoria: "", descricao: "", file: null });
        setIsDocumentDialogOpen(false);
      }
    });
  };

  return (
    <div className="responsive-spacing">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
        <div className="space-y-2 min-w-0 flex-1">
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground break-words">{obra.nome}</h1>
            <Badge className={getStatusColor(obra.status)}>{obra.status}</Badge>
          </div>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="break-words">{obra.localizacao}</span>
          </div>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <SocialShare
            title={`Obra: ${obra.nome}`}
            text={`Acompanhe o progresso da obra ${obra.nome} - ${obra.progresso}% concluído!\n\n📍 ${obra.localizacao}\n👷 Responsável: ${obra.responsavel}\n🏗️ Cliente: ${obra.cliente}`}
            imageUrl={obra.area ? undefined : undefined}
            obraId={obra.id.toString()}
          />
          <Link to="/app/rdo/novo" state={{ selectedObraId: id }} className="w-full sm:w-auto">
            <Button className="gradient-construction border-0 hover:opacity-90 w-full sm:w-auto">
              <FileText className="mr-2 h-4 w-4" />
              Criar RDO
            </Button>
          </Link>
          <Button variant="outline" className="w-full sm:w-auto" onClick={handleOpenEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Editar Obra
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Progresso Geral</p>
              <div className="flex items-end space-x-2">
                <span className="text-2xl font-bold text-construction-green">{obra.progresso}%</span>
                <TrendingUp className="h-4 w-4 text-construction-green" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Orçamento</p>
              <span className="text-lg font-semibold text-card-foreground">
                {formatCurrency(obra.orcamento)}
              </span>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Data de Início</p>
              <span className="text-lg font-semibold text-card-foreground">
                {formatDate(obra.dataInicio)}
              </span>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Previsão de Término</p>
              <span className="text-lg font-semibold text-card-foreground">
                {formatDate(obra.previsaoTermino)}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-secondary rounded-full h-3">
              <div
                className="bg-construction-green h-3 rounded-full transition-all"
                style={{ width: `${obra.progresso}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 sm:grid-cols-8 bg-muted">
          <TabsTrigger value="geral" className="text-xs sm:text-sm">Geral</TabsTrigger>
          <TabsTrigger value="documentos" className="text-xs sm:text-sm">Documentos</TabsTrigger>
          <TabsTrigger value="rdos" className="text-xs sm:text-sm">RDOs</TabsTrigger>
          <TabsTrigger value="atividades" className="text-xs sm:text-sm">Atividades</TabsTrigger>
          <TabsTrigger value="equipes" className="text-xs sm:text-sm">Equipes</TabsTrigger>
          <TabsTrigger value="equipamentos" className="text-xs sm:text-sm">Equipamentos</TabsTrigger>
          <TabsTrigger value="financeiro" className="text-xs sm:text-sm">Financeiro</TabsTrigger>
          <TabsTrigger value="imagens" className="text-xs sm:text-sm">Imagens</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Responsável:</span>
                    <span className="ml-2 font-medium text-card-foreground">{obra.responsavel}</span>
                  </div>
                  <div className="flex items-center">
                    <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Cliente:</span>
                    <span className="ml-2 font-medium text-card-foreground">{obra.cliente}</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Área:</span>
                    <span className="ml-2 font-medium text-card-foreground">{obra.area}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Descrição do Projeto</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-card-foreground">{obra.descricao}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documentos" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-card-foreground">Documentos da Obra</CardTitle>
                  <CardDescription>Documentos anexados da obra e RDOs</CardDescription>
                </div>
                <Button variant="outline" onClick={() => setIsDocumentDialogOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Anexar Documento
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {documentos.length === 0 ? (
                <div className="flex items-center justify-center h-32 bg-muted rounded-lg border-2 border-dashed border-border">
                  <div className="text-center">
                    <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">Nenhum documento anexado</p>
                  </div>
                </div>
              ) : (
                documentos.map((documento) => (
                  <div key={documento.id} className="flex items-center justify-between gap-3 p-3 bg-muted/30 border border-border rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-5 w-5 text-construction-orange flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-card-foreground truncate">{documento.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {documento.categoria || documento.tipo} - {formatFileSize(documento.tamanho)} - Origem: {documento.origem}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{formatDate(documento.created_at)}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rdos" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-card-foreground">Relatórios Diários de Obra (RDO)</CardTitle>
                  <CardDescription>RDOs vinculados a esta obra</CardDescription>
                </div>
                <Link to="/app/rdo/novo" state={{ selectedObraId: id }}>
                  <Button className="gradient-construction border-0">
                    <FileText className="mr-2 h-4 w-4" />
                    Novo RDO
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {rdosLoading ? (
                <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                  <span>Carregando RDOs...</span>
                </div>
              ) : rdosReais.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Nenhum RDO cadastrado para esta obra</p>
                  <Link to="/app/rdo/novo" state={{ selectedObraId: id }} className="mt-3 inline-block">
                    <Button size="sm" className="gradient-construction border-0">
                      <FileText className="mr-2 h-4 w-4" />
                      Criar primeiro RDO
                    </Button>
                  </Link>
                </div>
              ) : (
                rdosReais.map((rdo) => {
                  const statusMap: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
                    aprovado: { label: 'Aprovado', icon: <CheckCircle className="h-4 w-4" />, cls: 'bg-construction-green text-white' },
                    em_analise: { label: 'Em Análise', icon: <Clock className="h-4 w-4" />, cls: 'bg-construction-blue text-white' },
                    rejeitado: { label: 'Rejeitado', icon: <AlertCircle className="h-4 w-4" />, cls: 'bg-destructive text-white' },
                    rascunho: { label: 'Rascunho', icon: <FileTextIcon className="h-4 w-4" />, cls: 'bg-muted text-muted-foreground' },
                  };
                  const normalizedStatus = ({
                    DRAFT: 'rascunho',
                    SUBMITTED: 'em_analise',
                    APPROVED: 'aprovado',
                    REJECTED: 'rejeitado',
                  } as Record<string, string>)[rdo.status] ?? rdo.status;
                  const s = statusMap[normalizedStatus] ?? statusMap.rascunho;
                  return (
                    <div key={rdo.id} className="p-4 bg-muted/30 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-construction-orange" />
                            <span className="font-medium text-card-foreground">
                              RDO — {new Date(rdo.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </span>
                            <Badge className={s.cls}>
                              <span className="flex items-center gap-1">{s.icon}{s.label}</span>
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground pl-6">
                            {rdo.clima && <span>☁ {rdo.clima}</span>}
                            <span>{rdo.totalAtividades} atividade{rdo.totalAtividades !== 1 ? 's' : ''}</span>
                            {rdo.totalEquipamentos > 0 && (
                              <span className="flex items-center gap-1">
                                <WrenchIcon className="h-3 w-3" />
                                {rdo.totalEquipamentos} equipamento{rdo.totalEquipamentos !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          {rdo.observacoes && (
                            <p className="text-xs text-muted-foreground pl-6 truncate max-w-xs">
                              {rdo.observacoes}
                            </p>
                          )}
                        </div>
                        <Link to={`/app/rdo/${rdo.id}/visualizar`}>
                          <Button size="sm" variant="outline">Ver Detalhes</Button>
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipes" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Equipes Alocadas</CardTitle>
              <CardDescription>Equipes trabalhando nesta obra</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {equipes.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Nenhuma equipe vinculada a RDOs desta obra.</p>
                  <p className="text-xs text-muted-foreground mt-1">Cadastre colaboradores em Equipes e selecione-os ao criar um RDO.</p>
                </div>
              ) : (
                equipes.map((equipe, index) => (
                  <div key={`${equipe.nome}-${index}`} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Users className="h-8 w-8 text-construction-blue" />
                      <div>
                        <p className="font-medium text-card-foreground">{equipe.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {equipe.funcao} - {equipe.horasTrabalho || 0}h registradas em RDOs
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{equipe.membros} registro{equipe.membros !== 1 ? 's' : ''}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="atividades" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Atividades da Obra</CardTitle>
              <CardDescription>Atividades vinculadas a esta obra</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {atividadesDetalhadas.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Nenhuma atividade registrada nos RDOs desta obra.</p>
                <Link to="/app/rdo/novo" state={{ selectedObraId: id }} className="mt-3 inline-block">
                  <Button size="sm" variant="outline">
                    Registrar atividades em um RDO
                  </Button>
                </Link>
              </div>
              ) : (
                atividadesDetalhadas.map((atividade) => (
                  <div key={atividade.id} className="flex items-center justify-between gap-3 p-3 bg-muted/30 border border-border rounded-lg">
                    <div className="min-w-0">
                      <p className="font-medium text-card-foreground truncate">{atividade.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {atividade.categoria} - {atividade.quantidade} {atividade.unidadeMedida} - RDO de {formatDate(atividade.data)}
                      </p>
                    </div>
                    <Badge className={getItemStatusColor(atividade.status)}>
                      {atividade.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipamentos" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Equipamentos Alocados</CardTitle>
              <CardDescription>Equipamentos em uso nesta obra</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {equipamentos.length === 0 ? (
                <div className="text-center py-8">
                  <Wrench className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Nenhum equipamento vinculado a RDOs desta obra.</p>
                  <p className="text-xs text-muted-foreground mt-1">Cadastre equipamentos e selecione-os nos RDOs para aparecerem aqui.</p>
                </div>
              ) : (
                equipamentos.map((equipamento, index) => (
                  <div key={`${equipamento.nome}-${index}`} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Wrench className="h-8 w-8 text-construction-orange" />
                      <div>
                        <p className="font-medium text-card-foreground">{equipamento.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {equipamento.categoria} - {equipamento.horasUso || 0}h de uso registradas
                        </p>
                      </div>
                    </div>
                    <Badge variant={equipamento.status === "Operacional" || equipamento.status === "Ativo" ? "default" : "destructive"}>
                      {equipamento.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financeiro" className="space-y-6">
          {/* Financial Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Orçamento Total</p>
                  <span className="text-xl font-bold text-card-foreground">
                    {formatCurrency(obra.financeiro.orcamentoTotal)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Valor Executado</p>
                  <span className="text-xl font-bold text-construction-blue">
                    {formatCurrency(obra.financeiro.valorExecutado)}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {percentualOrcamentoExecutado.toFixed(1)}% do orçamento
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Saldo Restante</p>
                  <span className="text-xl font-bold text-construction-green">
                    {formatCurrency(obra.financeiro.saldoRestante)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Custo por m²</p>
                  <span className="text-xl font-bold text-card-foreground">
                    {formatCurrency(obra.financeiro.orcamentoTotal / parseFloat((obra.area || '0').replace(/[^\d,]/g, '').replace(',', '.')) || 1)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress vs Budget Comparison */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-card-foreground">Progresso Físico vs Financeiro</CardTitle>
                  <CardDescription>Comparação entre execução física e financeira</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {percentualOrcamentoExecutado > obra.progresso + 5 && (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )}
                  <PieChart className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progresso Físico</span>
                    <span className="text-card-foreground font-medium">{obra.progresso}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3">
                    <div
                      className="bg-construction-green h-3 rounded-full transition-all"
                      style={{ width: `${obra.progresso}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progresso Financeiro</span>
                    <span className="text-card-foreground font-medium">{percentualOrcamentoExecutado.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${percentualOrcamentoExecutado > obra.progresso + 5
                        ? 'bg-red-500'
                        : 'bg-construction-blue'
                        }`}
                      style={{ width: `${Math.min(percentualOrcamentoExecutado, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {percentualOrcamentoExecutado > obra.progresso + 5 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-700 font-medium">
                      Alerta: Execução financeira está {(percentualOrcamentoExecutado - obra.progresso).toFixed(1)}%
                      acima do progresso físico
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Budget Items Analysis */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-card-foreground">Análise Orçamentária</CardTitle>
                  <CardDescription>Detalhamento por item de orçamento</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportObraPdf} disabled={isDownloading}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Atividade</th>
                      <th className="text-right p-3 text-sm font-medium text-muted-foreground">Previsto</th>
                      <th className="text-right p-3 text-sm font-medium text-muted-foreground">Executado</th>
                      <th className="text-right p-3 text-sm font-medium text-muted-foreground">Diferença</th>
                      <th className="text-right p-3 text-sm font-medium text-muted-foreground">%</th>
                      <th className="text-center p-3 text-sm font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {obra.financeiro.itensOrcamento.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">
                          Nenhuma despesa registrada para esta obra.
                        </td>
                      </tr>
                    ) : obra.financeiro.itensOrcamento.map((item) => (
                      <tr key={item.id} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="p-3 text-sm text-card-foreground font-medium">{item.atividade}</td>
                        <td className="p-3 text-sm text-card-foreground text-right">
                          {formatCurrency(item.valorPrevisto)}
                        </td>
                        <td className="p-3 text-sm text-card-foreground text-right">
                          {formatCurrency(item.valorExecutado)}
                        </td>
                        <td className={`p-3 text-sm text-right font-medium ${item.diferenca >= 0 ? 'text-red-500' : 'text-construction-green'
                          }`}>
                          {item.diferenca >= 0 ? '+' : ''}{formatCurrency(item.diferenca)}
                        </td>
                        <td className="p-3 text-sm text-card-foreground text-right">
                          {item.percentualExecutado.toFixed(1)}%
                        </td>
                        <td className="p-3 text-center">
                          <Badge className={getItemStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {despesas.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="text-sm font-semibold text-card-foreground">Despesas vinculadas</h4>
                  {despesas.slice(0, 5).map((despesa) => (
                    <div key={despesa.id} className="flex items-center justify-between gap-3 p-3 bg-muted/30 border border-border rounded-lg">
                      <div className="min-w-0">
                        <p className="font-medium text-card-foreground truncate">{despesa.fornecedor}</p>
                        <p className="text-xs text-muted-foreground">
                          {despesa.categoria} - NF {despesa.notaFiscal} - {formatDate(despesa.data)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-card-foreground">{formatCurrency(despesa.valor)}</p>
                        <p className="text-xs text-muted-foreground">{despesa.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imagens" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-card-foreground">Galeria de Imagens</CardTitle>
                  <CardDescription>Fotos do progresso da obra</CardDescription>
                </div>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload de Imagens
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {imagens.length === 0 ? (
                <div className="flex items-center justify-center h-32 bg-muted rounded-lg border-2 border-dashed border-border">
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">Nenhuma imagem carregada</p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {imagens.map((imagem) => (
                    <ObraImagePreviewCard key={imagem.id} imagem={imagem} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <NovaObraForm
        isOpen={isEditDialogOpen}
        onClose={handleCloseEdit}
        obra={obra}
      />

      <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
        <DialogContent className="sm:max-w-[560px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Anexar Documento</DialogTitle>
            <DialogDescription>Envie um arquivo vinculado a esta obra.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="documento-nome">Nome *</Label>
              <Input
                id="documento-nome"
                value={documentForm.nome}
                onChange={(event) => setDocumentForm(prev => ({ ...prev, nome: event.target.value }))}
                placeholder="Ex: Alvara de construcao"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select
                value={documentForm.categoria}
                onValueChange={(value) => setDocumentForm(prev => ({ ...prev, categoria: value as DocumentType }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {tiposDocumento.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="documento-arquivo">Arquivo *</Label>
              <Input
                id="documento-arquivo"
                type="file"
                accept={DOCUMENT_UPLOAD_ACCEPT}
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setDocumentForm(prev => ({
                    ...prev,
                    file,
                    nome: prev.nome || file?.name || "",
                  }));
                }}
              />
              <p className="text-xs text-muted-foreground">{DOCUMENT_UPLOAD_HELP_TEXT}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="documento-descricao">Descricao</Label>
              <Input
                id="documento-descricao"
                value={documentForm.descricao}
                onChange={(event) => setDocumentForm(prev => ({ ...prev, descricao: event.target.value }))}
                placeholder="Observacao opcional"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDocumentDialogOpen(false)} disabled={uploadDocument.isPending}>
              Cancelar
            </Button>
            <Button
              className="gradient-construction border-0"
              onClick={handleUploadDocumentoObra}
              disabled={uploadDocument.isPending || !documentForm.file || !documentForm.nome || !documentForm.categoria}
            >
              {uploadDocument.isPending ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

type ObraImagemPreview = {
  id: string;
  nome: string;
  url: string;
  previewUrl?: string | null;
  created_at: string;
  origem: 'Obra' | 'RDO';
};

const isRenderableImageUrl = (value?: string | null) =>
  Boolean(value && /^(https?:|blob:|data:)/i.test(value));

const formatImageDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00`).toLocaleDateString('pt-BR');
};

function ObraImagePreviewCard({ imagem }: { imagem: ObraImagemPreview }) {
  const [previewFailed, setPreviewFailed] = useState(false);
  const fallbackUrl = isRenderableImageUrl(imagem.url) ? imagem.url : null;
  const previewSrc = imagem.previewUrl || fallbackUrl;
  const showPreview = Boolean(previewSrc) && !previewFailed;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-muted/30 transition-colors hover:bg-muted/40">
      <div className="relative aspect-[4/3] bg-muted/40">
        {showPreview ? (
          <img
            src={previewSrc!}
            alt={`Pre-visualizacao de ${imagem.nome}`}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => setPreviewFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
            <span className="text-xs">Preview indisponivel</span>
          </div>
        )}
        <Badge variant="secondary" className="absolute left-2 top-2 bg-background/90 text-[11px]">
          {imagem.origem}
        </Badge>
      </div>
      <div className="p-3">
        <p className="truncate font-medium text-card-foreground" title={imagem.nome}>
          {imagem.nome}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatImageDate(imagem.created_at)}
        </p>
      </div>
    </div>
  );
}

export default ObraDetalhes;
