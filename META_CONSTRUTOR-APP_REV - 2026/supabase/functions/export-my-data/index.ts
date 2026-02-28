import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { createScopedClient, createAdminClient } from '../_shared/supabase-client.ts';
import { requireAuth } from '../_shared/guards.ts';

/**
 * export-my-data: Portabilidade LGPD — exportar todos os dados do titular.
 *
 * Requer:
 * - Authorization header (JWT do usuário logado)
 *
 * Retorna:
 * - JSON estruturado com TODOS os dados do usuário
 * - Não inclui dados de terceiros
 * - Campos internos são sanitizados
 */

// Tabelas que possuem dados vinculados ao user_id
const USER_TABLES = [
    { table: 'profiles', key: 'id', label: 'perfil' },
    { table: 'user_settings', key: 'user_id', label: 'configuracoes' },
    { table: 'user_credits', key: 'user_id', label: 'creditos' },
    { table: 'user_roles', key: 'user_id', label: 'papeis' },
    { table: 'org_members', key: 'user_id', label: 'organizacoes' },
    { table: 'obras', key: 'user_id', label: 'obras' },
    { table: 'rdos', key: 'criado_por_id', label: 'rdos' },
    { table: 'atividades', key: 'user_id', label: 'atividades' },
    { table: 'equipes', key: 'user_id', label: 'equipes' },
    { table: 'equipamentos', key: 'user_id', label: 'equipamentos' },
    { table: 'fornecedores', key: 'user_id', label: 'fornecedores' },
    { table: 'checklists', key: 'responsavel_id', label: 'checklists' },
    { table: 'documentos', key: 'uploaded_by', label: 'documentos' },
    { table: 'notifications', key: 'user_id', label: 'notificacoes' },
    { table: 'achievements', key: 'user_id', label: 'conquistas' },
    { table: 'posts', key: 'user_id', label: 'publicacoes' },
    { table: 'comments', key: 'user_id', label: 'comentarios' },
    { table: 'likes', key: 'user_id', label: 'curtidas' },
    { table: 'follows', key: 'follower_id', label: 'seguindo' },
    { table: 'social_shares', key: 'user_id', label: 'compartilhamentos' },
    { table: 'referrals', key: 'referrer_id', label: 'indicacoes' },
    { table: 'expenses', key: 'user_submitting_id', label: 'despesas' },
] as const;

// Campos internos a sanitizar (remover do export)
const INTERNAL_FIELDS = [
    'stripe_customer_id',
    'stripe_subscription_id',
    'service_role_key',
];

function sanitize(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...obj };
    for (const field of INTERNAL_FIELDS) {
        if (field in sanitized) {
            sanitized[field] = '[REDACTED]';
        }
    }
    return sanitized;
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'GET' && req.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    try {
        // 1. Autenticar usuário via JWT
        const supabase = createScopedClient(req);
        const user = await requireAuth(supabase);
        const userId = user.id;

        const adminClient = createAdminClient();

        // 2. Coletar dados de todas as tabelas do usuário
        const exportData: Record<string, unknown> = {
            _meta: {
                versao: '1.0',
                data_exportacao: new Date().toISOString(),
                titular_id: userId,
                formato: 'LGPD - Portabilidade de Dados (Art. 18)',
                descricao: 'Exportação completa dos dados pessoais do titular conforme Lei 13.709/2018',
            },
        };

        for (const { table, key, label } of USER_TABLES) {
            try {
                const { data, error } = await adminClient
                    .from(table)
                    .select('*')
                    .eq(key, userId);

                if (error) {
                    exportData[label] = { erro: 'Não foi possível carregar', detalhes: error.message };
                } else {
                    exportData[label] = (data || []).map((row: Record<string, unknown>) => sanitize(row));
                }
            } catch {
                exportData[label] = { erro: 'Tabela indisponível' };
            }
        }

        // 3. Dados de consentimento
        const { data: profile } = await adminClient
            .from('profiles')
            .select('terms_accepted_at, terms_accepted_ip, created_at')
            .eq('id', userId)
            .single();

        exportData['consentimento'] = {
            termos_aceitos_em: profile?.terms_accepted_at || null,
            ip_registro: profile?.terms_accepted_ip || null,
            conta_criada_em: profile?.created_at || null,
        };

        // 4. Log de auditoria (sem PII)
        await adminClient.from('admin_audit_logs').insert({
            admin_id: userId,
            action: 'data_exported',
            details: {
                timestamp: new Date().toISOString(),
                tables_exported: USER_TABLES.map(t => t.table),
            },
        });

        // 5. Retornar JSON
        return new Response(
            JSON.stringify(exportData, null, 2),
            {
                status: 200,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json; charset=utf-8',
                    'Content-Disposition': `attachment; filename="meus-dados-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.json"`,
                },
            }
        );

    } catch (err) {
        console.error('export-my-data error:', err instanceof Error ? err.message : 'unknown');
        return new Response(
            JSON.stringify({ error: 'Erro interno. Tente novamente.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
