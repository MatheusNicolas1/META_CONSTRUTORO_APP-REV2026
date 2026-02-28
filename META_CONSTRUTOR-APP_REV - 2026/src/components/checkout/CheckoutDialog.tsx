
"use client";

import { Dialog } from "@ark-ui/react/dialog";
import { Portal } from "@ark-ui/react/portal";
import { X, ShoppingBag, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface CheckoutDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    clientSecret: string;
    planName: string;
    planPrice: string;
    planInterval: string;
    onSuccess: () => void;
}

export default function CheckoutDialog({
    isOpen,
    onOpenChange,
    clientSecret,
    planName,
    planPrice,
    planInterval,
    onSuccess
}: CheckoutDialogProps) {
    const stripe = useStripe();
    const elements = useElements();
    const { toast } = useToast();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true);
        setErrorMessage(null);

        try {
            // Use "redirect: if_required" to handle 3DS or success without full page reload if possible,
            // but Stripe Elements usually prefers redirect for full compliance.
            // However, for "Stitch" style embedded feeling, we try to keep it smooth.
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/checkout/success`,
                },
                redirect: 'if_required',
            });

            if (error) {
                setErrorMessage(error.message ?? "An error occurred");
                toast({
                    variant: "destructive",
                    title: "Erro no pagamento",
                    description: error.message ?? "Tente novamente.",
                });
            } else if (paymentIntent && paymentIntent.status === "succeeded") {
                toast({
                    title: "Pagamento realizado!",
                    description: "Sua assinatura foi ativada com sucesso.",
                    className: "bg-green-600 text-white border-none"
                });
                onSuccess();
            }
        } catch (err) {
            console.error(err);
            setErrorMessage("Ocorreu um erro inesperado.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(details) => onOpenChange(details.open)}>
            <Portal>
                <Dialog.Backdrop className="data-[state=open]:animate-backdrop-in data-[state=closed]:animate-backdrop-out fixed inset-0 z-50 bg-black/50 backdrop-blur-xs" />
                <Dialog.Positioner className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Added max-h-[90vh] and overflow-y-auto to handle small screens/virtual keyboards */}
                    <Dialog.Content className="data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out relative w-full max-w-md rounded-lg bg-white dark:bg-gray-900 p-5 shadow-lg max-h-[90vh] overflow-y-auto">
                        <Dialog.CloseTrigger asChild>
                            <button className="absolute right-3 top-3 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer z-10">
                                <X className="h-4 w-4" />
                            </button>
                        </Dialog.CloseTrigger>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex items-start space-x-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 shrink-0">
                                    <ShoppingBag className="h-5 w-5 text-gray-600 dark:text-white" />
                                </div>
                                <div className="space-y-1">
                                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Confirmar e pagar
                                    </Dialog.Title>
                                    <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400">
                                        Pague com segurança. Cancele quando quiser.
                                    </Dialog.Description>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Selected Plan Display */}
                                <div className="p-3 rounded-md border border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800 transition-colors relative">
                                    <div className="absolute -top-2 -right-2">
                                        <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shadow-sm">
                                            SELECIONADO
                                        </span>
                                    </div>
                                    <div className="text-gray-900 dark:text-white font-medium text-sm">
                                        {planName}
                                    </div>
                                    <div className="text-gray-600 dark:text-gray-400 text-xs">
                                        {planPrice}/{planInterval === 'month' ? 'mês' : 'ano'}
                                    </div>
                                </div>

                                {/* Stripe Payment Element replaces manual inputs */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                            Dados do Cartão
                                        </h3>
                                        <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                                            <ShieldCheck className="w-3 h-3 mr-1" />
                                            Ambiente Seguro
                                        </div>
                                    </div>

                                    <div className="p-1 min-h-[100px]">
                                        {/* We customize the PaymentElement options container to match the design logic */}
                                        <PaymentElement
                                            options={{
                                                layout: "tabs",
                                                // The appearance prop is passed to the parent <Elements> provider, 
                                                // but we can rely on standard inheritence or pass layout here.
                                            }}
                                        />
                                    </div>
                                </div>

                                {errorMessage && (
                                    <div className="text-red-500 text-xs p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                                        {errorMessage}
                                    </div>
                                )}

                                {/* Subscribe Button */}
                                <Button
                                    type="submit"
                                    disabled={!stripe || isLoading}
                                    className="w-full h-11 text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-md transition-colors cursor-pointer inline-flex items-center justify-center font-medium my-2"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                            Processando...
                                        </div>
                                    ) : (
                                        `Assinar ${planName}`
                                    )}
                                </Button>

                                {/* Footer Text */}
                                <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                                    Ao assinar, você concorda com nossos termos.
                                </p>
                            </div>
                        </form>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}
