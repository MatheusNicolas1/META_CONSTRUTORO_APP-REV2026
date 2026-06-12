import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRequireOrg } from '@/hooks/requireOrg';
import { useRDONichos } from '@/hooks/useRDONichos';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Plus,
  Edit3,
  Trash2,
  ArrowLeft,
  Layers,
  Palette,
  Type,
  AlignLeft,
  ToggleLeft,
  ToggleRight,
  GripVertical,
  Save,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Folder,
  HardHat,
  Shield,
  ClipboardList,
  Users,
  Wrench,
  Package,
  DollarSign,
  FileText,
  Search,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import type { RDONicho } from '@/types/rdo';

// ============================================================
// Opções de ícones para nichos
// ============================================================

const ICONE_OPCOES = [
  { value: 'Folder', label: 'Pasta', icon: <Folder className="h-4 w-4" /> },
  { value: 'HardHat', label: 'Obra', icon: <HardHat className="h-4 w-4" /> },
  { value: 'Shield', label: 'Segurança', icon: <Shield className="h-4 w-4" /> },
  { value: 'ClipboardList', label: 'OS', icon: <ClipboardList className="h-4 w-4" /> },
  { value: 'Users', label: 'Equipes', icon: <Users className="h-4 w-4" /> },
  { value: 'Wrench', label: 'Máquinas', icon: <Wrench className="h-4 w-4" /> },
  { value: 'Package', label: 'Materiais', icon: <Package className="h-4 w-4" /> },
  { value: 'DollarSign', label: 'Financeiro', icon: <DollarSign className="h-4 w-4" /> },
  { value: 'FileText', label: 'Documentos', icon: <FileText className="h-4 w-4" /> },
];

const COR_OPCOES = [
  { value: '#3b82f6', label: 'Azul' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#f97316', label: 'Laranja' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#f59e0b', label: 'Âmbar' },
  { value: '#10b981', label: 'Verde' },
  { value: '#06b6d4', label: 'Ciano' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#6366f1', label: 'Índigo' },
  { value: '#14b8a6', label: 'Teal' },
];

// ============================================================
// Página
// ============================================================

const AdminNichosPage = () => {
  const navigate = useNavigate();
  const { role } = useRequireOrg();
  const {
    nichos,
    isLoading,
    isFetching,
    createNicho,
    isCreating,
    updateNicho,
    isUpdating,
    deleteNicho,
    isDeleting,
    refetch,
  } = useRDONichos();

  // Estado de busca
  const [searchTerm, setSearchTerm] = useState('');

  // Estado do modal de criar/editar
  const [showDialog, setShowDialog] = useState(false);
  const [editingNicho, setEditingNicho] = useState<RDONicho | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formCor, setFormCor] = useState('#6366f1');
  const [formIcone, setFormIcone] = useState('Folder');

  // Estado do diálogo de excluir
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingNicho, setDeletingNicho] = useState<RDONicho | null>(null);

  // Filtragem
  const filteredNichos = useMemo(
    () =>
      nichos.filter(
        (n) =>
          n.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.slug.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [nichos, searchTerm]
  );

  // ---------- Handlers ----------

  const handleAbrirCriar = () => {
    setEditingNicho(null);
    setFormNome('');
    setFormDescricao('');
    setFormCor('#6366f1');
    setFormIcone('Folder');
    setShowDialog(true);
  };

  const handleAbrirEditar = (nicho: RDONicho) => {
    setEditingNicho(nicho);
    setFormNome(nicho.nome);
    setFormDescricao(nicho.descricao || '');
    setFormCor(nicho.cor);
    setFormIcone(nicho.icone || 'Folder');
    setShowDialog(true);
  };

  const handleSalvar = async () => {
    if (!formNome.trim()) {
      toast.error('Informe o nome do nicho.');
      return;
    }

    try {
      if (editingNicho) {
        await updateNicho({
          id: editingNicho.id,
          nome: formNome.trim(),
          descricao: formDescricao.trim() || undefined,
          cor: formCor,
          icone: formIcone,
        });
      } else {
        await createNicho({
          nome: formNome.trim(),
          descricao: formDescricao.trim() || undefined,
          cor: formCor,
          icone: formIcone,
        });
      }
      setShowDialog(false);
    } catch {
      // Toast já é tratado no hook
    }
  };

  const handleConfirmarExclusao = async () => {
    if (!deletingNicho) return;
    try {
      await deleteNicho(deletingNicho.id);
      setShowDeleteDialog(false);
      setDeletingNicho(null);
    } catch {
      // Toast já tratado
    }
  };

  const handleToggleAtivo = async (nicho: RDONicho) => {
    try {
      await updateNicho({ id: nicho.id, ativo: !nicho.ativo });
    } catch {
      // Toast já tratado
    }
  };

  // Verificar permissão
  const isAdmin = ['Presidente', 'Administrador'].includes(role);

  const getIconeComponente = (iconeName: string) => {
    const opcao = ICONE_OPCOES.find((o) => o.value === iconeName);
    return opcao?.icon || <Folder className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => navigate('/app/configuracoes')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Configurações
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Layers className="h-6 w-6 text-construction-orange" />
              Nichos de RDO
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerencie os nichos (categorias) de RDO da sua organização
            </p>
          </div>
        </div>

        {isAdmin && (
          <Button
            variant="default"
            size="sm"
            className="gap-1"
            onClick={handleAbrirCriar}
          >
            <Plus className="h-4 w-4" />
            Novo Nicho
          </Button>
        )}
      </div>

      {/* Busca e ações */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar nichos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
        <Badge variant="secondary" className="ml-auto">
          {filteredNichos.length} de {nichos.length}
        </Badge>
      </div>

      {/* Lista de nichos */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filteredNichos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers className="mb-3 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-1 text-lg font-medium text-foreground">
              {searchTerm ? 'Nenhum nicho encontrado' : 'Nenhum nicho cadastrado'}
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {searchTerm
                ? 'Tente ajustar sua busca.'
                : 'Os nichos são criados automaticamente ao configurar a organização.'}
            </p>
            {isAdmin && !searchTerm && (
              <Button
                variant="default"
                size="sm"
                className="gap-1"
                onClick={handleAbrirCriar}
              >
                <Plus className="h-4 w-4" />
                Criar Primeiro Nicho
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNichos.map((nicho) => (
            <Card
              key={nicho.id}
              className={`transition-all duration-200 hover:shadow-md ${
                !nicho.ativo ? 'opacity-60' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {/* Indicador de cor e ícone */}
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${nicho.cor}20` }}
                    >
                      <span style={{ color: nicho.cor }}>
                        {getIconeComponente(nicho.icone)}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        {nicho.nome}
                        {!nicho.ativo && (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-muted-foreground"
                          >
                            Inativo
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {nicho.slug}
                      </CardDescription>
                    </div>
                  </div>

                  {/* Ordem */}
                  <Badge variant="secondary" className="text-xs">
                    #{nicho.ordem}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Descrição */}
                {nicho.descricao && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {nicho.descricao}
                  </p>
                )}

                {/* Metadados */}
                <div className="flex flex-wrap items-center gap-2">
                  <div
                    className="flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs"
                    style={{
                      borderColor: `${nicho.cor}40`,
                      color: nicho.cor,
                    }}
                  >
                    <Palette className="h-3 w-3" />
                    {nicho.cor}
                  </div>
                  <div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    <Type className="h-3 w-3" />
                    {nicho.icone}
                  </div>
                </div>

                {/* Ações (admin only) */}
                {isAdmin && (
                  <div className="flex items-center justify-between border-t pt-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleToggleAtivo(nicho)}
                          >
                            {nicho.ativo ? (
                              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <Eye className="h-3.5 w-3.5 text-construction-green" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {nicho.ativo ? 'Desativar nicho' : 'Ativar nicho'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <div className="flex items-center gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleAbrirEditar(nicho)}
                            >
                              <Edit3 className="h-3.5 w-3.5 text-construction-blue" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:text-red-500"
                              onClick={() => {
                                setDeletingNicho(nicho);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Excluir</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog: Criar/Editar Nicho */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-construction-orange" />
              {editingNicho ? 'Editar Nicho' : 'Novo Nicho'}
            </DialogTitle>
            <DialogDescription>
              {editingNicho
                ? 'Altere as informações do nicho de RDO.'
                : 'Crie um novo nicho para categorizar os RDOs.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Nome */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Nome <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Ex: Execução de Obra"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Descrição
              </label>
              <Textarea
                placeholder="Descreva o propósito deste nicho..."
                value={formDescricao}
                onChange={(e) => setFormDescricao(e.target.value)}
                className="min-h-[60px] resize-y"
              />
            </div>

            {/* Cor */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                <Palette className="mr-1 inline h-4 w-4" />
                Cor
              </label>
              <div className="flex flex-wrap gap-2">
                {COR_OPCOES.map((cor) => (
                  <button
                    key={cor.value}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      formCor === cor.value
                        ? 'border-foreground scale-110 ring-2 ring-offset-1'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: cor.value }}
                    title={cor.label}
                    onClick={() => setFormCor(cor.value)}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  type="text"
                  value={formCor}
                  onChange={(e) => setFormCor(e.target.value)}
                  className="h-8 w-24 text-xs font-mono"
                  placeholder="#hex"
                />
                <div
                  className="h-6 w-6 rounded border"
                  style={{ backgroundColor: formCor }}
                />
              </div>
            </div>

            {/* Ícone */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Ícone
              </label>
              <div className="flex flex-wrap gap-2">
                {ICONE_OPCOES.map((opcao) => (
                  <button
                    key={opcao.value}
                    type="button"
                    className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-all ${
                      formIcone === opcao.value
                        ? 'border-construction-blue bg-construction-blue/10 text-construction-blue'
                        : 'border-border hover:bg-muted'
                    }`}
                    onClick={() => setFormIcone(opcao.value)}
                  >
                    {opcao.icon}
                    {opcao.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-construction-blue hover:bg-construction-blue/90"
              onClick={handleSalvar}
              disabled={isCreating || isUpdating || !formNome.trim()}
            >
              {isCreating || isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {editingNicho ? 'Atualizar' : 'Criar'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog: Confirmar exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Excluir Nicho
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o nicho{' '}
              <strong>{deletingNicho?.nome}</strong>?
              <br />
              Esta ação pode afetar RDOs que utilizam este nicho.
              {deletingNicho && (
                <div className="mt-3 rounded-md bg-muted p-3 text-sm">
                  <p>
                    <strong>Slug:</strong> {deletingNicho.slug}
                  </p>
                  <p>
                    <strong>Cor:</strong>{' '}
                    <span
                      className="inline-block h-3 w-3 rounded-full align-middle"
                      style={{ backgroundColor: deletingNicho.cor }}
                    />{' '}
                    {deletingNicho.cor}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleConfirmarExclusao}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminNichosPage;
