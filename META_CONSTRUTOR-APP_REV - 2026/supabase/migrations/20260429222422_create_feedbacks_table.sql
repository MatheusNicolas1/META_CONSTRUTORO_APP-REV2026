
-- Tabela feedbacks para formulário de feedback dos usuários
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  org_id UUID REFERENCES public.orgs(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Bug', 'Sugestão', 'Elogio', 'Dúvida', 'Reclamação', 'Outro')),
  titulo TEXT,
  mensagem TEXT NOT NULL,
  nota_satisfacao INTEGER CHECK (nota_satisfacao BETWEEN 1 AND 5),
  status TEXT DEFAULT 'Recebido' CHECK (status IN ('Recebido', 'Em Análise', 'Resolvido', 'Arquivado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Usuário autenticado pode inserir feedback
CREATE POLICY "users_can_insert_own_feedbacks" ON public.feedbacks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Usuário pode ler seus próprios feedbacks
CREATE POLICY "users_can_read_own_feedbacks" ON public.feedbacks
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Tabela contact_messages para formulário de contato público
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  empresa TEXT,
  telefone TEXT,
  assunto TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  status TEXT DEFAULT 'Não Lido' CHECK (status IN ('Não Lido', 'Lido', 'Respondido', 'Arquivado')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Permite insert anônimo (formulário público da landing page)
CREATE POLICY "anyone_can_insert_contact" ON public.contact_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);
;
