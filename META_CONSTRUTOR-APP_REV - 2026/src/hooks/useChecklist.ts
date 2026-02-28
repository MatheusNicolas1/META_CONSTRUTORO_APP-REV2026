import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Checklist, ChecklistFilters, ChecklistFormData, ChecklistItem } from "@/types/checklist";
import { useRequireOrg } from "@/hooks/requireOrg";

export function useChecklist() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { orgId } = useRequireOrg();

    // Fetch Checklists
    const fetchChecklists = async (filters?: ChecklistFilters) => {
        let query = supabase
            .from('checklists')
            .select(`
        *,
        obras (id, nome),
        checklist_items (*),
        responsible:responsible_id (id, nome, email)
      `)
            .eq('org_id', orgId)
            .order('created_at', { ascending: false });

        if (filters) {
            if (filters.search) {
                query = query.ilike('title', `%${filters.search}%`);
            }
            if (filters.category && filters.category !== 'all') {
                query = query.eq('category', filters.category);
            }
            if (filters.status && filters.status !== 'all') {
                query = query.eq('status', filters.status);
            }
            if (filters.obra && filters.obra !== 'all') {
                query = query.eq('obra_id', filters.obra);
            }
            if (filters.responsible && filters.responsible !== 'all') {
                query = query.eq('responsible_id', filters.responsible);
            }
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching checklists:', error);
            throw error;
        }

        // Map to frontend type
        const mapChecklist = (item: any): Checklist => ({
            id: item.id,
            title: item.title,
            description: item.description,
            category: item.category,
            status: item.status,
            dueDate: item.due_date,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            startedAt: item.started_at,
            completedAt: item.completed_at,
            obra: { id: item.obras?.id, name: item.obras?.nome },
            responsible: item.responsible ? { ...item.responsible, role: 'Responsável' } : { id: '', name: 'N/A', email: '', role: '' },
            items: (item.checklist_items || []).map((i: any) => ({
                id: i.id,
                title: i.title,
                description: i.description,
                priority: i.priority,
                status: i.status,
                isObligatory: i.is_obligatory,
                requiresAttachment: i.requires_attachment,
                observations: i.observations,
                completedAt: i.completed_at,
                completedBy: i.completed_by,
                attachments: [] // Attachments logic to be implemented
            })),
            progress: calculateProgress(item.checklist_items || [])
        });

        return data.map(mapChecklist);
    };

    const calculateProgress = (items: any[]) => {
        if (!items.length) return { total: 0, completed: 0, percentage: 0 };
        const completed = items.filter(i => i.status === 'Concluído').length;
        return {
            total: items.length,
            completed,
            percentage: Math.round((completed / items.length) * 100)
        };
    };

    const checklistsQuery = (filters?: ChecklistFilters) => useQuery({
        queryKey: ['checklists', orgId, filters],
        queryFn: () => fetchChecklists(filters),
        enabled: !!orgId
    });

    // Fetch Single Checklist
    const fetchChecklist = async (id: string) => {
        const { data, error } = await supabase
            .from('checklists')
            .select(`
        *,
        obras (id, nome),
        checklist_items (*),
        responsible:responsible_id (id, nome, email)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;

        return {
            id: data.id,
            title: data.title,
            description: data.description,
            category: data.category,
            status: data.status,
            dueDate: data.due_date,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            startedAt: data.started_at,
            completedAt: data.completed_at,
            obra: { id: data.obras?.id, name: data.obras?.nome },
            responsible: data.responsible ? {
                id: (data.responsible as any).id,
                name: (data.responsible as any).nome,
                email: (data.responsible as any).email,
                role: 'Responsável'
            } : { id: '', name: 'N/A', email: '', role: '' },
            items: (data.checklist_items?.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)) || []).map((i: any) => ({
                id: i.id,
                title: i.title,
                description: i.description,
                priority: i.priority,
                status: i.status,
                isObligatory: i.is_obligatory,
                requiresAttachment: i.requires_attachment,
                observations: i.observations,
                completedAt: i.completed_at,
                completedBy: i.completed_by,
                attachments: []
            })),
            progress: calculateProgress(data.checklist_items || [])
        } as Checklist;
    };

    const useChecklistDetail = (id: string) => useQuery({
        queryKey: ['checklist', id],
        queryFn: () => fetchChecklist(id),
        enabled: !!id
    });

    // Mutations
    const createChecklist = useMutation({
        mutationFn: async (formData: ChecklistFormData) => {
            // 1. Get current user's org
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data: orgMember } = await supabase
                .from('organization_members')
                .select('organization_id')
                .eq('user_id', user.id)
                .single();

            if (!orgMember) throw new Error('User not in an organization');

            // 2. Create Checklist
            const { data: checklist, error: checklistError } = await supabase
                .from('checklists')
                .insert({
                    org_id: orgMember.organization_id,
                    obra_id: formData.obraId,
                    responsible_id: formData.responsibleId,
                    title: formData.title,
                    description: formData.description,
                    category: formData.category,
                    due_date: formData.dueDate,
                    status: 'Rascunho' // Default
                })
                .select()
                .single();

            if (checklistError) throw checklistError;

            // 3. Create Items
            if (formData.items && formData.items.length > 0) {
                const itemsToInsert = formData.items.map((item, index) => ({
                    checklist_id: checklist.id,
                    title: item.title,
                    priority: item.priority || 'Média',
                    status: 'Não iniciado',
                    order: index,
                    is_obligatory: item.isObligatory || false,
                    requires_attachment: item.requiresAttachment || false
                }));

                const { error: itemsError } = await supabase
                    .from('checklist_items')
                    .insert(itemsToInsert);

                if (itemsError) throw itemsError;
            }

            return checklist;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['checklists', orgId] });
            toast({ title: "Sucesso", description: "Checklist criado com sucesso." });
        },
        onError: (error) => {
            toast({ title: "Erro", description: "Erro ao criar checklist: " + error.message, variant: "destructive" });
        }
    });

    const updateChecklistItem = useMutation({
        mutationFn: async ({ itemId, updates }: { itemId: string, updates: any }) => {
            const { error } = await supabase
                .from('checklist_items')
                .update(updates)
                .eq('id', itemId);

            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['checklists', orgId] });
            queryClient.invalidateQueries({ queryKey: ['checklist'] });
        },
        onError: (error) => {
            toast({ title: "Erro", description: "Erro ao atualizar item: " + error.message, variant: "destructive" });
        }
    });

    const deleteChecklist = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('checklists').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['checklists', orgId] });
            toast({ title: "Sucesso", description: "Checklist removido." });
        }
    });

    return {
        checklistsQuery,
        useChecklistDetail,
        createChecklist,
        updateChecklistItem,
        deleteChecklist
    };
}
