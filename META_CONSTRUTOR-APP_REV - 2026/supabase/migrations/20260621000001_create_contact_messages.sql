-- Create contact_messages table for public contact form submissions
-- Schema matches existing remote table (columns in PT-BR)
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    empresa TEXT,
    telefone TEXT,
    assunto TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    status TEXT DEFAULT 'pendente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index on created_at for ordering
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at DESC);

-- Add index on status for admin filtering
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow public insert (anyone can submit contact form)
CREATE POLICY "Anyone can insert contact messages"
    ON public.contact_messages
    FOR INSERT
    TO anon
    WITH CHECK (TRUE);

-- Only authenticated admins can view/update
CREATE POLICY "Admins can view contact messages"
    ON public.contact_messages
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.org_members om
            WHERE om.user_id = auth.uid()
            AND om.role IN ('Presidente', 'Administrador')
        )
    );

CREATE POLICY "Admins can update contact messages"
    ON public.contact_messages
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.org_members om
            WHERE om.user_id = auth.uid()
            AND om.role IN ('Presidente', 'Administrador')
        )
    );
