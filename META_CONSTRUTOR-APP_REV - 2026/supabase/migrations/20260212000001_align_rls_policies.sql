-- M1.3: Align Policies (RLS) without duplication
-- This migration standardizes RLS using valid PRD2 patterns and helper functions.

-- Helper: Ensure valid policies for OBRAS
DROP POLICY IF EXISTS "obras_select_policy" ON public.obras;
DROP POLICY IF EXISTS "obras_insert_policy" ON public.obras;
DROP POLICY IF EXISTS "obras_update_policy" ON public.obras;
DROP POLICY IF EXISTS "obras_delete_policy" ON public.obras;

CREATE POLICY "obras_select_policy" ON public.obras FOR SELECT
USING ( public.is_org_member(org_id) );

CREATE POLICY "obras_insert_policy" ON public.obras FOR INSERT
WITH CHECK ( public.is_org_member(org_id) );

CREATE POLICY "obras_update_policy" ON public.obras FOR UPDATE
USING ( 
    public.has_org_role(org_id, ARRAY['Administrador', 'Gerente']::app_role[]) 
    OR auth.uid() = created_by 
);

CREATE POLICY "obras_delete_policy" ON public.obras FOR DELETE
USING ( public.has_org_role(org_id, ARRAY['Administrador']::app_role[]) );


-- Helper: Ensure valid policies for RDOS
DROP POLICY IF EXISTS "rdos_select_policy" ON public.rdos;
DROP POLICY IF EXISTS "rdos_insert_policy" ON public.rdos;
DROP POLICY IF EXISTS "rdos_update_policy" ON public.rdos;
DROP POLICY IF EXISTS "rdos_delete_policy" ON public.rdos;

CREATE POLICY "rdos_select_policy" ON public.rdos FOR SELECT
USING ( public.is_org_member(org_id) );

CREATE POLICY "rdos_insert_policy" ON public.rdos FOR INSERT
WITH CHECK ( public.is_org_member(org_id) );

CREATE POLICY "rdos_update_policy" ON public.rdos FOR UPDATE
USING ( 
    public.has_org_role(org_id, ARRAY['Administrador', 'Gerente']::app_role[]) 
    OR auth.uid() = created_by 
);

CREATE POLICY "rdos_delete_policy" ON public.rdos FOR DELETE
USING ( 
    public.has_org_role(org_id, ARRAY['Administrador']::app_role[]) 
    OR (auth.uid() = created_by AND status = 'DRAFT'::rdo_status)
);
