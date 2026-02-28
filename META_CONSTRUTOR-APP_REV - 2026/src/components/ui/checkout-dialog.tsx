import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/integrations/stripe/client";
import { PaymentForm } from "@/components/checkout/PaymentForm";
import { Shield, CreditCard } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CheckoutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientSecret: string | null;
    planName: string;
    amount: string;
    period: string; // 'por mês' etc
    billingCycle: 'monthly' | 'yearly';
    onBillingChange: (cycle: 'monthly' | 'yearly') => Promise<void>;
    planPrice: number;
}

export default function CheckoutDialog({
    open,
    onOpenChange,
    clientSecret,
    planName,
    billingCycle,
    onBillingChange,
    planPrice
}: CheckoutDialogProps) {
    const [isUpdating, setIsUpdating] = useState(false);

    const handleCycleChange = async (cycle: 'monthly' | 'yearly') => {
        if (cycle === billingCycle) return;
        setIsUpdating(true);
        try {
            await onBillingChange(cycle);
        } finally {
            setIsUpdating(false);
        }
    };

    const appearance = {
        theme: 'flat' as const,
        variables: {
            colorPrimary: '#10b981', // Emerald 500
            colorBackground: '#ffffff',
            colorText: '#0f172a',
            colorDanger: '#ef4444',
            fontFamily: 'Inter, system-ui, sans-serif',
            borderRadius: '12px',
        },
        rules: {
            '.Input': {
                border: '1px solid #e2e8f0',
                boxShadow: 'none',
                padding: '12px',
            },
            '.Input:focus': {
                border: '1px solid #10b981',
                boxShadow: '0 0 0 1px #10b981',
            },
            '.Label': {
                fontWeight: '500',
                color: '#64748b'
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-[450px] max-h-[90vh] overflow-y-auto p-0 gap-0 border-0 rounded-2xl shadow-2xl bg-white dark:bg-gray-950">
                {/* Header Clean */}
                <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                    <DialogHeader className="space-y-4">
                        <DialogTitle className="flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Checkout Seguro</h2>
                                <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                                    <Shield className="h-3 w-3" /> Criptografia de ponta a ponta
                                </p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border shadow-sm">
                                <CreditCard className="h-6 w-6 text-emerald-500" />
                            </div>
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Finalize sua assinatura escolhendo o ciclo de faturamento e inserindo os dados do cartão.
                        </DialogDescription>

                        {/* Toggle Ciclo */}
                        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => handleCycleChange('monthly')}
                                className={cn(
                                    "flex-1 py-1.5 text-sm font-medium rounded-lg transition-all",
                                    billingCycle === 'monthly'
                                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                                )}
                            >
                                Mensal
                            </button>
                            <button
                                type="button"
                                onClick={() => handleCycleChange('yearly')}
                                className={cn(
                                    "flex-1 py-1.5 text-sm font-medium rounded-lg transition-all relative",
                                    billingCycle === 'yearly'
                                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                                )}
                            >
                                Anual <span className="text-[10px] text-emerald-600 bg-emerald-100 dark:bg-emerald-900 px-1.5 py-0.5 rounded-full ml-1">-20%</span>
                            </button>
                        </div>
                    </DialogHeader>

                    {/* Resumo do Pedido */}
                    <div className="mt-4 flex justify-between items-end border-t pt-4 border-slate-200 dark:border-slate-800">
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Plano {planName}</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                {planPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                <span className="text-sm font-normal text-slate-400 ml-1">/{billingCycle === 'monthly' ? 'mês' : 'ano'}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body do Stripe */}
                <div className="p-4 sm:p-6">
                    {isUpdating ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                            <p className="text-sm text-slate-500">Atualizando valores...</p>
                        </div>
                    ) : (
                        clientSecret && (
                            <Elements stripe={stripePromise} options={{
                                clientSecret,
                                appearance,
                                locale: 'pt-BR'
                            }}>
                                <PaymentForm
                                    clientSecret={clientSecret}
                                    onSuccess={() => {
                                        window.location.href = '/checkout/success';
                                    }}
                                    onCancel={() => onOpenChange(false)}
                                />
                            </Elements>
                        )
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
