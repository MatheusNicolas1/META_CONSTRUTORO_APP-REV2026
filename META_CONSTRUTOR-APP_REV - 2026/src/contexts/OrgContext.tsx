/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
    listMembershipsActive,
    listMyOrgsByMembership,
    type OrgMembership,
    type Org,
} from '@/helpers/orgs';
import {
    setActiveOrgIdLocal,
    getActiveOrgIdLocal,
    clearActiveOrgIdLocal,
} from '@/helpers/storage';

interface OrgContextValue {
    orgs: Org[];
    activeOrgId: string | null;
    activeRole: 'Administrador' | 'Gerente' | 'Colaborador' | null;
    setActiveOrgId: (orgId: string) => void;
    isLoading: boolean;
}

const OrgContext = createContext<OrgContextValue | undefined>(undefined);

export const OrgProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const queryClient = useQueryClient();
    const authContext = useAuth();
    const { user } = authContext;
    const updateAuthRoles = authContext.updateRoles;

    // State
    const [orgs, setOrgs] = useState<Org[]>([]);
    const [memberships, setMemberships] = useState<OrgMembership[]>([]);
    const [activeOrgId, setActiveOrgIdState] = useState<string | null>(null);
    const [activeRole, setActiveRole] = useState<'Administrador' | 'Gerente' | 'Colaborador' | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Refs for stability and deduplication
    const inFlightRef = React.useRef(false);
    const mountedRef = React.useRef(true);
    const lastUserIdRef = React.useRef<string | undefined>(undefined);
    const abortControllerRef = React.useRef<AbortController | null>(null);

    // Track mount status
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            // Cancel any pending request on unmount
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Boot: carregar orgs ao logar (Stable Dependency: user?.id)
    useEffect(() => {
        const currentUserId = user?.id;

        // Reset state if user logs out
        if (!currentUserId) {
            if (mountedRef.current) {
                setOrgs([]);
                setMemberships([]);
                setActiveOrgIdState(null);
                setActiveRole(null);
                clearActiveOrgIdLocal();
                setIsLoading(false);
            }
            lastUserIdRef.current = undefined;
            return;
        }

        // Avoid re-fetching if user ID hasn't changed (unless forced or error recovery)
        // Guard: Only load if user ID changed

        const loadOrgs = async () => {
            // Dedupe: Cancel previous if any, start new.
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            const controller = new AbortController();
            abortControllerRef.current = controller;

            // Simple lock to avoid weird react strict mode races if not aborted correctly
            if (inFlightRef.current) {
                // console.log("[OrgContext] Fetch already in flight, but aborting previous.");
            }
            inFlightRef.current = true;

            try {
                if (mountedRef.current) setIsLoading(true);

                // Buscar memberships + org data em UMA única query
                const { data: membershipsData, error: membershipsError } = await supabase
                    .from('org_members' as any)
                    .select('org_id, role, status, orgs:org_id (id, name, slug, owner_user_id)')
                    .eq('status', 'active')
                    .order('id', { ascending: true });

                if (controller.signal.aborted || !mountedRef.current) return;

                if (membershipsError) {
                    console.error('[OrgContext] Erro ao carregar memberships:', membershipsError);
                    // Fallback: try the old two-query approach
                    const fallbackMemberships = await listMembershipsActive();
                    if (controller.signal.aborted || !mountedRef.current) return;

                    if (fallbackMemberships.length === 0) {
                        console.warn('[OrgContext] Usuário sem organizações ativas');
                        if (mountedRef.current) {
                            setOrgs([]);
                            setMemberships([]);
                            setActiveOrgIdState(null);
                            setActiveRole(null);
                            setIsLoading(false);
                        }
                        return;
                    }

                    const fallbackOrgs = await listMyOrgsByMembership(fallbackMemberships);
                    if (controller.signal.aborted || !mountedRef.current) return;

                    setMemberships(fallbackMemberships);
                    setOrgs(fallbackOrgs);

                    // Choose active org
                    const saved = getActiveOrgIdLocal();
                    const validSaved = fallbackMemberships.find((m) => m.org_id === saved);
                    const chosenOrgId = validSaved ? validSaved.org_id : fallbackMemberships[0].org_id;

                    if (mountedRef.current) {
                        setActiveOrgIdState(chosenOrgId);
                        setActiveOrgIdLocal(chosenOrgId);
                        const membership = fallbackMemberships.find((m) => m.org_id === chosenOrgId);
                        const role = membership?.role || null;
                        setActiveRole(role);
                        if (role) updateAuthRoles([role]);
                        setIsLoading(false);
                    }
                    return;
                }

                const rawMemberships = (membershipsData as any[]) || [];

                if (rawMemberships.length === 0) {
                    console.warn('[OrgContext] Usuário sem organizações ativas');
                    if (mountedRef.current) {
                        setOrgs([]);
                        setMemberships([]);
                        setActiveOrgIdState(null);
                        setActiveRole(null);
                        setIsLoading(false);
                    }
                    return;
                }

                // Extract memberships and orgs from the combined result
                const cleanMemberships: OrgMembership[] = rawMemberships.map((m: any) => ({
                    org_id: m.org_id,
                    role: m.role,
                    status: m.status,
                }));

                const orgsData: Org[] = rawMemberships
                    .filter((m: any) => m.orgs)
                    .map((m: any) => m.orgs as Org);

                setMemberships(cleanMemberships);
                setOrgs(orgsData);

                // 3. Escolher org ativa
                const saved = getActiveOrgIdLocal();
                const validSaved = cleanMemberships.find((m) => m.org_id === saved);

                const chosenOrgId = validSaved
                    ? validSaved.org_id
                    : cleanMemberships[0].org_id;

                if (mountedRef.current) {
                    setActiveOrgIdState(chosenOrgId);
                    setActiveOrgIdLocal(chosenOrgId);
                }

                // 4. Setar role
                const membership = cleanMemberships.find((m) => m.org_id === chosenOrgId);
                const role = membership?.role || null;

                if (mountedRef.current) {
                    setActiveRole(role);

                    // 5. Sincronizar com AuthContext (Guard against loops)
                    if (role) {
                        updateAuthRoles([role]);
                    }

                    setIsLoading(false);
                }

            } catch (error) {
                if (controller.signal.aborted) return;
                console.error('[OrgContext] Erro ao carregar orgs:', error);
                // Do not retry infinitely. Terminate loading state.
                if (mountedRef.current) setIsLoading(false);
            } finally {
                inFlightRef.current = false;
            }
        };

        // Fetch Logic
        if (lastUserIdRef.current !== currentUserId) {
            lastUserIdRef.current = currentUserId;
            loadOrgs();
        } else {
            // User ID same. If state is stuck in loading for some reason (rare recovery), maybe check?
            // But normally we trust the first load.
        }

    }, [user?.id]); // DEPENDENCY IS NOW PRIMITIVE STRING, NOT OBJECT

    // Atualizar role ao trocar org ativa
    useEffect(() => {
        if (activeOrgId && memberships.length > 0) {
            const membership = memberships.find((m) => m.org_id === activeOrgId);
            const newRole = membership?.role || null;

            // Only update state if different
            if (activeRole !== newRole) {
                setActiveRole(newRole);
                // Sync auth - only if role changed
                if (newRole) {
                    updateAuthRoles([newRole]);
                }
            }
        }
    }, [activeOrgId, memberships]); // updateAuthRoles removed from deps to avoid instability

    const setActiveOrgId = (orgId: string) => {
        const membership = memberships.find((m) => m.org_id === orgId);
        if (!membership) {
            console.error('Org não encontrada nas memberships do usuário');
            return;
        }

        // Cache Isolation: Remove all queries from previous org context
        if (activeOrgId !== orgId) {
            console.log(`[OrgContext] Switching Org ${activeOrgId} -> ${orgId}. Clearing Cache.`);
            queryClient.removeQueries();
        }

        setActiveOrgIdState(orgId);
        setActiveOrgIdLocal(orgId);
        const role = membership.role;
        setActiveRole(role);

        // Sincronizar com AuthContext
        updateAuthRoles([role]);
    };

    return (
        <OrgContext.Provider
            value={{ orgs, activeOrgId, activeRole, setActiveOrgId, isLoading }}
        >
            {children}
        </OrgContext.Provider>
    );
};

export const useOrg = (): OrgContextValue => {
    const context = useContext(OrgContext);
    if (!context) {
        throw new Error('useOrg deve ser usado dentro de OrgProvider');
    }
    return context;
};
