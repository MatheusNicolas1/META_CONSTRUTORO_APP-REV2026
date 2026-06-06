import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  Copy,
  ExternalLink,
  Loader2,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  LixeiraEntityType,
  LixeiraItem,
  getLixeiraDaysLeft,
  getLixeiraEntityLabel,
  useLixeira,
} from '@/hooks/useLixeira';
import { toast } from 'sonner';

const ENTITY_OPTIONS: Array<{ value: LixeiraEntityType | 'all'; label: string }> = [
  { value: 'all', label: 'Todos os modulos' },
  { value: 'obras', label: 'Obras' },
  { value: 'documentos', label: 'Documentos' },
  { value: 'rdos', label: 'RDOs' },
  { value: 'checklists', label: 'Checklists' },
  { value: 'atividades', label: 'Atividades' },
  { value: 'expenses', label: 'Despesas' },
];

const formatDateTime = (value: string | null) => {
  if (!value) return 'Nao informado';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
};

const getDeadlineBadge = (item: LixeiraItem) => {
  const daysLeft = getLixeiraDaysLeft(item.purge_at);

  if (daysLeft === null) {
    return <Badge variant="secondary">Sem prazo</Badge>;
  }

  if (daysLeft <= 0) {
    return <Badge variant="destructive">Expirado</Badge>;
  }

  if (daysLeft <= 3) {
    return <Badge variant="destructive">{daysLeft} dia(s)</Badge>;
  }

  return <Badge variant="secondary">{daysLeft} dia(s)</Badge>;
};

export default function Lixeira() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState<LixeiraEntityType | 'all'>('all');
  const [permanentDeleteItem, setPermanentDeleteItem] = useState<LixeiraItem | null>(null);

  const {
    items,
    total,
    isLoading,
    error,
    refetch,
    restoreItem,
    deletePermanently,
  } = useLixeira({ search, entityType });

  const stats = useMemo(() => {
    const expired = items.filter((item) => getLixeiraDaysLeft(item.purge_at) === 0).length;
    const recoverable = items.length - expired;

    return { expired, recoverable };
  }, [items]);

  const handleCopyId = async (item: LixeiraItem) => {
    try {
      await navigator.clipboard.writeText(`${item.entity_type}:${item.entity_id}`);
      toast.success('Identificador copiado.');
    } catch {
      toast.error('Erro ao copiar identificador.');
    }
  };

  const handleOpenSource = (item: LixeiraItem) => {
    if (!item.source_path) return;
    navigate(item.source_path);
  };

  const handlePermanentDelete = () => {
    if (!permanentDeleteItem) return;

    deletePermanently.mutate(permanentDeleteItem, {
      onSettled: () => setPermanentDeleteItem(null),
    });
  };

  const renderActions = (item: LixeiraItem) => {
    const isExpired = getLixeiraDaysLeft(item.purge_at) === 0;
    const isRestoring = restoreItem.isPending && restoreItem.variables?.entity_id === item.entity_id;
    const isDeleting = deletePermanently.isPending && deletePermanently.variables?.entity_id === item.entity_id;

    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => restoreItem.mutate(item)}
          disabled={isExpired || restoreItem.isPending || deletePermanently.isPending}
        >
          {isRestoring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
          Restaurar
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleCopyId(item)}
          title="Copiar identificador"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleOpenSource(item)}
          title="Abrir origem"
          disabled={!item.source_path}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
        <Button
          variant="destructive"
          size="icon"
          onClick={() => setPermanentDeleteItem(item)}
          title="Excluir definitivamente"
          disabled={restoreItem.isPending || deletePermanently.isPending}
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
      </div>
    );
  };

  return (
    <div className="responsive-spacing">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Lixeira</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Itens excluidos ficam disponiveis para restauracao por ate 30 dias.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
            <div className="rounded-lg border bg-card px-3 py-2">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-semibold">{total}</p>
            </div>
            <div className="rounded-lg border bg-card px-3 py-2">
              <p className="text-xs text-muted-foreground">Recuperaveis</p>
              <p className="text-xl font-semibold">{stats.recoverable}</p>
            </div>
            <div className="rounded-lg border bg-card px-3 py-2">
              <p className="text-xs text-muted-foreground">Expirados</p>
              <p className="text-xl font-semibold">{stats.expired}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_240px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, modulo ou identificador..."
              className="pl-10"
            />
          </div>
          <Select value={entityType} onValueChange={(value) => setEntityType(value as LixeiraEntityType | 'all')}>
            <SelectTrigger>
              <SelectValue placeholder="Modulo" />
            </SelectTrigger>
            <SelectContent>
              {ENTITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock className="mr-2 h-4 w-4" />}
            Atualizar
          </Button>
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5" />
              <div className="space-y-2">
                <p className="font-medium">Erro ao carregar a Lixeira</p>
                <p className="text-sm">Verifique o schema da Lixeira e tente novamente.</p>
                <Button size="sm" variant="outline" onClick={() => refetch()}>
                  Tentar novamente
                </Button>
              </div>
            </div>
          </div>
        ) : isLoading ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
            Carregando itens excluidos...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border bg-card p-10 text-center">
            <Trash2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Nenhum item na Lixeira</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Quando um item operacional for excluido, ele aparecera aqui por ate 30 dias.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Modulo</TableHead>
                    <TableHead>Excluido em</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={`${item.entity_type}-${item.entity_id}`}>
                      <TableCell className="max-w-[360px]">
                        <p className="truncate font-medium">{item.title || 'Item sem nome'}</p>
                        <p className="truncate text-xs text-muted-foreground">{item.subtitle || item.entity_id}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getLixeiraEntityLabel(item.entity_type)}</Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(item.deleted_at)}</TableCell>
                      <TableCell>{getDeadlineBadge(item)}</TableCell>
                      <TableCell className="text-right">{renderActions(item)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-3 md:hidden">
              {items.map((item) => (
                <Card key={`${item.entity_type}-${item.entity_id}`}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.title || 'Item sem nome'}</p>
                        <p className="truncate text-xs text-muted-foreground">{item.subtitle || item.entity_id}</p>
                      </div>
                      {getDeadlineBadge(item)}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">{getLixeiraEntityLabel(item.entity_type)}</Badge>
                      <span>{formatDateTime(item.deleted_at)}</span>
                    </div>
                    {renderActions(item)}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      <AlertDialog open={!!permanentDeleteItem} onOpenChange={(open) => !open && setPermanentDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir definitivamente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao remove o item permanentemente e nao podera ser desfeita. Use apenas quando tiver certeza de
              que a restauracao nao sera necessaria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePermanentDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
