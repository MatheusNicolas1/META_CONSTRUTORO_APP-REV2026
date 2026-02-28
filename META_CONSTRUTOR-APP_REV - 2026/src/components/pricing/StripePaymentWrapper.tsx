
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

// Force lazy load of Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface StripePaymentWrapperProps {
    planSlug: string;
    billingCycle: "monthly" | "yearly";
    isTrial?: boolean;
    onComplete?: () => void;
}

export function StripePaymentWrapper({ planSlug, billingCycle, onComplete }: StripePaymentWrapperProps) {

    const fetchClientSecret = useCallback(async () => {
        try {
            // Create a Checkout Session
            const { data, error } = await supabase.functions.invoke('create-subscription', {
                body: {
                    plan: planSlug,
                    billing: billingCycle
                },
            });

            if (error) {
                throw new Error(error.message);
            }

            return data.clientSecret;
        } catch (err) {
            console.error('Error creating subscription session:', err);
            // You might want to bubble this error up or show a toast
            throw err;
        }
    }, [planSlug, billingCycle]);

    const options = { fetchClientSecret, onComplete };

    return (
        <div className="w-full min-h-[400px] border rounded-lg overflow-hidden bg-card">
            <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
                <EmbeddedCheckout className="h-full w-full" />
            </EmbeddedCheckoutProvider>
        </div>
    );
}
