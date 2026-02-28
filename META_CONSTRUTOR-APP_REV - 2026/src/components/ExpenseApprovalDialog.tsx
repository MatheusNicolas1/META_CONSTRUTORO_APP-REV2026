import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, FileText, Download } from 'lucide-react';
import type { Expense } from '@/types/expense';
import { useExpenses } from '@/hooks/useExpenses';

interface ExpenseApprovalDialogProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExpenseApprovalDialog({ expense, open, onOpenChange }: ExpenseApprovalDialogProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const { approveExpense } = useExpenses();

  if (!expense) return null;

  const handleApprove = async () => {
    const nextStatus = expense.approval_status === 'Pending Manager'
      ? 'Pending General Manager'
      : 'Approved';

    await approveExpense.mutateAsync({
      id: expense.id,
      approval_status: nextStatus,
    });
    onOpenChange(false);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Por favor, informe o motivo da rejeição');
      return;
    }

    await approveExpense.mutateAsync({
      id: expense.id,
      approval_status: 'Rejected',
      rejection_reason: rejectionReason,
    });
    setRejectionReason('');
    onOpenChange(false);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'Pending Manager': { label: 'Pendente - Gestor', variant: 'secondary' as const },
      'Pending General Manager': { label: 'Pendente - Gerente Geral', variant: 'secondary' as const },
      'Approved': { label: 'Aprovado', variant: 'default' as const },
      'Rejected': { label: 'Rejeitado', variant: 'destructive' as const },
    };
    const config = statusMap[status as keyof typeof statusMap];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Despesa</DialogTitle>
          <div className="sr-only">
            Detalhes completos da despesa para aprovação ou rejeição.
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Número da NF</Label>
              <p className="font-medium">{expense.invoice_number}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Fornecedor</Label>
              <p className="font-medium">{expense.supplier_name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Categoria</Label>
              <p className="font-medium">{expense.cost_category}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Valor</Label>
              <p className="font-medium text-lg">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(expense.amount)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Data da Despesa</Label>
              <p className="font-medium">
                {new Date(expense.date_of_expense).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="mt-1">{getStatusBadge(expense.approval_status)}</div>
            </div>
          </div>

          {expense.notes && (
            <div>
              <Label className="text-muted-foreground">Observações</Label>
              <p className="text-sm mt-1">{expense.notes}</p>
            </div>
          )}

          {expense.invoice_file_url && (
            <div>
              <Label className="text-muted-foreground">Nota Fiscal</Label>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                asChild
              >
                <a
                  href={expense.invoice_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Visualizar Nota Fiscal
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            </div>
          )}

          {expense.approval_status === 'Rejected' && expense.rejection_reason && (
            <div className="bg-destructive/10 p-3 rounded-md">
              <Label className="text-destructive">Motivo da Rejeição</Label>
              <p className="text-sm mt-1">{expense.rejection_reason}</p>
            </div>
          )}

          {(expense.approval_status === 'Pending Manager' ||
            expense.approval_status === 'Pending General Manager') && (
              <div>
                <Label htmlFor="rejection-reason">Motivo da Rejeição (opcional)</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Descreva o motivo caso vá rejeitar..."
                  rows={3}
                  className="mt-2"
                />
              </div>
            )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {(expense.approval_status === 'Pending Manager' ||
            expense.approval_status === 'Pending General Manager') && (
              <>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={approveExpense.isPending}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Rejeitar
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={approveExpense.isPending}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Aprovar
                </Button>
              </>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
