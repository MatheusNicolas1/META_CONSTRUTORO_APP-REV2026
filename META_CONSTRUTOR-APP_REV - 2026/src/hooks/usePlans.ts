import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Plan {
    id: string;
    slug: string;
    name: string;
    description: string;
    monthly_price_cents: number | null;
    yearly_price_cents: number | null;
    features: string[];
    is_active: boolean;
    is_popular: boolean;
    display_order: number;
    stripe_price_id_monthly: string | null;
    stripe_price_id_yearly: string | null;
}

const fallbackPlans: Plan[] = [
    {
        id: 'fallback-free',
        slug: 'free',
        name: 'Free',
        description: 'Para testar o Meta Construtor sem compromisso',
        monthly_price_cents: 0,
        yearly_price_cents: 0,
        features: [
            '5 creditos por mes',
            'RDO digital basico',
            'Cadastro de uma obra',
            'Suporte por email'
        ],
        is_active: true,
        is_popular: false,
        display_order: 1,
        stripe_price_id_monthly: null,
        stripe_price_id_yearly: null,
    },
    {
        id: 'fallback-basic',
        slug: 'basic',
        name: 'Basico',
        description: 'Para pequenas equipes em obras ativas',
        monthly_price_cents: 12990,
        yearly_price_cents: 124704,
        features: [
            'RDOs digitais',
            'Gestao de obras',
            'Checklist de atividades',
            'Relatorios essenciais'
        ],
        is_active: true,
        is_popular: false,
        display_order: 2,
        stripe_price_id_monthly: null,
        stripe_price_id_yearly: null,
    },
    {
        id: 'fallback-professional',
        slug: 'professional',
        name: 'Profissional',
        description: 'Para construtoras que precisam de controle completo',
        monthly_price_cents: 19990,
        yearly_price_cents: 191904,
        features: [
            'RDOs ilimitados conforme creditos',
            'Equipes e equipamentos',
            'Documentos centralizados',
            'Relatorios avancados'
        ],
        is_active: true,
        is_popular: true,
        display_order: 3,
        stripe_price_id_monthly: null,
        stripe_price_id_yearly: null,
    },
    {
        id: 'fallback-master',
        slug: 'master',
        name: 'Master',
        description: 'Para operacoes com multiplas obras e gestores',
        monthly_price_cents: 49990,
        yearly_price_cents: 479904,
        features: [
            'Todos os recursos do Profissional',
            'Integracoes',
            'Permissoes por equipe',
            'Suporte prioritario'
        ],
        is_active: true,
        is_popular: false,
        display_order: 4,
        stripe_price_id_monthly: null,
        stripe_price_id_yearly: null,
    },
    {
        id: 'fallback-business',
        slug: 'business',
        name: 'Business',
        description: 'Para contratos corporativos e necessidades especiais',
        monthly_price_cents: null,
        yearly_price_cents: null,
        features: [
            'Implantacao assistida',
            'Treinamento da equipe',
            'SLA personalizado',
            'Condicoes comerciais dedicadas'
        ],
        is_active: true,
        is_popular: false,
        display_order: 5,
        stripe_price_id_monthly: null,
        stripe_price_id_yearly: null,
    },
];

interface UsePlansOptions {
    staticOnly?: boolean;
}

export const usePlans = ({ staticOnly = false }: UsePlansOptions = {}) => {
    return useQuery({
        queryKey: ['plans', staticOnly ? 'static' : 'remote'],
        queryFn: async () => {
            if (staticOnly) {
                return fallbackPlans;
            }

            const { data, error } = await supabase
                .from('plans' as any)
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (error) {
                if (import.meta.env.DEV) {
                    console.warn('Falha ao carregar planos do Supabase; usando fallback publico.', error);
                }
                return fallbackPlans;
            }

            if (!data?.length) {
                return fallbackPlans;
            }

            // Parse features JSON ensuring it is strictly string[]
            const parsedData = (data as any[]).map(plan => ({
                ...plan,
                features: Array.isArray(plan.features)
                    ? plan.features.map(String)
                    : []
            })) as Plan[];

            return parsedData;
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
};
