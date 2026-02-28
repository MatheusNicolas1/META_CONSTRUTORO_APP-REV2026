
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('\x1b[31m%s\x1b[0m', 'Erro: Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias.');
    console.log('Certifique-se de ter um arquivo .env na raiz ou defina as variáveis antes de executar o script.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function makeAdmin(email) {
    try {
        console.log(`Buscando usuário: ${email}...`);

        let userId = null;
        let userName = 'Usuário';

        // 1. Buscar usuário na tabela profiles
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, name, email')
            .eq('email', email)
            .single();

        if (profiles) {
            userId = profiles.id;
            userName = profiles.name;
            console.log(`Usuário encontrado em profiles: ${userName} (${userId})`);
        } else {
            console.log('Usuário não encontrado na tabela profiles. Tentando buscar em auth.users...');
            const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

            const user = users.find(u => u.email === email);

            if (!user) {
                console.error('\x1b[31m%s\x1b[0m', `Erro: Usuário com email ${email} não encontrado.`);
                process.exit(1);
            }
            userId = user.id;
            console.log(`Usuário encontrado em auth: ${userId}`);
        }

        await assignRole(userId);

    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', 'Erro inesperado:', error);
        process.exit(1);
    }
}

async function assignRole(userId) {
    try {
        console.log(`Verificando função atual para o ID: ${userId}...`);

        const { data: existingRole, error: fetchError } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "Row not found"
            console.error('Erro ao buscar role:', fetchError);
            throw fetchError;
        }

        if (existingRole) {
            console.log(`Usuário já tem role: ${existingRole.role}. Atualizando para Administrador...`);
            const { error: updateError } = await supabase
                .from('user_roles')
                .update({ role: 'Administrador' })
                .eq('user_id', userId);

            if (updateError) throw updateError;
            console.log('\x1b[32m%s\x1b[0m', 'Sucesso! Role atualizada para Administrador.');
        } else {
            console.log(`Usuário sem role. Criando role Administrador...`);
            const { error: insertError } = await supabase
                .from('user_roles')
                .insert({ user_id: userId, role: 'Administrador' });

            if (insertError) throw insertError;
            console.log('\x1b[32m%s\x1b[0m', 'Sucesso! Role criada como Administrador.');
        }

        process.exit(0);
    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', 'Erro ao atribuir função:', error.message || error);
        process.exit(1);
    }
}

// Main execution
const emailArg = process.argv[2];

if (emailArg) {
    makeAdmin(emailArg);
} else {
    rl.question('Digite o email do usuário para tornar admin: ', (email) => {
        if (!email) {
            console.error('Email é obrigatório.');
            process.exit(1);
        }
        makeAdmin(email.trim());
        rl.close();
    });
}
