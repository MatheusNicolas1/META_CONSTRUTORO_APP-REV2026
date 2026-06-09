/**
 * RDONovoPage.tsx — v3
 * Página full-screen para criação de RDOs.
 * Layout: 2 colunas em desktop (xl+), coluna única em mobile.
 * As seções filhas já têm seu próprio Card — não encapsulamos aqui.
 */
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { NavigationSafety } from "@/utils/navigationSafety";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCredits } from "@/hooks/useCredits";
import {
    ArrowLeft,
    Send,
    FileText,
    Users,
    Wrench,
    AlertTriangle,
    MessageSquare,
    Paperclip,
    CheckCircle2,
    Loader2,
    Building2,
    CloudSun,
    CalendarDays,
    Timer,
    ChevronRight,
} from "lucide-react";
import { rdoSchema, RDOFormData } from "@/schemas/rdoSchema";
import { RDOFormHeader } from "@/components/rdo/RDOFormHeader";
import { RDOWorkPeriodSection } from "@/components/rdo/RDOWorkPeriodSection";
import { RDOTeamSection } from "@/components/rdo/RDOTeamSection";
import { RDOActivitiesSection } from "@/components/rdo/RDOActivitiesSection";
import { RDOEquipmentSection } from "@/components/rdo/RDOEquipmentSection";
import { RDOIssuesSection } from "@/components/rdo/RDOIssuesSection";
import { RDOObservationsSection } from "@/components/rdo/RDOObservationsSection";
import { RDOAttachmentsSection } from "@/components/rdo/RDOAttachmentsSection";
import { useRDOs } from "@/hooks/useRDOs";
import { useObras } from "@/hooks/useObras";
import { toast } from "sonner";

const RDONovoPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const preselectedObraId = location.state?.selectedObraId || "";
    const { obras } = useObras();
    const { createRDO } = useRDOs();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { isFreePlan, hasCredits, balance } = useCredits();

    const form = useForm<RDOFormData>({
        resolver: zodResolver(rdoSchema),
        mode: "onSubmit",
        defaultValues: {
            data: new Date().toISOString().split("T")[0],
            obraId: preselectedObraId,
            periodo: "Manhã",
            clima: "",
            equipeOciosa: false,
            tempoOcioso: 0,
            atividadesRealizadas: [],
            atividadesExtras: [],
            equipesPresentes: [],
            equipamentosUtilizados: [],
            equipamentosQuebrados: [],
            acidentes: [],
            materiaisFalta: [],
            estoqueMateriais: [],
            observacoes: "",
        },
    });

    const watched = form.watch();

    const sections = [
        { label: "Informações Básicas", filled: !!(watched.obraId && watched.data && watched.clima) },
        { label: "Período", filled: true },
        { label: "Equipes", filled: (watched.equipesPresentes?.length ?? 0) > 0 },
        { label: "Atividades", filled: (watched.atividadesRealizadas?.length ?? 0) > 0 },
        { label: "Equipamentos", filled: (watched.equipamentosUtilizados?.length ?? 0) > 0 },
        { label: "Problemas", filled: (watched.equipamentosQuebrados?.length ?? 0) > 0 || (watched.acidentes?.length ?? 0) > 0 },
        { label: "Observações", filled: !!(watched.observacoes && watched.observacoes.length > 3) },
        { label: "Anexos", filled: (watched.files?.length ?? 0) > 0 },
    ];

    const filledCount = sections.filter(s => s.filled).length;
    const progress = Math.round((filledCount / sections.length) * 100);
    const obraSelecionada = (obras as any[]).find(o => o.id === watched.obraId);

    const climaEmoji: Record<string, string> = {
        "Ensolarado": "☀️",
        "Parcialmente Nublado": "⛅",
        "Nublado": "☁️",
        "Chuvoso": "🌧️",
        "Tempestade": "⛈️",
    };

    const handleSubmit = async (data: RDOFormData) => {
        // Verificação explícita de campos obrigatórios antes de enviar
        if (!data.obraId) {
            toast.error("Selecione a obra antes de salvar.");
            return;
        }
        if (!data.clima) {
            toast.error("Selecione o clima antes de salvar.");
            return;
        }

        setIsSubmitting(true);
        try {
            await createRDO.mutateAsync({
                data: data.data,
                obraId: data.obraId,
                periodo: data.periodo,
                clima: data.clima,
                equipeOciosa: data.equipeOciosa,
                tempoOcioso: data.equipeOciosa ? data.tempoOcioso : undefined,
                atividadesRealizadas: data.atividadesRealizadas as any,
                atividadesExtras: data.atividadesExtras as any,
                equipesPresentes: data.equipesPresentes as any,
                equipamentosUtilizados: data.equipamentosUtilizados as any,
                equipamentosQuebrados: data.equipamentosQuebrados as any,
                acidentes: data.acidentes as any,
                materiaisFalta: data.materiaisFalta as any,
                estoqueMateriais: data.estoqueMateriais as any,
                observacoes: data.observacoes,
                files: data.files,
            });
            // onSuccess do hook já mostra toast.success
            NavigationSafety.safeNavigate(navigate, "/app/rdo");
        } catch (err: any) {
            // onError do hook já mostra toast.error — mas garantimos fallback aqui
            console.error("[RDONovoPage] Erro ao salvar:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const onInvalid = (errors: any) => {
        console.error("[RDONovoPage] Validação falhou:", errors);
        const firstError = Object.values(errors)[0] as any;
        if (firstError?.message) {
            toast.error("Formulário inválido: " + firstError.message);
        } else {
            toast.error("Preencha todos os campos obrigatórios antes de salvar.");
        }
    };

    return (
        <div className="bg-background">
            {/* ─── Top bar ─── */}
            <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
                <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-14 flex items-center gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/app/rdo")}
                        className="text-muted-foreground hover:text-foreground gap-1.5 px-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Voltar</span>
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium truncate">Novo Relatório Diário de Obra</span>

                    {/* Progresso */}
                    <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground hidden md:inline">
                            {filledCount}/{sections.length}
                        </span>
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden hidden sm:block">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
                {/* Page title */}
                <div className="mb-5">
                    <h1 className="text-xl md:text-2xl font-bold text-foreground">Novo Relatório Diário de Obra</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Campos marcados com <span className="text-destructive">*</span> são obrigatórios
                    </p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit, onInvalid)} noValidate>
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

                            {/* ─── LEFT COLUMN ─── */}
                            <div className="space-y-4 min-w-0">

                                {/* 1 — Informações Básicas (seção já tem Card interno) */}
                                <SectionHeader n={1} label="Informações Básicas" icon={<CalendarDays className="h-4 w-4" />} filled={sections[0].filled} />
                                <RDOFormHeader form={form} />

                                {/* 2 — Período de Trabalho */}
                                <SectionHeader n={2} label="Período de Trabalho" icon={<Timer className="h-4 w-4" />} filled={sections[1].filled} />
                                <RDOWorkPeriodSection form={form} />

                                {/* 3 — Equipes Presentes */}
                                <SectionHeader n={3} label="Equipes Presentes" icon={<Users className="h-4 w-4" />} filled={sections[2].filled} />
                                <RDOTeamSection form={form} />

                                {/* 4 — Atividades Realizadas */}
                                <SectionHeader n={4} label="Atividades Realizadas" icon={<FileText className="h-4 w-4" />} filled={sections[3].filled} />
                                <RDOActivitiesSection form={form} />

                                {/* 5 — Equipamentos */}
                                <SectionHeader n={5} label="Equipamentos" icon={<Wrench className="h-4 w-4" />} filled={sections[4].filled} />
                                <RDOEquipmentSection form={form} />

                                {/* 6 — Problemas & Ocorrências */}
                                <SectionHeader n={6} label="Problemas & Ocorrências" icon={<AlertTriangle className="h-4 w-4" />} filled={sections[5].filled} />
                                <RDOIssuesSection form={form} />

                                {/* 7 — Observações */}
                                <SectionHeader n={7} label="Observações Gerais" icon={<MessageSquare className="h-4 w-4" />} filled={sections[6].filled} />
                                <RDOObservationsSection form={form} />

                                {/* 8 — Anexos */}
                                <SectionHeader n={8} label="Anexos" icon={<Paperclip className="h-4 w-4" />} filled={sections[7].filled} />
                                <RDOAttachmentsSection form={form} />

                                {/* Botões mobile/tablet — visível abaixo de lg */}
                                <div className="lg:hidden pt-2 pb-10 flex flex-col gap-3">
                                    {isFreePlan && !hasCredits && (
                                        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center">
                                            <AlertTriangle className="h-4 w-4 text-destructive mx-auto mb-1" />
                                            <p className="text-xs font-medium text-destructive">Seus créditos de RDO acabaram</p>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">Faça upgrade para criar RDOs ilimitados</p>
                                        </div>
                                    )}
                                    {isFreePlan && hasCredits && (
                                        <p className="text-center text-xs text-muted-foreground">
                                            <span className={balance <= 2 ? "text-yellow-600 font-medium" : ""}>
                                                {balance} crédito{balance !== 1 ? 's' : ''} restante{balance !== 1 ? 's' : ''}
                                            </span>
                                        </p>
                                    )}
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting || (isFreePlan && !hasCredits)}
                                        className="gradient-construction border-0 hover:opacity-90 h-12 font-semibold text-base"
                                    >
                                        {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                                        {isSubmitting ? "Salvando..." : (isFreePlan && !hasCredits) ? "Sem créditos" : "Finalizar e Enviar RDO"}
                                    </Button>
                                    <Button type="button" variant="outline" className="h-11" onClick={() => navigate("/app/rdo")}>
                                        Cancelar
                                    </Button>
                                </div>
                            </div>

                            {/* ─── RIGHT COLUMN — Painel Sticky ─── */}
                            <div className="hidden lg:block">
                                <div className="sticky top-[72px] space-y-3">

                                    {/* Card de resumo */}
                                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                                        <div className="bg-primary/5 border-b border-border px-4 py-3 flex items-center justify-between">
                                            <span className="text-sm font-semibold">Resumo do RDO</span>
                                            <Badge variant="outline" className="text-[11px] text-amber-500 border-amber-500/40 py-0">
                                                Rascunho
                                            </Badge>
                                        </div>

                                        <div className="p-4 space-y-4">
                                            {/* Dados básicos */}
                                            <div className="space-y-3">
                                                <InfoRow icon={<Building2 className="h-3.5 w-3.5 flex-shrink-0" />} label="Obra">
                                                    {obraSelecionada?.nome ?? <em className="text-muted-foreground not-italic text-xs">Não selecionada</em>}
                                                </InfoRow>
                                                <InfoRow icon={<CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />} label="Data · Período">
                                                    {watched.data ? new Date(watched.data + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                                                    {watched.periodo && <span className="text-muted-foreground"> · {watched.periodo}</span>}
                                                </InfoRow>
                                                <InfoRow icon={<CloudSun className="h-3.5 w-3.5 flex-shrink-0" />} label="Clima">
                                                    {watched.clima
                                                        ? <>{climaEmoji[watched.clima] ?? "🌤"} {watched.clima}</>
                                                        : <em className="text-muted-foreground not-italic text-xs">Não informado</em>}
                                                </InfoRow>
                                            </div>

                                            <Separator />

                                            {/* Contadores 2×2 */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <Counter label="Equipes" value={watched.equipesPresentes?.length ?? 0} />
                                                <Counter label="Atividades" value={(watched.atividadesRealizadas?.length ?? 0) + (watched.atividadesExtras?.length ?? 0)} />
                                                <Counter label="Equipamentos" value={watched.equipamentosUtilizados?.length ?? 0} />
                                                <Counter
                                                    label="Ocorrências"
                                                    value={(watched.equipamentosQuebrados?.length ?? 0) + (watched.acidentes?.length ?? 0)}
                                                    alert
                                                />
                                            </div>

                                            <Separator />

                                            {/* Progresso por seção */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-muted-foreground">Preenchimento</span>
                                                    <span className="font-medium">{progress}%</span>
                                                </div>
                                                <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                                                    <div
                                                        className="h-full bg-primary rounded-full transition-all duration-500"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    {sections.map(s => (
                                                        <div key={s.label} className="flex items-center gap-2 text-xs">
                                                            {s.filled
                                                                ? <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                                                                : <div className="h-3 w-3 rounded-full border border-border flex-shrink-0" />}
                                                            <span className={s.filled ? "text-foreground" : "text-muted-foreground"}>
                                                                {s.label}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <Separator />

                                            {/* Ações */}
                                            <div className="space-y-2">
                                                {/* Alerta de créditos */}
                                                {isFreePlan && !hasCredits && (
                                                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center">
                                                        <AlertTriangle className="h-4 w-4 text-destructive mx-auto mb-1" />
                                                        <p className="text-xs font-medium text-destructive">Seus créditos de RDO acabaram</p>
                                                        <p className="text-[11px] text-muted-foreground mt-0.5">Faça upgrade para criar RDOs ilimitados</p>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="mt-2 h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                                                            onClick={() => navigate("/app/perfil?tab=assinatura")}
                                                        >
                                                            Ver planos
                                                        </Button>
                                                    </div>
                                                )}
                                                {isFreePlan && hasCredits && (
                                                    <p className="text-center text-xs text-muted-foreground">
                                                        <span className={balance <= 2 ? "text-yellow-600 font-medium" : ""}>
                                                            {balance} crédito{balance !== 1 ? 's' : ''} restante{balance !== 1 ? 's' : ''}
                                                        </span>
                                                    </p>
                                                )}
                                                <Button
                                                    type="submit"
                                                    disabled={isSubmitting || (isFreePlan && !hasCredits)}
                                                    className="w-full gradient-construction border-0 hover:opacity-90 h-10 font-semibold"
                                                >
                                                    {isSubmitting
                                                        ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        : <Send className="h-4 w-4 mr-2" />}
                                                    {isSubmitting ? "Salvando..." : (isFreePlan && !hasCredits) ? "Sem créditos" : "Finalizar RDO"}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="w-full h-9 text-sm"
                                                    onClick={() => navigate("/app/rdo")}
                                                    disabled={isSubmitting}
                                                >
                                                    Cancelar
                                                </Button>
                                            </div>

                                            <p className="text-center text-xs text-muted-foreground">
                                                Será salvo como{" "}
                                                <span className="text-amber-500 font-medium">Em elaboração</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
};

/* ─── Sub-componentes ─── */

/** Label de numeração de seção sem adicionar card (seções filhas já têm card) */
const SectionHeader = ({
    n, label, icon, filled
}: {
    n: number;
    label: string;
    icon: React.ReactNode;
    filled: boolean;
}) => (
    <div className="flex items-center gap-2.5 px-1 pt-2">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0
      ${filled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {filled ? <CheckCircle2 className="h-3.5 w-3.5" /> : n}
        </div>
        <span className={`text-muted-foreground flex-shrink-0 flex items-center [&>svg]:h-4 [&>svg]:w-4`}>{icon}</span>
        <span className="text-sm font-semibold text-foreground">{label}</span>
        {filled && (
            <span className="text-[11px] text-green-600 font-medium ml-1">✓ Preenchido</span>
        )}
    </div>
);

const InfoRow = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
    <div className="flex items-start gap-2">
        <span className="text-muted-foreground mt-0.5">{icon}</span>
        <div className="min-w-0 flex-1">
            <p className="text-[11px] text-muted-foreground leading-none mb-0.5">{label}</p>
            <p className="text-sm font-medium text-card-foreground leading-tight">{children}</p>
        </div>
    </div>
);

const Counter = ({
    label, value, alert = false
}: {
    label: string; value: number; alert?: boolean;
}) => {
    const isAlert = alert && value > 0;
    return (
        <div className={`rounded-lg p-2.5 border text-center transition-colors
      ${isAlert ? "border-destructive/30 bg-destructive/5" : "border-border bg-muted/20"}`}>
            <p className={`text-[11px] mb-0.5 ${isAlert ? "text-destructive" : "text-muted-foreground"}`}>{label}</p>
            <p className={`text-xl font-bold leading-none ${isAlert ? "text-destructive" : "text-foreground"}`}>{value}</p>
        </div>
    );
};

export default RDONovoPage;
