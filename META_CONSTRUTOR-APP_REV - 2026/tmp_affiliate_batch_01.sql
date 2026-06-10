1|-- ============================================================================
2|-- PRD06: MÓDULO 01 — Programa de Afiliados (Banco de Dados)
3|-- ============================================================================
4|-- 4 tabelas: affiliate_profiles, affiliate_clicks, affiliate_referrals, affiliate_commissions
5|-- ============================================================================
6|
7|-- ============================================================================
8|-- 1. affiliate_profiles — Perfil de afiliado de cada usuário
9|-- ============================================================================
10|CREATE TABLE IF NOT EXISTS public.affiliate_profiles (
11|    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
12|    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
13|    affiliate_code text NOT NULL UNIQUE,
14|    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'inactive')),
15|    total_clicks integer NOT NULL DEFAULT 0,
16|    total_referrals integer NOT NULL DEFAULT 0,
17|    total_commissions numeric(12,2) NOT NULL DEFAULT 0,
18|    created_at timestamptz NOT NULL DEFAULT now(),
19|    updated_at timestamptz NOT NULL DEFAULT now(),
20|    CONSTRAINT affiliate_code_format CHECK (affiliate_code ~ '^MC[A-Z0-9]{8}$'),
21|    CONSTRAINT affiliate_profiles_user_id_unique UNIQUE (user_id)
22|);

23|
24|CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_user_id ON public.affiliate_profiles(user_id);

25|CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_code ON public.affiliate_profiles(affiliate_code);

26|CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_status ON public.affiliate_profiles(status);

27|
28|-- ============================================================================
29|-- 2. affiliate_clicks — Cliques no link de afiliado (rastreamento)
30|-- ============================================================================
31|CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
32|    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
33|    affiliate_id uuid NOT NULL REFERENCES public.affiliate_profiles(id) ON DELETE CASCADE,
34|    visitor_ip text NOT NULL,
35|    visitor_agent text DEFAULT '',
36|    referrer_url text DEFAULT '',
37|    created_at timestamptz NOT NULL DEFAULT now()
38|);