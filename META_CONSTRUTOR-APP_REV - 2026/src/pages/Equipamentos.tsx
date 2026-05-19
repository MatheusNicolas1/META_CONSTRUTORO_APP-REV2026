import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EquipamentoExpandableCard } from "@/components/EquipamentoExpandableCard";
import { useEquipamentosSupabase } from "@/hooks/useEquipamentosSupabase";
import { Skeleton } from "@/components/ui/skeleton";
import { Wrench, Search, Plus, Loader2 } from "lucide-react";

const emptyFormData = { nome: "", categoria: "", status: "Operacional", observacoes: "" };

const Equipamentos = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState(emptyFormData);
  const [editFormData, setEditFormData] = useState(emptyFormData);

  const { equipamentos, isLoading, createEquipamento, updateEquipamento, deleteEquipamento } = useEquipamentosSupabase();

  const filteredEquipamentos = equipamentos.filter(equipamento =>
    equipamento.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equipamento.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equipamento.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditEquipamento = (equipamento: any) => {
    setEditingId(equipamento.id);
    setEditFormData({
      nome: equipamento.nome || "",
      categoria: equipamento.categoria || "",
      status: equipamento.status || "Operacional",
      observacoes: equipamento.observacoes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (!editingId || !editFormData.nome || !editFormData.categoria) return;
    updateEquipamento.mutate({
      id: editingId,
      nome: editFormData.nome,
      categoria: editFormData.categoria,
      status: editFormData.status,
      observacoes: editFormData.observacoes || undefined,
    }, {
      onSuccess: () => {
        setEditFormData(emptyFormData);
        setEditingId(null);
        setIsEditDialogOpen(false);
      }
    });
  };

  const handleDeleteEquipamento = (id: number | string) => {
    if (confirm("Tem certeza que deseja excluir este equipamento?")) {
      deleteEquipamento.mutate(String(id));
    }
  };

  const handleSubmit = () => {
    if (!formData.nome || !formData.categoria) return;

    createEquipamento.mutate({
      nome: formData.nome,
      categoria: formData.categoria,
      status: formData.status,
      observacoes: formData.observacoes || undefined,
    }, {
      onSuccess: () => {
        setFormData({ nome: "", categoria: "", status: "Operacional", observacoes: "" });
        setIsDialogOpen(false);
      }
    });
  };

  return (
    <div className="responsive-spacing">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground truncate">Gestão de Equipamentos</h1>
            <p className="text-muted-foreground text-sm md:text-base">Controle e monitore todos os equipamentos das obras</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-construction border-0 hover:opacity-90 w-full sm:w-auto sm:flex-shrink-0">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Novo Equipamento</span>
                <span className="sm:hidden">Adicionar</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-card-foreground">Cadastrar Novo Equipamento</DialogTitle>
                <DialogDescription>
                  Adicione um novo equipamento ao inventário
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Equipamento *</Label>
                  <Input 
                    id="nome" 
                    placeholder="Ex: Betoneira B-400"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                        <SelectItem value="Concreto">Concreto</SelectItem>
                        <SelectItem value="Elevação">Elevação</SelectItem>
                        <SelectItem value="Pneumático">Pneumático</SelectItem>
                        <SelectItem value="Terraplanagem">Terraplanagem</SelectItem>
                        <SelectItem value="Corte e Furação">Corte e Furação</SelectItem>
                        <SelectItem value="Medição">Medição</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Operacional">Operacional</SelectItem>
                        <SelectItem value="Manutenção">Manutenção</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Input 
                    id="observacoes" 
                    placeholder="Observações sobre o equipamento"
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
                    setFormData({ nome: "", categoria: "", status: "Operacional", observacoes: "" });
                  }}
                  disabled={createEquipamento.isPending}
                >
                  Cancelar
                </Button>
                <Button 
                  className="gradient-construction border-0" 
                  onClick={handleSubmit}
                  disabled={createEquipamento.isPending}
                >
                  {createEquipamento.isPending ? (
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

        <div className="w-full">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome, categoria ou status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredEquipamentos.map((equipamento) => (
              <EquipamentoExpandableCard
                key={equipamento.id}
                equipamento={{
                  id: equipamento.id,
                  nome: equipamento.nome,
                  categoria: equipamento.categoria,
                  modelo: '',
                  status: equipamento.status,
                  obra: '',
                  localizacao: '',
                  proximaManutencao: '',
                  observacoes: equipamento.observacoes || '',
                }}
                onEdit={handleEditEquipamento}
                onDelete={handleDeleteEquipamento}
              />
            ))}
          </div>
        )}

        {!isLoading && filteredEquipamentos.length === 0 && (
          <div className="text-center py-12">
            <Wrench className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-card-foreground">Nenhum equipamento encontrado</h3>
            <p className="mt-2 text-muted-foreground">
              {searchTerm ? "Tente ajustar os termos de busca" : "Comece cadastrando seu primeiro equipamento"}
            </p>
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) { setEditingId(null); setEditFormData(emptyFormData); } }}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Editar Equipamento</DialogTitle>
            <DialogDescription>Atualize os dados do equipamento</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome do Equipamento *</Label>
              <Input id="edit-nome" value={editFormData.nome} onChange={(e) => setEditFormData(prev => ({ ...prev, nome: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-categoria">Categoria *</Label>
                <Select value={editFormData.categoria} onValueChange={(value) => setEditFormData(prev => ({ ...prev, categoria: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Concreto">Concreto</SelectItem>
                    <SelectItem value="Elevação">Elevação</SelectItem>
                    <SelectItem value="Pneumático">Pneumático</SelectItem>
                    <SelectItem value="Terraplanagem">Terraplanagem</SelectItem>
                    <SelectItem value="Corte e Furação">Corte e Furação</SelectItem>
                    <SelectItem value="Medição">Medição</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editFormData.status} onValueChange={(value) => setEditFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Operacional">Operacional</SelectItem>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-observacoes">Observações</Label>
              <Input id="edit-observacoes" value={editFormData.observacoes} onChange={(e) => setEditFormData(prev => ({ ...prev, observacoes: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingId(null); setEditFormData(emptyFormData); }} disabled={updateEquipamento.isPending}>Cancelar</Button>
            <Button className="gradient-construction border-0" onClick={handleEditSubmit} disabled={updateEquipamento.isPending}>
              {updateEquipamento.isPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>) : 'Salvar Alterações'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Equipamentos;
