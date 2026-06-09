import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2, Plus, Trash2, DollarSign, CreditCard,
  Users, Clock, Shield, CheckCircle, XCircle, Edit3,
  ExternalLink, Activity, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/components/auth/AuthContext";

// Tipos
type EnterprisePlan = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  slug: string;
  description: string;
  org_id: string | null;
  monthly_price_cents: number;
  yearly_price_cents: number | null;
  stripe_product_id: string | null;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  custom_features: string[];
  max_users: number | null;
  max_obras: number | null;
  valid_from: string | null;
  valid_until: string | null;
  trial_days: number;
  status: "active" | "negotiating" | "expired" | "cancelled";
  internal_notes: string;
  metadata: any;
};

type PlanForm = {
  name: string;
  slug: string;
  description: string;
  org_id: string;
  monthly_price_cents: number;
  yearly_price_cents: number;
  max_users: number;
  max_obras: number;
  trial_days: number;
  custom_features: string;
  internal_notes: string;
};

const emptyForm: PlanForm = {
  name: "",
  slug: "",
  description: "",
  org_id: "",
  monthly_price_cents: 0,
  yearly_price_cents: 0,
  max_users: 0,
  max_obras: 0,
  trial_days: 0,
  custom_features: JSON.stringify([
    "Tudo do plano Master",
    "White label (sua marca)",
    "Single Sign-On (SSO)",
    "SLA garantido 99.9%",
    "Treinamento dedicado da equipe",
    "On-premise disponível",
    "Contrato personalizado",
  ], null, 2),
  internal_notes: "",
};

const formatBRL = (cents: number | null) => {
  if (cents === null || cents === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  try {
    return format(new Date(value), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return value;
  }
};

const statusBadge = (status: string) => {
  const variants: Record<string, { label: string; className: string }> = {
    active: { label: "Ativo", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
    negotiating: { label: "Negociação", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
    expired: { label: "Expirado", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
    cancelled: { label: "Cancelado", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  };
  const v = variants[status] || { label: status, className: "bg-gray-100" };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${v.className}`}>{v.label}</span>;
};

const AdminEnterprisePlans = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [selectedPlan, setSelectedPlan] = useState<EnterprisePlan | null>(null);
  const [generatingCheckout, setGeneratingCheckout] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Listar planos
  const { data: plans, isLoading } = useQuery({
    queryKey: ["admin-enterprise-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enterprise_custom_plans")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as EnterprisePlan[];
    },
  });

  // Criar plano
  const createPlan = useMutation({
    mutationFn: async (values: PlanForm) => {
      let features: string[];
      try {
        features = JSON.parse(values.custom_features);
        if (!Array.isArray(features)) throw new Error("Precisa ser um array");
      } catch {
        features = values.custom_features.split("\n").filter(Boolean).map(s => s.trim().replace(/^["\s-]+/, ""));
      }

      const { data, error } = await supabase
        .from("enterprise_custom_plans")
        .insert({
          name: values.name,
          slug: values.slug || `enterprise-${Date.now()}`,
          description: values.description,
          org_id: values.org_id || null,
          monthly_price_cents: values.monthly_price_cents,
          yearly_price_cents: values.yearly_price_cents || null,
          custom_features: features,
          max_users: values.max_users || null,
          max_obras: values.max_obras || null,
          trial_days: values.trial_days || 0,
          internal_notes: values.internal_notes,
          created_by: user?.id,
          status: "negotiating",
        })
        .select("id")
        .single();

      if (error) throw error;

      // Registrar auditoria
      await supabase.from("enterprise_plan_audit_log").insert({
        plan_id: data.id,
        action: "created",
        changed_by: user?.id,
        new_values: { name: values.name, slug: values.slug, monthly_price_cents: values.monthly_price_cents },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-enterprise-plans"] });
      toast.success("Plano Enterprise criado com sucesso!");
      setOpen(false);
      setForm(emptyForm);
    },
    onError: (err: Error) => toast.error(`Erro ao criar: ${err.message}`),
  });

  // Deletar plano
  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("enterprise_custom_plans")
        .update({ status: "cancelled" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-enterprise-plans"] });
      toast.success("Plano cancelado");
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  // Gerar checkout Stripe
  const generateCheckout = useMutation({
    mutationFn: async (plan: EnterprisePlan) => {
      setGeneratingCheckout(plan.id);
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/create-enterprise-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            plan_id: plan.id,
            monthly_price_cents: plan.monthly_price_cents,
            yearly_price_cents: plan.yearly_price_cents,
            max_users: plan.max_users,
            custom_features: plan.custom_features,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar checkout");

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-enterprise-plans"] });
      toast.success("Checkout gerado! Redirecionando...");
      // Abrir em nova aba
      window.open(data.checkout_url, "_blank");
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
    onSettled: () => setGeneratingCheckout(null),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPlan.mutate(form);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-brand-orange" />
            Planos Enterprise
          </h2>
          <p className="text-muted-foreground mt-1">
            Crie e gerencie planos customizados com preço único por cliente. O checkout gera automaticamente os produtos na Stripe.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Plano Enterprise
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Plano Enterprise</DialogTitle>
              <DialogDescription>
                Defina nome, valor e features exclusivas. Depois gere um checkout Stripe para o cliente.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do plano *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Enterprise - Construtora ABC"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="enterprise-cliente-abc"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Plano personalizado para operaçoes de grande porte"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preço mensal (centavos) *</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.monthly_price_cents}
                    onChange={(e) => setForm({ ...form, monthly_price_cents: parseInt(e.target.value) || 0 })}
                    placeholder="49990"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Ex: 49990 = R$ 499,90
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Preço anual (centavos)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.yearly_price_cents}
                    onChange={(e) => setForm({ ...form, yearly_price_cents: parseInt(e.target.value) || 0 })}
                    placeholder="599880"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Máx. usuários</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.max_users}
                    onChange={(e) => setForm({ ...form, max_users: parseInt(e.target.value) || 0 })}
                    placeholder="Ilimitado"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Máx. obras</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.max_obras}
                    onChange={(e) => setForm({ ...form, max_obras: parseInt(e.target.value) || 0 })}
                    placeholder="Ilimitado"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dias trial</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.trial_days}
                    onChange={(e) => setForm({ ...form, trial_days: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Features (JSON Array)</Label>
                <Textarea
                  rows={6}
                  value={form.custom_features}
                  onChange={(e) => setForm({ ...form, custom_features: e.target.value })}
                  placeholder='["Feature 1", "Feature 2"]'
                />
              </div>

              <div className="space-y-2">
                <Label>Notas internas</Label>
                <Textarea
                  rows={3}
                  value={form.internal_notes}
                  onChange={(e) => setForm({ ...form, internal_notes: e.target.value })}
                  placeholder="Observaçoes do admin (não aparece pro cliente)"
                />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={createPlan.isPending}>
                  {createPlan.isPending ? "Criando..." : "Criar Plano Enterprise"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabela de Planos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5" />
            Planos Customizados ({plans?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" text="Carregando planos..." />
            </div>
          ) : !plans?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum plano Enterprise criado ainda.</p>
              <p className="text-sm mt-1">Clique em "Novo Plano Enterprise" para começar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Valor mensal</TableHead>
                    <TableHead>Valor anual</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usuários</TableHead>
                    <TableHead>Stripe</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{plan.name}</span>
                          {plan.org_id && (
                            <span className="text-xs text-muted-foreground">Org vinculada</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatBRL(plan.monthly_price_cents)}</TableCell>
                      <TableCell>{formatBRL(plan.yearly_price_cents)}</TableCell>
                      <TableCell>{statusBadge(plan.status)}</TableCell>
                      <TableCell>{plan.max_users || "∞"}</TableCell>
                      <TableCell>
                        {plan.stripe_price_id_monthly ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Vinculado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                            <XCircle className="w-3 h-3 mr-1" />
                            Sem Stripe
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(plan.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => generateCheckout.mutate(plan)}
                            disabled={generatingCheckout === plan.id || plan.status !== "active"}
                          >
                            {generatingCheckout === plan.id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <CreditCard className="w-3.5 h-3.5" />
                            )}
                            Checkout
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancelar plano?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  O plano "{plan.name}" será marcado como cancelado. Stripe não será afetada.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Voltar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-500 hover:bg-red-600"
                                  onClick={() => deletePlan.mutate(plan.id)}
                                >
                                  Cancelar Plano
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dicas de uso */}
      <Card className="bg-brand-orange-ghost border-brand-orange/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Activity className="w-8 h-8 text-brand-orange flex-shrink-0 mt-1" />
            <div className="space-y-2 text-sm">
              <h4 className="font-semibold text-base">Como usar Planos Enterprise</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li><strong>Crie o plano</strong> com nome, valor e features combinadas com o cliente</li>
                <li>O plano fica em <strong>status "Negociação"</strong> até você ativar</li>
                <li>Quando fechar o acordo, clique em <strong>"Checkout"</strong> — a Edge Function cria o produto na Stripe e gera um link de pagamento</li>
                <li>Envie o link para o cliente. O <strong>produto Stripe é único</strong> por plano Enterprise</li>
                <li>Você pode <strong>editar valor depois</strong> e gerar um novo checkout com novo produto Stripe</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEnterprisePlans;
