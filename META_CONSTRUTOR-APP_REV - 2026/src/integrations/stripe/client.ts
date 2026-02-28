
import { loadStripe } from '@stripe/stripe-js';

// Publishable Key from docs/STRIPE_CREDENTIALS.md
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

