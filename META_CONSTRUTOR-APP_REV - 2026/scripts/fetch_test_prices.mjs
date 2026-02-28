import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';

// Hardcoded Test Secret Key from docs/STRIPE_CREDENTIALS.md
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_YOUR_TEST_KEY_HERE', {
    apiVersion: '2023-10-16'
});

async function fetchPrices() {
    try {
        console.log('Fetching prices...');
        const prices = await stripe.prices.list({
            limit: 100,
            active: true,
            expand: ['data.product']
        });

        console.log('Found prices:', prices.data.length);

        // Group by product/plan
        const plans = {
            'basic': {},
            'professional': {},
            'master': {},
            'premium': {}
        };

        prices.data.forEach(price => {
            const product = price.product;
            const productName = (typeof product === 'string' ? '' : product.name).toLowerCase();
            const interval = price.recurring?.interval; // month or year

            // Simple mapping logic
            if (productName.includes('básico') || productName.includes('basic')) {
                plans.basic[interval] = price.id;
            } else if (productName.includes('profissional') || productName.includes('professional')) {
                plans.professional[interval] = price.id;
            } else if (productName.includes('master')) {
                plans.master[interval] = price.id;
            } else if (productName.includes('premium')) {
                plans.premium[interval] = price.id;
            }
        });

        const outputPath = path.resolve('scripts/prices.json');
        fs.writeFileSync(outputPath, JSON.stringify(plans, null, 2));
        console.log(`Saved prices to ${outputPath}`);

    } catch (error) {
        console.error('Error fetching prices:', error);
    }
}

fetchPrices();
