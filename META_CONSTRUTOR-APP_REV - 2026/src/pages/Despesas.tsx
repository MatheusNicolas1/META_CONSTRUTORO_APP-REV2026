import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Filter, Download, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ExpenseForm } from '@/components/ExpenseForm';
import { ExpenseApprovalDialog } from '@/components/ExpenseApprovalDialog';
import { useExpenses } from '@/hooks/useExpenses';
import { supabase } from '@/integrations/supabase/client';
import type { Expense, ApprovalStatus, CostCategory } from '@/types/expense';
import SEO from '@/components/SEO';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequireOrg } from '@/hooks/requireOrg';
import { toast } from 'sonner';
import { useReportPdfDownload } from '@/hooks/useReportPdfDownload';
import { Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function Despesas() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [filterStatus, setFilterStatus] = useState<ApprovalStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<CostCategory | 'all'>('all');
  const { expenses, isLoading } = useExpenses();
  const { rdo } = usePermissions();
  const { orgId, isLoading: orgLoading } = useRequireOrg();
  const { downloadReportPdf, isDownloading } = useReportPdfDownload();

  const { data: obras } = useQuery({
    queryKey: ['obras-list', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obras')
        .select('id, nome')
        .eq('org_id', orgId)
        .order('nome');
      if (error) throw error;
      return data || [];
    },
    enabled: !orgLoading && !!orgId,
  });

  const filteredExpenses = expenses?.filter((expense) => {
    if (filterStatus !== 'all' && expense.approval_status !== filterStatus) return false;
    if (filterCategory !== 'all' && expense.cost_category !== filterCategory) return false;
    return true;
  });

  const totalApproved = expenses
    ?.filter((e) => e.approval_status === 'Approved')
    .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

  const totalPending = expenses
    ?.filter((e) => e.approval_status === 'Pending Manager' || e.approval_status === 'Pending General Manager')
    .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

  const getStatusBadge = (status: ApprovalStatus) => {
    const statusMap = {
      'Pending Manager': { label: 'Pendente - Gestor', variant: 'secondary' as const },
      'Pending General Manager': { label: 'Pendente - Gerente', variant: 'secondary' as const },
      'Approved': { label: 'Aprovado', variant: 'default' as const },
      'Rejected': { label: 'Rejeitado', variant: 'destructive' as const },
    };
    const config = statusMap[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleExportPdf = () => {
    if (!filteredExpenses?.length) {
      toast.error("Não há despesas para exportar.");
      return;
    }

    downloadReportPdf({
      reportType: "DESPESAS",
      title: "Relatorio de Despesas",
      subtitle: "Controle financeiro e aprovacao de despesas",
      meta: [
        { label: "Total de despesas", value: filteredExpenses.length },
        { label: "Status", value: filterStatus === "all" ? "Todos" : filterStatus },
        { label: "Categoria", value: filterCategory === "all" ? "Todas" : filterCategory },
      ],
      sections: [
        {
          title: "Informacoes Basicas",
          meta: [
            { label: "Total aprovado", value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalApproved) },
            { label: "Total pendente", value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPending) },
          ],
        },
        {
          title: "Filtros Aplicados",
          meta: [
            { label: "Status", value: filterStatus === "all" ? "Todos" : filterStatus },
            { label: "Categoria", value: filterCategory === "all" ? "Todas" : filterCategory },
          ],
        },
        {
          title: "Indicadores Financeiros",
          meta: [
            { label: "Quantidade", value: filteredExpenses.length },
            { label: "Total geral", value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0)) },
          ],
        },
        {
          title: "Despesas",
          columns: [
            { key: "data", label: "Data" },
            { key: "nota", label: "Nota Fiscal" },
            { key: "fornecedor", label: "Fornecedor" },
            { key: "categoria", label: "Categoria" },
            { key: "valor", label: "Valor" },
            { key: "status", label: "Status" },
          ],
          rows: filteredExpenses.map((expense) => ({
            data: new Date(expense.date_of_expense).toLocaleDateString('pt-BR'),
            nota: expense.invoice_number,
            fornecedor: expense.supplier_name,
            categoria: expense.cost_category,
            valor: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(expense.amount)),
            status: expense.approval_status,
          })),
        },
        { title: "Aprovacoes" },
        { title: "Problemas e Ocorrencias" },
        { title: "Observacoes Gerais", notes: ["Relatorio de despesas gerado com dados financeiros reais filtrados."] },
        { title: "Anexos" },
      ],
    });
  };

  return (
    <>
      <SEO
        title="Gestão de Despesas"
        description="Gerencie e aprove despesas das obras"
      />

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Despesas</h1>
            <p className="text-muted-foreground">
              Controle financeiro e aprovação de despesas
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Despesa
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Aprovado</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(totalApproved)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendente Aprovação</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(totalPending)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expenses?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle>Lista de Despesas</CardTitle>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="Pending Manager">Pendente - Gestor</SelectItem>
                    <SelectItem value="Pending General Manager">Pendente - Gerente</SelectItem>
                    <SelectItem value="Approved">Aprovado</SelectItem>
                    <SelectItem value="Rejected">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as any)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filtrar por categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas categorias</SelectItem>
                    <SelectItem value="Material">Material</SelectItem>
                    <SelectItem value="Mão de Obra">Mão de Obra</SelectItem>
                    <SelectItem value="Equipamento">Equipamento</SelectItem>
                    <SelectItem value="Frete">Frete</SelectItem>
                    <SelectItem value="Serviços">Serviços</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleExportPdf}
                        className="hidden sm:inline-flex"
                        disabled={isDownloading}
                      >
                        {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Baixar arquivo</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Button
                  variant="outline"
                  onClick={handleExportPdf}
                  className="w-full sm:hidden"
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Exportar PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Carregando...</p>
            ) : !filteredExpenses?.length ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma despesa encontrada
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>NF</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        {new Date(expense.date_of_expense).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-medium">{expense.invoice_number}</TableCell>
                      <TableCell>{expense.supplier_name}</TableCell>
                      <TableCell>{expense.cost_category}</TableCell>
                      <TableCell className="text-right font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(expense.amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(expense.approval_status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedExpense(expense)}
                        >
                          Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <ExpenseForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        obras={obras || []}
      />

      <ExpenseApprovalDialog
        expense={selectedExpense}
        open={!!selectedExpense}
        onOpenChange={(open) => !open && setSelectedExpense(null)}
      />
    </>
  );
}
