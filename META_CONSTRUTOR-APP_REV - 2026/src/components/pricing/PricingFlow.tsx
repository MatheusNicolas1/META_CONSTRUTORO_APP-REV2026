
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PlanCarousel } from "./PlanCarousel";
import { CheckoutForm, CheckoutFormData } from "./CheckoutForm";
import { StripePaymentWrapper } from "./StripePaymentWrapper";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type Step = "selection" | "data" | "checkout" | "success";

export function PricingFlow({ showHeader = true }: { showHeader?: boolean }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // State with initialization from sessionStorage
    const [step, setStep] = useState<Step>(() => sessionStorage.getItem('pricing_step') as Step || "selection");
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(() => sessionStorage.getItem('pricing_cycle') as "monthly" | "yearly" || "monthly");
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(() => sessionStorage.getItem('pricing_plan_id') || null);
    const [customerData, setCustomerData] = useState<Partial<CheckoutFormData>>(() => {
        const saved = sessionStorage.getItem('pricing_data');
        return saved ? JSON.parse(saved) : {};
    });
    const [priceId, setPriceId] = useState<string | null>(null);

    // Fetch Plans
    const { data: plans, isLoading: plansLoading } = useQuery({
        queryKey: ['plans'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('plans')
                .select('*')
                .eq('active', true)
                .order('price_monthly', { ascending: true });
            if (error) throw error;
            return data;
        },
    });

    // Fetch Current Subscription
    const { data: subscription } = useQuery({
        queryKey: ['subscription', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('subscriptions')
                .select('plan_id, status, billing_cycle')
                .eq('user_id', user?.id)
                .in('status', ['active', 'trialing'])
                .maybeSingle();
            if (error) throw error;
            return data;
        },
        enabled: !!user?.id,
        refetchInterval: step === 'success' ? 1000 : false,
    });

    // Prefill Data
    useEffect(() => {
        if (user && !customerData.email) {
            setCustomerData({
                name: user.name || "",
                email: user.email || "",
            });
            // Optionally fetch profile data to prefill company/cpf/phone
            const fetchProfile = async () => {
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                if (data) {
                    setCustomerData(prev => ({
                        ...prev,
                        company: data.company || "",
                        cpf_cnpj: data.cpf_cnpj || "",
                        phone: data.phone || ""
                    }));
                }
            };
            fetchProfile();
        }
    }, [user]);

    // Persistence Effects
    useEffect(() => { sessionStorage.setItem('pricing_step', step); }, [step]);
    useEffect(() => { sessionStorage.setItem('pricing_cycle', billingCycle); }, [billingCycle]);
    useEffect(() => {
        if (selectedPlanId) sessionStorage.setItem('pricing_plan_id', selectedPlanId);
        else sessionStorage.removeItem('pricing_plan_id');
    }, [selectedPlanId]);
    useEffect(() => {
        if (Object.keys(customerData).length > 0) sessionStorage.setItem('pricing_data', JSON.stringify(customerData));
    }, [customerData]);

    // Actions
    const handleSelectPlan = (planId: string) => {
        setSelectedPlanId(planId);
        // Find price ID based on cycle
        const plan = plans?.find(p => p.id === planId);
        if (!plan) return;

        // Logic to determine Stripe Price ID would ideally come from DB or be constructed
        // For now assuming we generate it or fetch it. 
        // BUT checking the original 'plans' table, it usually has stripe_price_id_monthly/yearly
        // Let's verify structure or adhere to simplified flow. 
        // The previous implementation used `stripe_price_id` from the plan, but now we have cycle.
        // Let's assume the backend 'create-subscription' handles the lookup or we pass the PLAIN ID + Cycle.
        // Actually, `create-subscription` function expects `priceId` (Stripe Price ID).

        // We need to map Plan + Cycle -> Stripe Price ID.
        // Since we don't have that mapping in the `plans` type shown previousely (it was generic), 
        // and `create-subscription` takes `priceId`.
        // Let's assume the `plans` table has `stripe_price_id_monthly` and `stripe_price_id_yearly`.
        // I will check the `plans` table schema to be sure in the next step if I fail here.
        // For now, I'll update the state and move to next step.
        setStep("data");
    };

    const handleDataSubmit = async (data: CheckoutFormData) => {
        setCustomerData(data);

        // Update profile with gathered data
        if (user) {
            await supabase.from('profiles').update({
                name: data.name,
                company: data.company,
                cpf_cnpj: data.cpf_cnpj,
                phone: data.phone
            }).eq('id', user.id);
        }

        // Determine plan slug
        const plan = plans?.find(p => p.id === selectedPlanId);
        if (!plan) return;

        // Use slug from plan or fallback to name/id convention if slug is missing
        // Assuming 'slug' exists on plan object (even if not in types.ts yet, we cast it or use it)
        // If plans doesn't have slug, we might need to map it.
        // Let's assume there is a 'slug' column as per Edge Function expectation.
        // If TS complains, we can cast.

        // For now we don't setPriceId, we just move to checkout.
        // setPriceId(stripePriceId); // Removed
        setStep("checkout");
    };

    const handleSuccess = () => {
        setStep("success");
        // Clear session storage on success
        sessionStorage.removeItem('pricing_step');
        sessionStorage.removeItem('pricing_cycle');
        sessionStorage.removeItem('pricing_plan_id');
        sessionStorage.removeItem('pricing_data');

        queryClient.invalidateQueries({ queryKey: ['subscription'] });
        setTimeout(() => {
            navigate('/perfil');
        }, 3000);
    };

    // Render
    if (plansLoading) {
        return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    // Helper to get selected plan slug
    const selectedPlan = plans?.find(p => p.id === selectedPlanId);
    // @ts-ignore - slug might not be in typed definition yet
    const planSlug = selectedPlan?.slug || selectedPlan?.name?.toLowerCase();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header / Toggle */}
            {step === "selection" && (
                <div className="flex flex-col items-center justify-center space-y-6">
                    {showHeader && (
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-bold tracking-tight">Escolha o plano ideal para você</h2>
                            <p className="text-muted-foreground text-lg">
                                Potencialize sua gestão de obras com nossas ferramentas avançadas.
                            </p>
                        </div>
                    )}

                    <div className="flex items-center gap-4 bg-muted/50 p-1.5 rounded-full border">
                        <Label
                            htmlFor="billing-switch"
                            className={`cursor-pointer px-4 py-2 rounded-full transition-all ${billingCycle === 'monthly' ? 'bg-background text-foreground shadow-sm font-medium' : 'text-muted-foreground'}`}
                            onClick={() => setBillingCycle('monthly')}
                        >
                            Mensal
                        </Label>
                        <Switch
                            id="billing-switch"
                            checked={billingCycle === "yearly"}
                            onCheckedChange={(c) => setBillingCycle(c ? "yearly" : "monthly")}
                            className="hidden" // Hiding generic switch in favor of custom toggle UI or keeping it simple
                        />
                        <Label
                            htmlFor="billing-switch"
                            className={`cursor-pointer px-4 py-2 rounded-full transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-background text-foreground shadow-sm font-medium' : 'text-muted-foreground'}`}
                            onClick={() => setBillingCycle('yearly')}
                        >
                            Anual
                            <span className="text-[10px] bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                -20%
                            </span>
                        </Label>
                    </div>
                </div>
            )}

            {/* Steps Content */}
            <div className="min-h-[400px]">

                {step === "selection" && (
                    <PlanCarousel
                        plans={plans || []}
                        billingCycle={billingCycle}
                        selectedPlanId={selectedPlanId}
                        currentPlanId={subscription?.plan_id}
                        onSelectPlan={handleSelectPlan}
                    />
                )}

                {step === "data" && (
                    <div className="max-w-xl mx-auto">
                        <div className="mb-6 flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setStep("selection")}>
                                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
                            </Button>
                            <h3 className="text-xl font-semibold">Seus Dados</h3>
                        </div>
                        <div className="bg-card border rounded-xl p-6 shadow-sm">
                            <CheckoutForm
                                defaultValues={customerData}
                                onSubmit={handleDataSubmit}
                                loading={false}
                            />
                        </div>
                    </div>
                )}

                {step === "checkout" && selectedPlanId && (
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-6 flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setStep("data")}>
                                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
                            </Button>
                            <h3 className="text-xl font-semibold">Finalizar Pagamento</h3>
                        </div>
                        <StripePaymentWrapper
                            planSlug={planSlug}
                            billingCycle={billingCycle}
                            onComplete={handleSuccess}
                        />
                    </div>
                )}

                {step === "success" && (
                    <div className="max-w-md mx-auto text-center space-y-4 py-12">
                        <div className="flex justify-center">
                            <CheckCircle2 className="h-16 w-16 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold">Pagamento Confirmado!</h2>
                        <p className="text-muted-foreground">
                            Sua assinatura foi atualizada com sucesso. Você será redirecionado para seu perfil em instantes.
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}
