import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { createScopedClient, createAdminClient } from '../_shared/supabase-client.ts';
import { requireAuth } from '../_shared/guards.ts';

/**
 * delete-account: Exclusão de conta com reautenticação.
 *
 * Requer:
 * - Authorization header (JWT do usuário logado)
 * - Body: { password: string } para reautenticação
 *
 * Fluxo:
 * 1. Valida JWT e extrai userId
 * 2. Reautentica com email + password
 * 3. Deleta dados em cascata (profiles, org_members, user_roles, user_settings, user_credits)
 * 4. Chama admin.deleteUser()
 * 5. Retorna 200
 */

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
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
        const userEmail = user.email;

        if (!userEmail) {
            return new Response(
                JSON.stringify({ error: 'Conta sem email associado.' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 2. Reautenticação: exigir senha para confirmar identidade
        const body = await req.json();
        const { password } = body;

        if (!password || typeof password !== 'string') {
            return new Response(
                JSON.stringify({ error: 'Senha é obrigatória para confirmar a exclusão.' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Verificar credenciais
        const adminClient = createAdminClient();

        // Tentar login com as credenciais fornecidas para validar
        const { error: signInError } = await adminClient.auth.signInWithPassword({
            email: userEmail,
            password: password,
        });

        if (signInError) {
            return new Response(
                JSON.stringify({ error: 'Senha incorreta. Reautenticação falhou.' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 3. Deletar dados em cascata (ordem: dependentes primeiro)
        // user_credits
        await adminClient.from('user_credits').delete().eq('user_id', userId);
        // user_settings
        await adminClient.from('user_settings').delete().eq('user_id', userId);
        // user_roles
        await adminClient.from('user_roles').delete().eq('user_id', userId);
        // org_members
        await adminClient.from('org_members').delete().eq('user_id', userId);

        // Verificar se é owner de alguma org
        const { data: ownedOrgs } = await adminClient
            .from('orgs')
            .select('id')
            .eq('owner_user_id', userId);

        if (ownedOrgs && ownedOrgs.length > 0) {
            for (const org of ownedOrgs) {
                // Verificar se há outros membros
                const { count } = await adminClient
                    .from('org_members')
                    .select('*', { count: 'exact', head: true })
                    .eq('org_id', org.id);

                if (!count || count === 0) {
                    // Org sem membros restantes — deletar org
                    await adminClient.from('orgs').delete().eq('id', org.id);
                } else {
                    // Transferir ownership para o primeiro membro ativo
                    const { data: nextOwner } = await adminClient
                        .from('org_members')
                        .select('user_id')
                        .eq('org_id', org.id)
                        .eq('status', 'active')
                        .neq('user_id', userId)
                        .limit(1)
                        .single();

                    if (nextOwner) {
                        await adminClient
                            .from('orgs')
                            .update({ owner_user_id: nextOwner.user_id })
                            .eq('id', org.id);
                    }
                }
            }
        }

        // profiles
        await adminClient.from('profiles').delete().eq('id', userId);

        // 4. Log de auditoria
        await adminClient.from('audit_logs').insert({
            user_id: userId,
            action: 'account_deleted',
            details: { reason: 'user_request', timestamp: new Date().toISOString() },
        });

        // 5. Deletar usuário do Supabase Auth
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

        if (deleteError) {
            console.error('Error deleting auth user:', deleteError.message);
            return new Response(
                JSON.stringify({ error: 'Erro ao finalizar exclusão. Contate o suporte.' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({ success: true, message: 'Conta excluída com sucesso.' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (err) {
        console.error('delete-account error:', err instanceof Error ? err.message : 'unknown');
        return new Response(
            JSON.stringify({ error: 'Erro interno. Tente novamente.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
