import { useState, useEffect } from "react";
import {
  Copy,
  Share2,
  Check,
  Users,
  TrendingUp,
  DollarSign,
  Percent,
  ExternalLink,
  Loader2,
  BarChart3,
  MessageCircle,
  Send,
  Mail,
  Linkedin,
  Calendar,
  MousePointerClick,
  UserPlus,
  RefreshCw,
  Wallet,
  QrCode,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Banknote,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// ── Types ───────────────────────────────────────────
interface AffiliateSummary {
  saldoDisponivel: number;
  saldoPendente: number;
  totalRecebido: number;
  totalIndicacoes: number;
  totalVendas: number;
  taxaConversao: number;
}

interface Referral {
  id: string;
  nome: string;
  email: string;
  plano: string;
  data: string;
  status: "pending" | "converted" | "cancelled" | "refunded";
  valor: number;
  comissao: number;
}

interface Commission {
  id: string;
  data: string;
  cliente: string;
  plano: string;
  valorPago: number;
  comissao: number;
  status: "pending" | "approved" | "paid" | "cancelled" | "refunded";
}

interface ChartData {
  cliques: number[];
  cadastros: number[];
  conversoes: number[];
  comissoes: number[];
}

// ── Helpers ──────────────────────────────────────────
const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const statusLabel: Record<string, string> = {
  pending: "Pendente",
  converted: "Convertido",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  approved: "Aprovado",
  paid: "Pago",
};

const statusVariant: Record<string, "secondary" | "default" | "destructive" | "outline"> = {
  pending: "secondary",
  converted: "default",
  approved: "default",
  paid: "default",
  cancelled: "destructive",
  refunded: "destructive",
};

// ── Helper para serializar nomes dos indicados com dados reais ──
// Busca o nome do usuário a partir do email ou user_id
async function getUserDisplayName(authUserId: string | null): Promise<string> {
  if (!authUserId) return "---";
  try {
    const { data } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", authUserId)
      .maybeSingle();
    return data?.name || "Usuário";
  } catch {
    return "Usuário";
  }
}

// ── Subcomponentes ──────────────────────────────────

interface PixSaqueModalProps {
  saldoDisponivel: number;
  affiliateId: string;
  onSuccess: () => void;
}

function PixSaqueModal({ saldoDisponivel, affiliateId, onSuccess }: PixSaqueModalProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [pixKeyType, setPixKeyType] = useState<string>("cpf");
  const [pixKey, setPixKey] = useState("");
  const [pixHolderName, setPixHolderName] = useState("");
  const [pixCity, setPixCity] = useState("");
  const [sending, setSending] = useState(false);
  const [pixRequests, setPixRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Carregar solicitações existentes
  useEffect(() => {
    if (open && affiliateId) {
      loadPixRequests();
    }
  }, [open, affiliateId]);

  const loadPixRequests = async () => {
    setLoadingRequests(true);
    try {
      const { data, error } = await supabase
        .from("affiliate_pix_requests")
        .select("*")
        .eq("affiliate_id", affiliateId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setPixRequests(data || []);
    } catch (err) {
      console.error("Erro ao carregar solicitações:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleSolicitar = async () => {
    // Validar valor
    const valor = parseFloat(amount.replace(/[^\d,.]/g, "").replace(",", "."));
    if (!valor || isNaN(valor)) {
      toast({ title: "Valor inválido", description: "Digite um valor válido.", variant: "destructive" });
      return;
    }
    if (valor < 10) {
      toast({ title: "Valor mínimo", description: "O valor mínimo para saque é R$ 10,00.", variant: "destructive" });
      return;
    }
    if (valor > saldoDisponivel) {
      toast({ title: "Saldo insuficiente", description: `Seu saldo disponível é ${formatBRL(saldoDisponivel)}.`, variant: "destructive" });
      return;
    }
    if (!pixKey || pixKey.trim().length === 0) {
      toast({ title: "Chave PIX obrigatória", description: "Informe sua chave PIX.", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.rpc("request_affiliate_pix_withdrawal", {
        p_amount: valor,
        p_pix_key: pixKey.trim(),
        p_pix_key_type: pixKeyType,
        p_pix_holder_name: pixHolderName.trim(),
        p_pix_city: pixCity.trim(),
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Solicitação enviada! 🎉",
          description: `Saque de ${formatBRL(valor)} solicitado. Aguarde o processamento (até 48h úteis).`,
        });
        setOpen(false);
        setAmount("");
        setPixKey("");
        setPixHolderName("");
        setPixCity("");
        onSuccess();
      } else {
        toast({
          title: "Erro ao solicitar",
          description: data?.error || "Não foi possível processar a solicitação.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Erro ao solicitar saque:", err);
      toast({
        title: "Erro",
        description: err?.message || "Erro de conexão. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const formatAmount = (value: string) => {
    const nums = value.replace(/\D/g, "");
    if (nums.length === 0) return "";
    const intPart = nums.slice(0, -2) || "0";
    const decPart = nums.slice(-2).padStart(2, "0");
    return `${parseInt(intPart).toLocaleString("pt-BR")},${decPart}`;
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "rejected": return <XCircle className="h-4 w-4 text-red-500" />;
      case "cancelled": return <XCircle className="h-4 w-4 text-gray-400" />;
      default: return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  const statusLabelPix: Record<string, string> = {
    pending: "Pendente",
    approved: "Aprovado",
    processing: "Processando",
    completed: "Concluído",
    rejected: "Rejeitado",
    cancelled: "Cancelado",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-md"
          disabled={saldoDisponivel < 10}
        >
          <Wallet className="h-4 w-4" />
          {saldoDisponivel >= 10 ? "Sacar via PIX" : "Saldo Mínimo: R$ 10"}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-green-600" />
            Saque via PIX
          </DialogTitle>
          <DialogDescription>
            Solicite o saque do seu saldo disponível. Processamos em até 48h úteis.
          </DialogDescription>
        </DialogHeader>

        {/* Saldo disponível */}
        <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Saldo Disponível para Saque</p>
          <p className="text-3xl font-bold text-green-700 dark:text-green-300">
            {formatBRL(saldoDisponivel)}
          </p>
        </div>

        {saldoDisponivel >= 10 && (
          <>
            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="amount">Valor do Saque</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">R$</span>
                <Input
                  id="amount"
                  className="pl-10 text-lg font-semibold h-12"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(formatAmount(e.target.value))}
                />
              </div>
              <p className="text-xs text-muted-foreground">Mínimo: R$ 10,00 | Máximo: {formatBRL(saldoDisponivel)}</p>
            </div>

            {/* Tipo de chave PIX */}
            <div className="space-y-2">
              <Label>Tipo de Chave PIX</Label>
              <RadioGroup value={pixKeyType} onValueChange={setPixKeyType} className="grid grid-cols-2 gap-2">
                {[
                  { value: "cpf", label: "CPF" },
                  { value: "cnpj", label: "CNPJ" },
                  { value: "email", label: "E-mail" },
                  { value: "phone", label: "Telefone" },
                  { value: "random", label: "Aleatória" },
                ].map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value={opt.value} id={`pix-${opt.value}`} />
                    <Label htmlFor={`pix-${opt.value}`} className="cursor-pointer text-sm">{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Chave PIX */}
            <div className="space-y-2">
              <Label htmlFor="pixKey">Chave PIX</Label>
              <Input
                id="pixKey"
                placeholder={
                  pixKeyType === "cpf" ? "000.000.000-00" :
                  pixKeyType === "cnpj" ? "00.000.000/0000-00" :
                  pixKeyType === "email" ? "seu@email.com" :
                  pixKeyType === "phone" ? "+5511999999999" :
                  "Chave aleatória"
                }
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
              />
            </div>

            {/* Nome do titular (opcional, útil para chave aleatória) */}
            {pixKeyType === "random" && (
              <div className="space-y-2">
                <Label htmlFor="holderName">Nome do Titular (opcional)</Label>
                <Input
                  id="holderName"
                  placeholder="Nome completo"
                  value={pixHolderName}
                  onChange={(e) => setPixHolderName(e.target.value)}
                />
              </div>
            )}

            {/* Cidade (opcional) */}
            <div className="space-y-2">
              <Label htmlFor="city">Cidade (opcional)</Label>
              <Input
                id="city"
                placeholder="Sua cidade"
                value={pixCity}
                onChange={(e) => setPixCity(e.target.value)}
              />
            </div>

            <Button
              className="w-full h-12 text-base gap-2 bg-green-600 hover:bg-green-700"
              onClick={handleSolicitar}
              disabled={sending}
            >
              {sending ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Enviando...</>
              ) : (
                <><Banknote className="h-5 w-5" /> Solicitar Saque</>
              )}
            </Button>
          </>
        )}

        {/* Histórico de solicitações */}
        {pixRequests.length > 0 && (
          <div className="border-t pt-4 mt-2">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Histórico de Solicitações
            </h4>
            <div className="space-y-2">
              {pixRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-3 text-sm">
                  <div className="flex items-center gap-2">
                    {statusIcon(req.status)}
                    <div>
                      <p className="font-medium">{formatBRL(req.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(req.requested_at || req.created_at).toLocaleDateString("pt-BR")}
                        {" • "}
                        {statusLabelPix[req.status] || req.status}
                      </p>
                    </div>
                  </div>
                  <Badge variant={req.status === "completed" ? "default" : req.status === "rejected" ? "destructive" : "secondary"}>
                    {statusLabelPix[req.status] || req.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {loadingRequests && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        <DialogFooter className="text-xs text-muted-foreground text-center sm:text-center">
          Os saques são processados em até 48h úteis após aprovação.
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResumoSection({ summary, affiliateId, onPixSuccess }: { summary: AffiliateSummary; affiliateId?: string; onPixSuccess?: () => void }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800">
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Saldo Disponível</span>
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
            {formatBRL(summary.saldoDisponivel)}
          </p>
          {affiliateId && summary.saldoDisponivel >= 10 && (
            <div className="mt-3">
              <PixSaqueModal
                saldoDisponivel={summary.saldoDisponivel}
                affiliateId={affiliateId}
                onSuccess={onPixSuccess || (() => {})}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Saldo Pendente</span>
          </div>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
            {formatBRL(summary.saldoPendente)}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Total Recebido</span>
          </div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {formatBRL(summary.totalRecebido)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Indicações</span>
          </div>
          <p className="text-2xl font-bold">{summary.totalIndicacoes}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <UserPlus className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Vendas</span>
          </div>
          <p className="text-2xl font-bold">{summary.totalVendas}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Percent className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Conversão</span>
          </div>
          <p className="text-2xl font-bold">{summary.taxaConversao}%</p>
        </CardContent>
      </Card>
    </div>
  );
}

function MeuLinkSection({ affiliateLink }: { affiliateLink: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(affiliateLink);
      setCopied(true);
      toast({ title: "Link copiado!", description: "Link de afiliado copiado para a área de transferência." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Erro", description: "Não foi possível copiar o link.", variant: "destructive" });
    }
  };

  const compartilharWhatsApp = () => {
    const msg = encodeURIComponent(
      `🚀 *Meta Construtor* - Gestão de obras completa!\n\nUse meu link e ganhe benefícios:\n${affiliateLink}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const compartilharTelegram = () => {
    const msg = encodeURIComponent(
      `🚀 Meta Construtor - Gestão de obras completa!\n\nUse meu link e ganhe benefícios:\n${affiliateLink}`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(affiliateLink)}&text=${msg}`, "_blank");
  };

  const compartilharLinkedin = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(affiliateLink)}`,
      "_blank"
    );
  };

  const compartilharEmail = () => {
    const subject = encodeURIComponent("Conheça o Meta Construtor - Gestão de Obras");
    const body = encodeURIComponent(
      `Olá!\n\nEstou usando o Meta Construtor e recomendo!\n\nAcesse: ${affiliateLink}\n\nFerramenta completa para gestão de obras.`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ExternalLink className="h-5 w-5 text-primary" />
          Meu Link de Afiliado
        </CardTitle>
        <CardDescription>
          Compartilhe este link para indicar novos usuários e ganhar 40% de comissão.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* URL display */}
        <div className="flex items-center gap-2">
          <Input value={affiliateLink} readOnly className="font-mono text-sm bg-muted/50" />
          <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        {/* Share buttons */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">Compartilhar</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={compartilharWhatsApp}>
              <MessageCircle className="h-4 w-4 text-green-500" />
              WhatsApp
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={compartilharTelegram}>
              <Send className="h-4 w-4 text-blue-500" />
              Telegram
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={compartilharLinkedin}>
              <Linkedin className="h-4 w-4 text-blue-700" />
              LinkedIn
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={compartilharEmail}>
              <Mail className="h-4 w-4 text-muted-foreground" />
              E-mail
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleCopy}>
              <Share2 className="h-4 w-4" />
              Copiar Link
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function IndicacoesSection({ referrals }: { referrals: Referral[] }) {
  if (referrals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Indicações
          </CardTitle>
          <CardDescription>Histórico de usuários que você indicou para a plataforma.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Nenhuma indicação ainda</p>
            <p className="text-sm mt-1">Compartilhe seu link de afiliado para começar a ganhar comissões.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Indicações
        </CardTitle>
        <CardDescription>Histórico de usuários que você indicou para a plataforma.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-3 px-2 font-medium">Nome</th>
                <th className="text-left py-3 px-2 font-medium hidden md:table-cell">E-mail</th>
                <th className="text-left py-3 px-2 font-medium">Plano</th>
                <th className="text-left py-3 px-2 font-medium hidden sm:table-cell">Data</th>
                <th className="text-left py-3 px-2 font-medium">Status</th>
                <th className="text-right py-3 px-2 font-medium">Valor</th>
                <th className="text-right py-3 px-2 font-medium">Comissão</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((ref) => (
                <tr key={ref.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-2 font-medium">{ref.nome}</td>
                  <td className="py-3 px-2 text-muted-foreground hidden md:table-cell">{ref.email}</td>
                  <td className="py-3 px-2">{ref.plano}</td>
                  <td className="py-3 px-2 text-muted-foreground hidden sm:table-cell">{ref.data}</td>
                  <td className="py-3 px-2">
                    <Badge variant={statusVariant[ref.status]}>{statusLabel[ref.status]}</Badge>
                  </td>
                  <td className="py-3 px-2 text-right">{formatBRL(ref.valor)}</td>
                  <td className="py-3 px-2 text-right font-semibold text-green-600 dark:text-green-400">
                    {formatBRL(ref.comissao)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function ComissoesSection({ commissions }: { commissions: Commission[] }) {
  if (commissions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Comissões
          </CardTitle>
          <CardDescription>Histórico de comissões geradas pelas suas indicações.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Nenhuma comissão gerada ainda</p>
            <p className="text-sm mt-1">Quando suas indicações realizarem pagamentos, as comissões aparecerão aqui.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Comissões
        </CardTitle>
        <CardDescription>Histórico de comissões geradas pelas suas indicações.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-3 px-2 font-medium">Data</th>
                <th className="text-left py-3 px-2 font-medium">Cliente</th>
                <th className="text-left py-3 px-2 font-medium">Plano</th>
                <th className="text-right py-3 px-2 font-medium">Valor Pago</th>
                <th className="text-right py-3 px-2 font-medium">Comissão</th>
                <th className="text-left py-3 px-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((com) => (
                <tr key={com.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-2">{com.data}</td>
                  <td className="py-3 px-2 font-medium">{com.cliente}</td>
                  <td className="py-3 px-2">{com.plano}</td>
                  <td className="py-3 px-2 text-right">{formatBRL(com.valorPago)}</td>
                  <td className="py-3 px-2 text-right font-semibold text-green-600 dark:text-green-400">
                    {formatBRL(com.comissao)}
                  </td>
                  <td className="py-3 px-2">
                    <Badge variant={statusVariant[com.status]}>{statusLabel[com.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function GraficosSection({ chartData }: { chartData: ChartData }) {
  const [periodo, setPeriodo] = useState<"7d" | "30d" | "90d" | "12m">("30d");
  const periodos: { key: typeof periodo; label: string }[] = [
    { key: "7d", label: "7 dias" },
    { key: "30d", label: "30 dias" },
    { key: "90d", label: "90 dias" },
    { key: "12m", label: "12 meses" },
  ];

  const maxCommission = Math.max(...chartData.comissoes, 1);
  const maxClicks = Math.max(...chartData.cliques, 1);
  const maxCadastros = Math.max(...chartData.cadastros, 1);
  const maxConversoes = Math.max(...chartData.conversoes, 1);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Gráficos
            </CardTitle>
            <CardDescription>Visualize o desempenho do seu programa de afiliados.</CardDescription>
          </div>
          <div className="flex gap-1">
            {periodos.map((p) => (
              <Button
                key={p.key}
                variant={periodo === p.key ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriodo(p.key)}
                className="text-xs"
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Cliques */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Cliques</span>
            </div>
            <div className="flex items-end gap-1 h-24">
              {chartData.cliques.slice(0, periodo === "7d" ? 7 : periodo === "30d" ? 12 : 12).map((v, i) => (
                <div
                  key={i}
                  className="flex-1 bg-blue-500/60 dark:bg-blue-400/40 rounded-t transition-all hover:bg-blue-500/80"
                  style={{ height: `${(v / maxClicks) * 100}%`, minHeight: "4px" }}
                  title={`${v} cliques`}
                />
              ))}
            </div>
          </div>

          {/* Cadastros */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium">Cadastros</span>
            </div>
            <div className="flex items-end gap-1 h-24">
              {chartData.cadastros.slice(0, periodo === "7d" ? 7 : periodo === "30d" ? 12 : 12).map((v, i) => (
                <div
                  key={i}
                  className="flex-1 bg-emerald-500/60 dark:bg-emerald-400/40 rounded-t transition-all hover:bg-emerald-500/80"
                  style={{ height: `${(v / maxCadastros) * 100}%`, minHeight: "4px" }}
                  title={`${v} cadastros`}
                />
              ))}
            </div>
          </div>

          {/* Conversões */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-violet-500" />
              <span className="text-sm font-medium">Conversões</span>
            </div>
            <div className="flex items-end gap-1 h-24">
              {chartData.conversoes.slice(0, periodo === "7d" ? 7 : periodo === "30d" ? 12 : 12).map((v, i) => (
                <div
                  key={i}
                  className="flex-1 bg-violet-500/60 dark:bg-violet-400/40 rounded-t transition-all hover:bg-violet-500/80"
                  style={{ height: `${(v / maxConversoes) * 100}%`, minHeight: "4px" }}
                  title={`${v} conversões`}
                />
              ))}
            </div>
          </div>

          {/* Comissões */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Comissões</span>
            </div>
            <div className="flex items-end gap-1 h-24">
              {chartData.comissoes.slice(0, periodo === "7d" ? 7 : periodo === "30d" ? 12 : 12).map((v, i) => (
                <div
                  key={i}
                  className="flex-1 bg-amber-500/60 dark:bg-amber-400/40 rounded-t transition-all hover:bg-amber-500/80"
                  style={{ height: `${(v / maxCommission) * 100}%`, minHeight: "4px" }}
                  title={`${formatBRL(v)}`}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Componente Principal ────────────────────────────

export function AffiliateCard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);
  const [affiliateId, setAffiliateId] = useState<string | null>(null);
  const [summary, setSummary] = useState<AffiliateSummary>({
    saldoDisponivel: 0,
    saldoPendente: 0,
    totalRecebido: 0,
    totalIndicacoes: 0,
    totalVendas: 0,
    taxaConversao: 0,
  });
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [chartData, setChartData] = useState<ChartData>({
    cliques: [],
    cadastros: [],
    conversoes: [],
    comissoes: [],
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAffiliateData();
  }, [user]);

  const loadAffiliateData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Carregar perfil de afiliado
      const { data: profile, error: profileErr } = await supabase
        .from("affiliate_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileErr) throw profileErr;

      if (!profile) {
        setLoading(false);
        return;
      }

      setAffiliateCode(profile.affiliate_code);
      setAffiliateId(profile.id);

      // 2. Carregar indicações
      const { data: refs, error: refsErr } = await supabase
        .from("affiliate_referrals")
        .select("*")
        .eq("affiliate_id", profile.id)
        .order("created_at", { ascending: false });

      if (refsErr) throw refsErr;

      const referralList: Referral[] = (refs || []).map((r: any) => ({
        id: r.id,
        nome: r.referred_email?.split("@")[0] || "Usuário",
        email: r.referred_email || "",
        plano: "",
        data: new Date(r.created_at).toLocaleDateString("pt-BR"),
        status: r.status as Referral["status"],
        valor: 0,
        comissao: 0,
      }));

      setReferrals(referralList);

      // 3. Carregar comissões
      const { data: comms, error: commsErr } = await supabase
        .from("affiliate_commissions")
        .select("*")
        .eq("affiliate_id", profile.id)
        .order("created_at", { ascending: false });

      if (commsErr) throw commsErr;

      const commissionList: Commission[] = (comms || []).map((c: any) => ({
        id: c.id,
        data: new Date(c.created_at).toLocaleDateString("pt-BR"),
        cliente: "Indicado",
        plano: "",
        valorPago: c.gross_amount || c.net_amount || 0,
        comissao: c.amount || 0,
        status: c.status as Commission["status"],
      }));

      setCommissions(commissionList);

      // 4. Calcular resumo
      const totalIndicacoes = refs?.length || 0;
      const vendas = (comms || []).filter((c: any) =>
        ["approved", "paid"].includes(c.status)
      ).length;

      const saldoDisponivel = (comms || [])
        .filter((c: any) => c.status === "paid")
        .reduce((sum: number, c: any) => sum + (c.amount || 0), 0);

      const saldoPendente = (comms || [])
        .filter((c: any) => c.status === "approved")
        .reduce((sum: number, c: any) => sum + (c.amount || 0), 0);

      const totalRecebido = (comms || [])
        .filter((c: any) => ["approved", "paid"].includes(c.status))
        .reduce((sum: number, c: any) => sum + (c.amount || 0), 0);

      setSummary({
        saldoDisponivel,
        saldoPendente,
        totalRecebido,
        totalIndicacoes,
        totalVendas: vendas,
        taxaConversao: totalIndicacoes > 0
          ? Math.round((vendas / totalIndicacoes) * 100)
          : 0,
      });

      // 5. Montar dados para gráficos (agregação mensal dos últimos 12 meses)
      const hoje = new Date();
      const meses = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(hoje);
        d.setMonth(d.getMonth() - (11 - i));
        return d;
      });

      const cliquesChart: number[] = [];
      const cadastrosChart: number[] = [];
      const conversoesChart: number[] = [];
      const comissoesChart: number[] = [];

      for (const mes of meses) {
        const mesInicio = new Date(mes.getFullYear(), mes.getMonth(), 1);
        const mesFim = new Date(mes.getFullYear(), mes.getMonth() + 1, 1);

        cliquesChart.push(profile.total_clicks);

        const referralsNoMes = (refs || []).filter((r: any) => {
          const d = new Date(r.created_at);
          return d >= mesInicio && d < mesFim;
        }).length;
        cadastrosChart.push(referralsNoMes);

        const comissoesNoMes = (comms || []).filter((c: any) => {
          const d = new Date(c.created_at);
          return d >= mesInicio && d < mesFim;
        });
        const convertidas = comissoesNoMes.filter((c: any) =>
          ["approved", "paid"].includes(c.status)
        ).length;
        conversoesChart.push(convertidas);

        comissoesChart.push(
          comissoesNoMes
            .filter((c: any) => ["approved", "paid"].includes(c.status))
            .reduce((sum: number, c: any) => sum + (c.amount || 0), 0)
        );
      }

      setChartData({
        cliques: cliquesChart,
        cadastros: cadastrosChart,
        conversoes: conversoesChart,
        comissoes: comissoesChart,
      });

    } catch (err: any) {
      console.error("Erro ao carregar dados de afiliado:", err);
      setError(err?.message || "Erro ao carregar dados de afiliado");
    } finally {
      setLoading(false);
    }
  };

  const affiliateLink = affiliateCode
    ? `https://metaconstrutor.app.br?ref=${affiliateCode}`
    : "";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!affiliateCode) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="font-medium">Programa de Afiliados</p>
        <p className="text-sm mt-1">Seu perfil de afiliado será ativado automaticamente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto md:mx-0">
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-4 text-sm">
          {error}
        </div>
      )}

      {/* Seção 01: Resumo */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Resumo do Programa
          </h2>
          <Button variant="outline" size="sm" onClick={loadAffiliateData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
        <ResumoSection summary={summary} affiliateId={affiliateId || undefined} onPixSuccess={loadAffiliateData} />
      </div>

      {/* Seção 02: Meu Link */}
      {affiliateLink && <MeuLinkSection affiliateLink={affiliateLink} />}

      {/* Sub-tabs: Indicações, Comissões, Gráficos */}
      <Tabs defaultValue="indicacoes" className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-auto p-1 bg-muted/50 rounded-xl max-w-md">
          <TabsTrigger value="indicacoes" className="gap-2 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Indicações</span>
            <span className="sm:hidden">Indic.</span>
          </TabsTrigger>
          <TabsTrigger value="comissoes" className="gap-2 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Comissões</span>
            <span className="sm:hidden">Comiss.</span>
          </TabsTrigger>
          <TabsTrigger value="graficos" className="gap-2 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Gráficos</span>
            <span className="sm:hidden">Gráf.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="indicacoes" className="mt-6 animate-in fade-in slide-in-from-left-4 duration-300">
          <IndicacoesSection referrals={referrals} />
        </TabsContent>

        <TabsContent value="comissoes" className="mt-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <ComissoesSection commissions={commissions} />
        </TabsContent>

        <TabsContent value="graficos" className="mt-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <GraficosSection chartData={chartData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
