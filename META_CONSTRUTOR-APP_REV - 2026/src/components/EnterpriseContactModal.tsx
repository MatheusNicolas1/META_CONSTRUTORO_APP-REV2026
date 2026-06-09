import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, X, Check, Sparkles, Mail, Phone,
  User, Send, ArrowRight, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface EnterpriseContactModalProps {
  open: boolean;
  onClose: () => void;
}

const enterpriseFeatures = [
  "Tudo do plano Master",
  "White label (sua marca)",
  "Single Sign-On (SSO)",
  "SLA garantido 99.9%",
  "Treinamento dedicado da equipe",
  "On-premise disponível",
  "Contrato personalizado",
];

const EnterpriseContactModal = ({ open, onClose }: EnterpriseContactModalProps) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      // Enviar para Edge Function de contato (ou fallback para email)
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "enterprise_contact",
          name: form.name,
          email: form.email,
          phone: form.phone,
          company: form.company,
          message: form.message,
        }),
      });

      if (!res.ok) throw new Error("Erro ao enviar");

      toast.success("Recebemos seu contato! Entraremos em contato em até 24h úteis.");
      setForm({ name: "", email: "", phone: "", company: "", message: "" });
      onClose();
    } catch (err) {
      toast.error("Erro ao enviar. Tente novamente ou mande email para contato@metaconstrutor.app.br");
    } finally {
      setSending(false);
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors z-10"
            >
              <X className="w-4 h-4 text-neutral-500" />
            </button>

            <div className="grid md:grid-cols-2 divide-x divide-neutral-100">
              {/* Left: Features */}
              <div className="p-6 md:p-8 bg-gradient-to-br from-brand-orange-ghost via-white to-white">
                <div className="w-12 h-12 bg-brand-orange rounded-2xl flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6 text-white" />
                </div>

                <h2 className="text-2xl font-extrabold text-neutral-900 mb-1">
                  Plano Enterprise
                </h2>
                <p className="text-sm text-neutral-500 mb-2">
                  Para grandes operações com necessidades específicas.
                </p>
                <p className="text-lg font-bold text-brand-orange mb-6">
                  Sob consulta
                </p>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-orange" />
                    Incluso no plano:
                  </h3>
                  <ul className="space-y-2">
                    {enterpriseFeatures.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-700">
                        <Check className="w-4 h-4 text-brand-emerald mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                  <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                    <Shield className="w-4 h-4 text-brand-orange" />
                    <span className="font-medium">Perfeito para:</span>
                  </div>
                  <ul className="space-y-1 text-xs text-neutral-500">
                    <li>• Incorporadoras com múltiplos empreendimentos</li>
                    <li>• Construtoras que precisam de white label</li>
                    <li>• Empresas que exigem SSO e SLA contratual</li>
                    <li>• Operações que demandam on-premise</li>
                  </ul>
                </div>
              </div>

              {/* Right: Form */}
              <div className="p-6 md:p-8">
                <h3 className="text-lg font-bold text-neutral-900 mb-1">
                  Solicitar orçamento
                </h3>
                <p className="text-sm text-neutral-500 mb-6">
                  Preencha seus dados. Analisamos sua demanda e retornamos com uma proposta personalizada.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="enterprise-name" className="text-xs font-medium">
                      Nome completo
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <Input
                        id="enterprise-name"
                        value={form.name}
                        onChange={handleChange("name")}
                        placeholder="Seu nome"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="enterprise-email" className="text-xs font-medium">
                      E-mail profissional
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <Input
                        id="enterprise-email"
                        type="email"
                        value={form.email}
                        onChange={handleChange("email")}
                        placeholder="seu@email.com"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="enterprise-phone" className="text-xs font-medium">
                      Telefone / WhatsApp
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <Input
                        id="enterprise-phone"
                        type="tel"
                        value={form.phone}
                        onChange={handleChange("phone")}
                        placeholder="(11) 99999-9999"
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="enterprise-company" className="text-xs font-medium">
                      Empresa / Construtora
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <Input
                        id="enterprise-company"
                        value={form.company}
                        onChange={handleChange("company")}
                        placeholder="Nome da construtora"
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="enterprise-message" className="text-xs font-medium">
                      Como podemos ajudar?
                    </Label>
                    <Textarea
                      id="enterprise-message"
                      rows={3}
                      value={form.message}
                      onChange={handleChange("message")}
                      placeholder="Conte um pouco sobre sua operação e necessidades..."
                      className="resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-brand-orange hover:bg-brand-orange-hover rounded-full gap-2"
                    disabled={sending}
                  >
                    {sending ? (
                      "Enviando..."
                    ) : (
                      <>
                        Solicitar proposta
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </Button>

                  <p className="text-[10px] text-center text-neutral-400">
                    Ao enviar, você concorda com nossa Política de Privacidade.
                    Retornamos em até 24h úteis.
                  </p>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EnterpriseContactModal;
