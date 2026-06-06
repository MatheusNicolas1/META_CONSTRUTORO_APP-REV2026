import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Search, Filter, Download, Eye, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { IntegrationLog, IntegrationType } from "@/types/integration";
import { useToast } from "@/hooks/use-toast";

interface IntegrationLogsProps {
  logs: IntegrationLog[];
  onRefresh: () => Promise<void>;
  onExport: (filters: LogFilters) => Promise<void>;
}

interface LogFilters {
  search?: string;
  integrationType?: IntegrationType;
  status?: 'success' | 'error' | 'pending';
  dateFrom?: string;
  dateTo?: string;
}

export const IntegrationLogs = ({ logs, onRefresh, onExport }: IntegrationLogsProps) => {
  const { toast } = useToast();
  const [filters, setFilters] = useState<LogFilters>({});
  const [selectedLog, setSelectedLog] = useState<IntegrationLog | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filteredLogs, setFilteredLogs] = useState<IntegrationLog[]>(logs);

  useEffect(() => {
    let filtered = [...logs];

    if (filters.search) {
      filtered = filtered.filter(log => 
        log.event.toLowerCase().includes(filters.search!.toLowerCase()) ||
        log.message.toLowerCase().includes(filters.search!.toLowerCase())
      );
    }

    if (filters.integrationType) {
      filtered = filtered.filter(log => log.integrationType === filters.integrationType);
    }

    if (filters.status) {
      filtered = filtered.filter(log => log.status === filters.status);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(filters.dateFrom!));
    }

    if (filters.dateTo) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(filters.dateTo!));
    }

    setFilteredLogs(filtered);
  }, [logs, filters]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      toast({
        title: "Logs atualizados",
        description: "Lista de logs atualizada com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Falha ao atualizar os logs",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = async () => {
    try {
      await onExport(filters);
      toast({
        title: "Logs exportados",
        description: "O arquivo CSV foi gerado com os logs filtrados",
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Falha ao exportar os logs",
        variant: "destructive",
      });
    }
  };

  const viewLogDetails = (log: IntegrationLog) => {
    setSelectedLog(log);
    setIsDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-construction-green" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-construction-red" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-construction-orange" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-construction-green">Sucesso</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getIntegrationTypeBadge = (type: IntegrationType) => {
    const colors: Record<IntegrationType, string> = {
      n8n: 'bg-blue-600',
      whatsapp: 'bg-green-600',
      gmail: 'bg-red-600',
      googledrive: 'bg-blue-500',
      webhook: 'bg-purple-600'
    };

    return (
      <Badge variant="outline" className={`text-white ${colors[type]}`}>
        {type.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-construction-blue" />
              <CardTitle>Logs de Integração</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? 'Atualizando...' : 'Atualizar'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-1" />
                Exportar
              </Button>
            </div>
          </div>
          <CardDescription>
            Visualize e monitore todos os eventos de integração do sistema
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar eventos..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select 
                value={filters.integrationType || 'all'} 
                onValueChange={(value) => setFilters({ 
                  ...filters, 
                  integrationType: value === 'all' ? undefined : value as IntegrationType 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="n8n">N8N</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="gmail">Gmail</SelectItem>
                  <SelectItem value="googledrive">Google Drive</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select 
                value={filters.status || 'all'} 
                onValueChange={(value) => setFilters({ 
                  ...filters, 
                  status: value === 'all' ? undefined : value as any 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data</label>
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>
          </div>

          {/* Tabela de Logs */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getIntegrationTypeBadge(log.integrationType)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {log.event}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(log.status)}
                      {getStatusBadge(log.status)}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {log.message}
                  </TableCell>
                  <TableCell>
                    {log.duration ? `${log.duration}ms` : '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewLogDetails(log)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum log encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes do Log */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedLog && getStatusIcon(selectedLog.status)}
              <span>Detalhes do Log</span>
            </DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">ID</label>
                  <p className="text-sm text-muted-foreground">{selectedLog.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Timestamp</label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo de Integração</label>
                  <p className="text-sm text-muted-foreground">{selectedLog.integrationType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Evento</label>
                  <p className="text-sm text-muted-foreground">{selectedLog.event}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(selectedLog.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Duração</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedLog.duration ? `${selectedLog.duration}ms` : 'Nao registrado'}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Mensagem</label>
                <p className="text-sm text-muted-foreground mt-1">{selectedLog.message}</p>
              </div>

              {selectedLog.error && (
                <div>
                  <label className="text-sm font-medium text-red-600">Erro</label>
                  <ScrollArea className="h-32 w-full border rounded p-3 mt-1">
                    <pre className="text-sm text-red-600">{selectedLog.error}</pre>
                  </ScrollArea>
                </div>
              )}

              {selectedLog.data && (
                <div>
                  <label className="text-sm font-medium">Dados</label>
                  <ScrollArea className="h-40 w-full border rounded p-3 mt-1">
                    <pre className="text-sm">{JSON.stringify(selectedLog.data, null, 2)}</pre>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
