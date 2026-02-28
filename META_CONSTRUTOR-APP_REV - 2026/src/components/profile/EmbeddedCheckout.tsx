import { useEffect, useState } from 'react';
import {
    EmbeddedCheckoutProvider,
    EmbeddedCheckout
} from '@stripe/react-stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { stripePromise } from '@/integrations/stripe/client';

interface EmbeddedCheckoutProps {
    priceId: string;
    onClose: () => void;
}

export const EmbeddedCheckoutComponent = ({ priceId, onClose }: EmbeddedCheckoutProps) => {
    const [clientSecret, setClientSecret] = useState('');
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        // Create a Checkout Session as soon as the component loads
        const createCheckoutSession = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase.functions.invoke('create-subscription', {
                    body: { priceId }
                });

                if (error) throw error;
                if (!data.clientSecret) throw new Error('No client secret returned');

                setClientSecret(data.clientSecret);
            } catch (error: any) {
                console.error('Error creating checkout session:', error);
                toast({
                    title: "Erro ao iniciar pagamento",
                    description: error.message || "Não foi possível conectar com o Stripe.",
                    variant: "destructive"
                });
                onClose();
            } finally {
                setLoading(false);
            }
        };

        createCheckoutSession();
    }, [priceId, toast, onClose]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-background border rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden relative flex flex-col">
                <div className="p-4 border-b flex justify-between items-center bg-muted/20">
                    <h3 className="font-semibold text-lg">Finalizar Assinatura</h3>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {clientSecret && (
                        <EmbeddedCheckoutProvider
                            stripe={stripePromise}
                            options={{ clientSecret }}
                        >
                            <EmbeddedCheckout className="w-full" />
                        </EmbeddedCheckoutProvider>
                    )}
                </div>
            </div>
        </div>
    );
};
