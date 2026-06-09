import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const sql = `
CREATE TABLE IF NOT EXISTS public.email_click_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id text NOT NULL,
  campaign_day text NOT NULL,
  link_destino text NOT NULL,
  utm_source text DEFAULT 'email',
  utm_medium text DEFAULT 'campanha26',
  utm_campaign text,
  utm_content text,
  clicked_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  device_type text,
  browser text,
  os text
);

CREATE INDEX IF NOT EXISTS idx_email_click_contact_id ON public.email_click_log(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_click_campaign_day ON public.email_click_log(campaign_day);
CREATE INDEX IF NOT EXISTS idx_email_click_clicked_at ON public.email_click_log(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_click_utm_campaign ON public.email_click_log(utm_campaign);

ALTER TABLE public.email_click_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'email_click_log' AND policyname = 'Anyone can insert email clicks'
  ) THEN
    CREATE POLICY \"Anyone can insert email clicks\"
      ON public.email_click_log FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'email_click_log' AND policyname = 'Admins can view email clicks'
  ) THEN
    CREATE POLICY \"Admins can view email clicks\"
      ON public.email_click_log FOR SELECT TO authenticated
      USING (auth.jwt() ->> 'role' IN ('Presidente', 'Administrador'));
  END IF;
END $$;
    `

    // Supabase SQL query via service_role bypasses RLS
    const { error } = await supabase.rpc('exec_sql_pg', { query_text: sql }).maybeSingle()
    
    if (error) {
      // Fallback: tenta raw query na conexão direta
      const { error: fallbackError } = await supabase.from('email_click_log').select('id').limit(0)
      if (fallbackError && fallbackError.message?.includes('does not exist')) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'exec_sql_pg não existe no projeto. Crie a função manualmente no SQL Editor do Supabase',
          hint: 'CREATE OR REPLACE FUNCTION exec_sql_pg(query_text text) RETURNS void AS $$ BEGIN EXECUTE query_text; END; $$ LANGUAGE plpgsql SECURITY DEFINER;'
        }), { status: 500, headers: { 'Content-Type': 'application/json' } })
      }
      throw error
    }

    return new Response(JSON.stringify({ success: true, message: 'Migration executada com sucesso!' }), { 
      headers: { 'Content-Type': 'application/json' } 
    })
  } catch (err) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message,
      hint: err.message?.includes('exec_sql_pg') ? 'Crie a função helper no SQL Editor do Supabase Dashboard' : undefined
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
