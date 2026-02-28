
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bgdvlhttyjeuprrfxgun.supabase.co';
// Using Service Role Key to bypass RLS and ensure writes
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZHZsaHR0eWpldXBycmZ4Z3VuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk4Mzg2NSwiZXhwIjoyMDczNTU5ODY1fQ.dwoQeiAgOy4b4FFSQIH2l4OGPtyv_Bzo60emwhph_Cc';

const supabase = createClient(supabaseUrl, supabaseKey);

const plansPayload = [
    {
        slug: 'free',
        name: 'GRATUITO',
        monthly_price_cents: 0,
        yearly_price_cents: 0,
        description: 'Plataforma gratuita - teste sem limites de tempo!',
        features: ["7 Créditos RDO Gratuitos", "1 crédito = 1 RDO criado", "100% Grátis - Sem pegadinhas", "1 usuário", "1 obra", "RDO digital completo", "Suporte por email", "Sem cartão de crédito"],
        is_active: true,
        is_popular: false,
        display_order: 1,
        stripe_price_id_monthly: null,
        stripe_price_id_yearly: null
    },
    {
        slug: 'basic',
        name: 'BÁSICO',
        monthly_price_cents: 12990,
        yearly_price_cents: 10392,
        description: 'Perfeito para pequenas construtoras',
        features: ["Até 3 usuários", "Armazenamento ilimitado", "RDO digital completo", "Relatórios básicos", "Suporte por email", "Backup automático"],
        is_active: true,
        is_popular: false,
        display_order: 2,
        stripe_price_id_monthly: 'price_1T1HSsCHfNdO9jxNJyBqYUW1',
        stripe_price_id_yearly: 'price_1T1HSsCHfNdO9jxN0oT7lsgq'
    },
    {
        slug: 'professional',
        name: 'PROFISSIONAL',
        monthly_price_cents: 19990,
        yearly_price_cents: 15992,
        description: 'Ideal para construtoras em crescimento',
        features: ["Até 5 usuários", "Obras ilimitadas", "Relatórios avançados", "Integrações WhatsApp", "Suporte via chat 24h", "Dashboard avançado", "Controle de estoque"],
        is_active: true,
        is_popular: true,
        display_order: 3,
        stripe_price_id_monthly: 'price_1T1HSsCHfNdO9jxNDtPicSaZ',
        stripe_price_id_yearly: 'price_1T1HStCHfNdO9jxN2BtTrfpS'
    },
    {
        slug: 'master',
        name: 'MASTER',
        monthly_price_cents: 49990,
        yearly_price_cents: 39992,
        description: 'Para construtoras estabelecidas',
        features: ["Até 15 usuários", "Obras ilimitadas", "Todas as funcionalidades do Profissional", "API personalizada", "Integração com ERP", "Suporte prioritário (SLA 8h)", "Treinamento dedicado"],
        is_active: true,
        is_popular: false,
        display_order: 4,
        stripe_price_id_monthly: 'price_1T1HStCHfNdO9jxNsjxKYfjw',
        stripe_price_id_yearly: 'price_1T1HStCHfNdO9jxNpT8KUqLV'
    },
    {
        slug: 'premium',
        name: 'PREMIUM',
        monthly_price_cents: 74990,
        yearly_price_cents: 719904,
        description: 'Antigo plano Premium',
        features: [],
        is_active: false, // Ensure deactivated
        is_popular: false,
        display_order: 5,
        stripe_price_id_monthly: 'price_1T1HSuCHfNdO9jxNZXGzFFC2',
        stripe_price_id_yearly: 'price_1T1HSuCHfNdO9jxNYdWIg3ia'
    },
    {
        slug: 'business',
        name: 'BUSINESS',
        monthly_price_cents: null,
        yearly_price_cents: null,
        description: 'Para grandes incorporadoras e construtoras',
        features: ["Usuários ilimitados", "Integrações customizadas", "SLA 24/7", "Onboarding dedicado", "Gerente de conta exclusivo", "White label disponível", "Múltiplas empresas"],
        is_active: true,
        is_popular: false,
        display_order: 6,
        stripe_price_id_monthly: null,
        stripe_price_id_yearly: null
    }
];

async function seedRemote() {
    console.log('Seeding remote plans table...');

    for (const plan of plansPayload) {
        const { error } = await supabase
            .from('plans')
            .upsert(plan, { onConflict: 'slug' });

        if (error) {
            console.error(`Error upserting ${plan.slug}:`, error);
        } else {
            console.log(`Upserted ${plan.slug}`);
        }
    }

    console.log('Done.');
}

seedRemote();
