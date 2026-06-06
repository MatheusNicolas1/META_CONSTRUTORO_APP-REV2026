import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FornecedorExpandableCard } from "@/components/FornecedorExpandableCard";
import { useFornecedores } from "@/hooks/useFornecedores";
import { Skeleton } from "@/components/ui/skeleton";
import { Truck, Search, Plus, Loader2 } from "lucide-react";

const emptyFormData = {
  nome: "",
  categoria: "",
  contato: "",
  cnpj: "",
  telefone: "",
  email: "",
  endereco: "",
  observacoes: "",
};

const Fornecedores = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; nome: string } | null>(null);
  
  const [formData, setFormData] = useState(emptyFormData);
  const [editFormData, setEditFormData] = useState(emptyFormData);

  const { fornecedores, isLoading, createFornecedor, updateFornecedor, deleteFornecedor } = useFornecedores();

  const categorias = [
    "Materiais de Construção",
    "Estruturas Metálicas",
    "Materiais Elétricos",
    "Materiais Hidráulicos",
    "Ferramentas e Equipamentos",
    "Tintas e Acabamentos",
    "Madeira",
    "Serviços Especializados"
  ];

  const statusOptions = ["Ativo", "Inativo", "Pendente"];

  const filteredFornecedores = fornecedores.filter(fornecedor => {
    const matchesSearch = fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fornecedor.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fornecedor.contato.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = !selectedCategoria || selectedCategoria === "all" || fornecedor.categoria === selectedCategoria;
    const matchesStatus = !selectedStatus || selectedStatus === "all" || (fornecedor.ativo ? "Ativo" : "Inativo") === selectedStatus;
    
    return matchesSearch && matchesCategoria && matchesStatus;
  });

  const handleEditFornecedor = (fornecedor: any) => {
    setEditingId(fornecedor.id);
    setEditFormData({
      nome: fornecedor.nome || "",
      categoria: fornecedor.categoria || "",
      contato: fornecedor.contato || "",
      cnpj: fornecedor.cnpj || "",
      telefone: fornecedor.telefone || "",
      email: fornecedor.email || "",
      endereco: fornecedor.endereco || "",
      observacoes: fornecedor.observacoes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (!editingId || !editFormData.nome || !editFormData.categoria || !editFormData.contato) return;
    updateFornecedor.mutate({
      id: editingId,
      nome: editFormData.nome,
      categoria: editFormData.categoria,
      contato: editFormData.contato,
      cnpj: editFormData.cnpj || undefined,
      telefone: editFormData.telefone || undefined,
      email: editFormData.email || undefined,
      endereco: editFormData.endereco || undefined,
      observacoes: editFormData.observacoes || undefined,
    }, {
      onSuccess: () => {
        setEditFormData(emptyFormData);
        setEditingId(null);
        setIsEditDialogOpen(false);
      }
    });
  };

  const handleDeleteFornecedor = (id: number | string) => {
    const fornecedor = fornecedores.find((item) => String(item.id) === String(id));
    setPendingDelete({
      id: String(id),
      nome: fornecedor?.nome || "este fornecedor",
    });
  };

  const confirmDeleteFornecedor = () => {
    if (!pendingDelete) return;
    deleteFornecedor.mutate(pendingDelete.id, {
      onSuccess: () => setPendingDelete(null),
    });
  };

  const handleSubmit = () => {
    if (!formData.nome || !formData.categoria || !formData.contato) return;

    createFornecedor.mutate({
      nome: formData.nome,
      categoria: formData.categoria,
      contato: formData.contato,
      cnpj: formData.cnpj || undefined,
      telefone: formData.telefone || undefined,
      email: formData.email || undefined,
      endereco: formData.endereco || undefined,
      observacoes: formData.observacoes || undefined,
    }, {
      onSuccess: () => {
        setFormData({ nome: "", categoria: "", contato: "", cnpj: "", telefone: "", email: "", endereco: "", observacoes: "" });
        setIsDialogOpen(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Gestão de Fornecedores</h1>
          <p className="text-muted-foreground text-sm md:text-base">Gerencie sua rede de fornecedores e parceiros</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-construction border-0 hover:opacity-90 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-card-foreground">Cadastrar Novo Fornecedor</DialogTitle>
              <DialogDescription>
                Adicione um novo fornecedor ao seu cadastro
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Empresa *</Label>
                  <Input 
                    id="nome" 
                    placeholder="Ex: Cimento Forte Ltda"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria *</Label>
                  <Select 
                    value={formData.categoria}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input 
                    id="cnpj" 
                    placeholder="00.000.000/0001-00"
                    value={formData.cnpj}
                    onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contato">Contato Principal *</Label>
                  <Input 
                    id="contato" 
                    placeholder="Nome do responsável"
                    value={formData.contato}
                    onChange={(e) => setFormData(prev => ({ ...prev, contato: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input 
                    id="telefone" 
                    placeholder="(11) 99999-9999"
                    value={formData.telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="contato@empresa.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input 
                  id="endereco" 
                  placeholder="Rua, número - Cidade - Estado"
                  value={formData.endereco}
                  onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea 
                  id="observacoes" 
                  placeholder="Informações adicionais sobre o fornecedor"
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsDialogOpen(false);
                  setFormData({ nome: "", categoria: "", contato: "", cnpj: "", telefone: "", email: "", endereco: "", observacoes: "" });
                }}
                disabled={createFornecedor.isPending}
              >
                Cancelar
              </Button>
              <Button 
                className="gradient-construction border-0" 
                onClick={handleSubmit}
                disabled={createFornecedor.isPending}
              >
                {createFornecedor.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Cadastrar'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label>Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome, categoria ou contato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
            <SelectTrigger>
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categorias.map((categoria) => (
                <SelectItem key={categoria} value={categoria}>
                  {categoria}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
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
              setSelectedCategoria("all");
              setSelectedStatus("all");
            }}
            className="w-full"
          >
            Limpar Filtros
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {filteredFornecedores.map((fornecedor) => (
            <FornecedorExpandableCard
              key={fornecedor.id}
              fornecedor={{
                id: fornecedor.id,
                nome: fornecedor.nome,
                categoria: fornecedor.categoria,
                cnpj: fornecedor.cnpj || '',
                telefone: fornecedor.telefone || '',
                email: fornecedor.email || '',
                endereco: fornecedor.endereco || '',
                contato: fornecedor.contato,
                status: fornecedor.ativo ? 'Ativo' : 'Inativo',
                avaliacao: 0,
                observacoes: fornecedor.observacoes || '',
                ultimoPedido: null,
                totalPedidos: 0,
              }}
              onEdit={handleEditFornecedor}
              onDelete={handleDeleteFornecedor}
            />
          ))}
        </div>
      )}

      {!isLoading && filteredFornecedores.length === 0 && (
        <div className="text-center py-12">
          <Truck className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-card-foreground">Nenhum fornecedor encontrado</h3>
          <p className="mt-2 text-muted-foreground">
            {searchTerm || selectedCategoria !== "all" || selectedStatus !== "all"
              ? "Tente ajustar os filtros de busca" 
              : "Comece cadastrando seu primeiro fornecedor"}
          </p>
        </div>
      )}

      {/* Modal de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) { setEditingId(null); setEditFormData(emptyFormData); } }}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Editar Fornecedor</DialogTitle>
            <DialogDescription>
              Atualize os dados do fornecedor
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nome">Nome da Empresa *</Label>
                <Input id="edit-nome" value={editFormData.nome} onChange={(e) => setEditFormData(prev => ({ ...prev, nome: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-categoria">Categoria *</Label>
                <Select value={editFormData.categoria} onValueChange={(value) => setEditFormData(prev => ({ ...prev, categoria: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categorias.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-cnpj">CNPJ</Label>
                <Input id="edit-cnpj" value={editFormData.cnpj} onChange={(e) => setEditFormData(prev => ({ ...prev, cnpj: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contato">Contato Principal *</Label>
                <Input id="edit-contato" value={editFormData.contato} onChange={(e) => setEditFormData(prev => ({ ...prev, contato: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-telefone">Telefone</Label>
                <Input id="edit-telefone" value={editFormData.telefone} onChange={(e) => setEditFormData(prev => ({ ...prev, telefone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">E-mail</Label>
                <Input id="edit-email" type="email" value={editFormData.email} onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-endereco">Endereço</Label>
              <Input id="edit-endereco" value={editFormData.endereco} onChange={(e) => setEditFormData(prev => ({ ...prev, endereco: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-observacoes">Observações</Label>
              <Textarea id="edit-observacoes" value={editFormData.observacoes} onChange={(e) => setEditFormData(prev => ({ ...prev, observacoes: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingId(null); setEditFormData(emptyFormData); }} disabled={updateFornecedor.isPending}>Cancelar</Button>
            <Button className="gradient-construction border-0" onClick={handleEditSubmit} disabled={updateFornecedor.isPending}>
              {updateFornecedor.isPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>) : 'Salvar Alterações'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fornecedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao vai excluir {pendingDelete?.nome || "este fornecedor"} do cadastro. A operacao usa a exclusao real do Supabase e nao sera confirmada se a requisicao falhar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteFornecedor.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteFornecedor}
              disabled={deleteFornecedor.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteFornecedor.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Fornecedores;
