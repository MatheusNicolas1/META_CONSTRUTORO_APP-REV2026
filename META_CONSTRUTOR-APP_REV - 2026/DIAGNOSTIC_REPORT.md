# Relatório de Diagnóstico de Deploy

**Erro:** `ERROR: permission denied for schema supabase_migrations`
**Local:** Falha ao tentar inserir registro na tabela de histórico de migrações (`INSERT INTO supabase_migrations.schema_migrations...`)

## Análise Técnica
1.  **O Processo:** O comando de deploy (`db push`) aplica as mudanças no banco e depois tenta "assinar" a lista de presença (a tabela `schema_migrations`), para saber que aqueles arquivos já foram processados.
2.  **O Bloqueio:** O usuário `postgres`, que estamos usando no script, perdeu o acesso de escrita nessa lista de presença específica.
3.  **O Dilema:** Como o próprio usuário `postgres` está bloqueado, ele não tem autoridade para rodar um comando "me desbloqueie" via terminal. É como trancar a chave do carro dentro do carro.

## Solução Definitiva
Precisamos usar um acesso de nível superior (Supabase Dashboard) para restaurar as permissões.

### Passo a Passo
1.  Acesse: **[Supabase Dashboard > SQL Editor](https://supabase.com/dashboard/project/bgdvlhttyjeuprrfxgun/sql)**
2.  Clique em **"New Query"**.
3.  Cole e execute o código abaixo:

```sql
-- Restaurar permissões do usuário postgres
GRANT USAGE ON SCHEMA supabase_migrations TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA supabase_migrations TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA supabase_migrations TO postgres;

-- Garantir acesso ao schema public também
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;

-- Confirmar correção
SELECT 'Permissoes restauradas!' as status;
```

4.  Após ver a mensagem "Success" ou "Permissoes restauradas!", volte ao terminal e rode `./deploy-all.ps1`.
