import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DocumentoExpandableCard } from "@/components/DocumentoExpandableCard";
import { FileText, Search, Plus, Upload, Loader2 } from "lucide-react";
import { useDocuments, Documento, DocumentType } from "@/hooks/useDocuments";
import { useObras } from "@/hooks/useObras";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useDownload } from "@/hooks/useDownload";
import { generateStandardFilename } from "@/utils/downloadHelper";

const Documentos = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedObra, setSelectedObra] = useState("all");
  const [selectedTipo, setSelectedTipo] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [newDocData, setNewDocData] = useState<{
    nome: string;
    tipo: string;
    obra: string;
    descricao: string;
    versao: string;
    file: File | null;
  }>({
    nome: "",
    tipo: "",
    obra: "",
    descricao: "",
    versao: "", // Not used in backend yet, but kept for UI
    file: null
  });

  const { documentos, isLoading, uploadDocument, deleteDocument } = useDocuments({
    obraId: selectedObra,
    categoria: selectedTipo,
    search: searchTerm
  });

  const { obras } = useObras();
  const { isLoading: isDownloading, startDownload } = useDownload();

  const tiposDocumento: DocumentType[] = [
    "Projeto",
    "Licença",
    "Relatório",
    "Memorial",
    "Cronograma",
    "Contrato",
    "Certificado",
    "Laudo",
    "Outros"
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewDocData({ ...newDocData, file: e.target.files[0] });
    }
  };

  const handleUpload = async () => {
    if (!newDocData.file || !newDocData.nome || !newDocData.tipo) {
      toast.error("Preencha os campos obrigatórios e selecione um arquivo.");
      return;
    }

    uploadDocument.mutate({
      nome: newDocData.nome,
      categoria: newDocData.tipo,
      obra_id: newDocData.obra, // Optional
      descricao: newDocData.descricao,
      file: newDocData.file
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setNewDocData({ nome: "", tipo: "", obra: "", descricao: "", versao: "", file: null });
      }
    });
  };

  const handleEditDocumento = (documento: Documento) => {
    console.log("Editando documento:", documento);
    // Implementar lógica de edição no futuro
    toast.info("Edição em breve");
  };

  const handleDeleteDocumento = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este documento?")) {
      deleteDocument.mutate(id);
    }
  };

  const handleDownloadDocumento = async (documento: Documento) => {
    const filename = generateStandardFilename("documento", documento.nome, documento.tipo);

    // Para forçar o download com o nome correto de arquivos do Storage, 
    // precisamos baixar o blob primeiro.
    const downloadPromise = fetch(documento.url)
      .then(res => {
        if (!res.ok) throw new Error("Erro ao baixar arquivo do storage");
        return res.blob();
      });

    await startDownload(downloadPromise, filename);
  };

  const handleViewDocumento = (documento: Documento) => {
    window.open(documento.url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Gestão de Documentos</h1>
          <p className="text-muted-foreground text-sm md:text-base">Centralize e organize todos os documentos das obras</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-construction border-0 hover:opacity-90 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Novo Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-card-foreground">Upload de Documento</DialogTitle>
              <DialogDescription>
                Faça upload de um novo documento para a obra
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Documento *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Projeto Estrutural - Bloco A"
                  value={newDocData.nome}
                  onChange={(e) => setNewDocData({ ...newDocData, nome: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Documento *</Label>
                  <Select
                    value={newDocData.tipo}
                    onValueChange={(val) => setNewDocData({ ...newDocData, tipo: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposDocumento.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="obra">Obra (Opcional)</Label>
                  <Select
                    value={newDocData.obra}
                    onValueChange={(val) => setNewDocData({ ...newDocData, obra: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a obra" />
                    </SelectTrigger>
                    <SelectContent>
                      {obras.map((obra) => (
                        <SelectItem key={obra.id} value={obra.id}>
                          {obra.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="arquivo">Arquivo *</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-muted/50 transition cursor-pointer relative">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  />
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-foreground">
                    {newDocData.file ? newDocData.file.name : "Clique para selecionar ou arraste o arquivo aqui"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOC, XLS, JPG, PNG (máx. 50MB)
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  placeholder="Breve descrição do documento"
                  value={newDocData.descricao}
                  onChange={(e) => setNewDocData({ ...newDocData, descricao: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={uploadDocument.isPending}>
                Cancelar
              </Button>
              <Button
                className="gradient-construction border-0"
                onClick={handleUpload}
                disabled={uploadDocument.isPending}
              >
                {uploadDocument.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                {uploadDocument.isPending ? "Enviando..." : "Fazer Upload"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label>Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Obra</Label>
          <Select value={selectedObra} onValueChange={setSelectedObra}>
            <SelectTrigger>
              <SelectValue placeholder="Todas as obras" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as obras</SelectItem>
              {obras.map((obra) => (
                <SelectItem key={obra.id} value={obra.id}>
                  {obra.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tipo de Documento</Label>
          <Select value={selectedTipo} onValueChange={setSelectedTipo}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {tiposDocumento.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 flex items-end">
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("");
              setSelectedObra("all");
              setSelectedTipo("all");
            }}
            className="w-full"
          >
            Limpar Filtros
          </Button>
        </div>
      </div>

      {/* Documents Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {documentos.length > 0 ? (
            documentos.map((documento) => (
              <DocumentoExpandableCard
                key={documento.id}
                documento={documento}
                onEdit={handleEditDocumento}
                onDelete={handleDeleteDocumento}
                onDownload={handleDownloadDocumento}
                onView={handleViewDocumento}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium text-card-foreground">Nenhum documento encontrado</h3>
              <p className="mt-2 text-muted-foreground">
                {searchTerm || selectedObra !== "all" || selectedTipo !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Comece fazendo upload do seu primeiro documento"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Documentos;