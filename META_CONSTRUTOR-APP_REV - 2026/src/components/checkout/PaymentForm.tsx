
import { useEffect, useState } from "react";
import {
    PaymentElement,
    useStripe,
    useElements
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface PaymentFormProps {
    clientSecret: string;
    onSuccess: () => void;
    onCancel: () => void;
    amount?: string; // Optional: to display amount
}

export function PaymentForm({ clientSecret, onSuccess, onCancel, amount }: PaymentFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const { toast } = useToast();

    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [cardholderName, setCardholderName] = useState("");

    useEffect(() => {
        if (!stripe) {
            return;
        }

        if (!clientSecret) {
            return;
        }

        stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
            switch (paymentIntent?.status) {
                case "succeeded":
                    setMessage("Pagamento realizado com sucesso!");
                    break;
                case "processing":
                    setMessage("Seu pagamento está sendo processado.");
                    break;
                case "requires_payment_method":
                    // Normal state, waiting for input
                    break;
                default:
                    setMessage("Algo deu errado.");
                    break;
            }
        });
    }, [stripe, clientSecret]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            // Stripe.js has not yet loaded.
            return;
        }

        setIsLoading(true);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Return URL is required for some payment methods, but we handle via callback if successful directly
                return_url: window.location.origin + "/checkout/success",
                payment_method_data: {
                    billing_details: {
                        name: cardholderName,
                    },
                },
            },
            redirect: "if_required",
        });

        if (error) {
            if (error.type === "card_error" || error.type === "validation_error") {
                setMessage(error.message || "Ocorreu um erro desconhecido.");
            } else {
                setMessage("Ocorreu um erro inesperado.");
            }
            toast({
                title: "Erro no pagamento",
                description: error.message || "Verifique os dados do cartão.",
                variant: "destructive",
            });
            setIsLoading(false);
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            setMessage("Pagamento realizado com sucesso!");
            toast({
                title: "Sucesso!",
                description: "Assinatura ativada.",
            });
            onSuccess();
        } else {
            // Loop or other status
            setIsLoading(false);
        }
    };

    return (
        <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
            {amount && (
                <div className="mb-4 p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Valor a pagar</p>
                    <p className="text-2xl font-bold">{amount}</p>
                </div>
            )}

            {/* Nome no Cartão (Customizado para garantir visibilidade) */}
            <div className="space-y-2">
                <Label htmlFor="cardholderName">Nome no cartão</Label>
                <Input
                    id="cardholderName"
                    placeholder="Nome impresso no cartão"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    required
                />
            </div>

            <PaymentElement
                id="payment-element"
                options={{
                    layout: "tabs",
                    fields: {
                        billingDetails: {
                            name: 'never', // Disable default to avoid duplication
                        }
                    }
                }}
            />

            {message && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/10 p-3 rounded border border-red-200 dark:border-red-900/20">
                    {message}
                </div>
            )}

            <div className="flex gap-3 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="w-full"
                >
                    Cancelar
                </Button>
                <Button
                    disabled={isLoading || !stripe || !elements || !cardholderName}
                    id="submit"
                    className="w-full bg-[#00E599] hover:bg-[#00E599]/90 text-black font-bold"
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Processando...
                        </span>
                    ) : (
                        "Pagar e Assinar"
                    )}
                </Button>
            </div>
        </form>
    );
}
