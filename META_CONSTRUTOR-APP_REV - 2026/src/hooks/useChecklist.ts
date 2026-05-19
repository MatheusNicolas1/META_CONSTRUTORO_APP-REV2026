import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Checklist, ChecklistFilters, ChecklistFormData, ChecklistItem } from "@/types/checklist";
import { useRequireOrg } from "@/hooks/requireOrg";

type ResponsibleProfile = {
    id: string;
    name: string | null;
    email: string | null;
};

const COMPLETED_STATUS = "Conclu\u00eddo";
const NOT_STARTED_STATUS = "N\u00e3o iniciado";
const MEDIUM_PRIORITY = "M\u00e9dia";

const stripUndefined = (payload: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));

const normalizeChecklistItemUpdates = (updates: Record<string, any>) =>
    stripUndefined({
        status: updates.status,
        completed_at: updates.completed_at ?? updates.completedAt,
        completed_by: updates.completed_by ?? updates.completedBy,
        observacoes: updates.observacoes ?? updates.observations,
        prioridade: updates.prioridade ?? updates.priority,
        obrigatorio: updates.obrigatorio ?? updates.isObligatory,
        requer_anexo: updates.requer_anexo ?? updates.requiresAttachment,
        descricao: updates.descricao ?? updates.description,
        titulo: updates.titulo ?? updates.title,
    });

export function useChecklist() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { orgId } = useRequireOrg();

    const loadResponsibleProfiles = async (responsavelIds: string[]) => {
        const uniqueIds = Array.from(new Set(responsavelIds.filter(Boolean)));
        if (uniqueIds.length === 0) return new Map<string, ResponsibleProfile>();

        const { data, error } = await supabase
            .from('profiles')
            .select('id, name, email')
            .in('id', uniqueIds);

        if (error) {
            console.warn('Erro ao buscar responsaveis dos checklists:', error.message);
            return new Map<string, ResponsibleProfile>();
        }

        return new Map((data || []).map((profile) => [profile.id, profile as ResponsibleProfile]));
    };

    const calculateProgress = (items: any[]) => {
        if (!items.length) return { total: 0, completed: 0, percentage: 0 };
        const completed = items.filter((item) => item.status === COMPLETED_STATUS).length;
        return {
            total: items.length,
            completed,
            percentage: Math.round((completed / items.length) * 100)
        };
    };

    const mapChecklistItem = (item: any): ChecklistItem => ({
        id: item.id,
        title: item.titulo,
        description: item.descricao,
        priority: item.prioridade,
        status: item.status,
        isObligatory: item.obrigatorio,
        requiresAttachment: item.requer_anexo,
        observations: item.observacoes,
        completedAt: item.completed_at,
        completedBy: item.completed_by,
        attachments: []
    });

    const mapChecklist = (item: any, responsibleMap: Map<string, ResponsibleProfile>): Checklist => {
        const responsible = responsibleMap.get(item.responsavel_id);

        return {
            id: item.id,
            title: item.titulo,
            description: item.descricao,
            category: item.categoria,
            status: item.status,
            dueDate: item.data_vencimento,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            startedAt: item.started_at,
            completedAt: item.completed_at,
            signature: item.signature_data ? {
                id: item.id,
                signerName: item.signature_name || '',
                signerEmail: item.signature_email || '',
                signedAt: item.signed_at || item.data_aprovacao || item.updated_at,
                signatureData: item.signature_data,
            } : undefined,
            obra: { id: item.obras?.id, name: item.obras?.nome },
            responsible: responsible ? {
                id: responsible.id,
                name: responsible.name || 'N/A',
                email: responsible.email || '',
                role: 'Respons\u00e1vel'
            } : { id: item.responsavel_id || '', name: 'N/A', email: '', role: '' },
            items: (item.checklist_items || []).map(mapChecklistItem),
            progress: calculateProgress(item.checklist_items || [])
        };
    };

    const fetchChecklists = async (filters?: ChecklistFilters) => {
        let query = supabase
            .from('checklists')
            .select(`
        *,
        obras (id, nome),
        checklist_items (*)
      `)
            .eq('org_id', orgId)
            .order('created_at', { ascending: false });

        if (filters) {
            if (filters.search) {
                query = query.ilike('titulo', `%${filters.search}%`);
            }
            if (filters.category && filters.category !== 'all') {
                query = query.eq('categoria', filters.category);
            }
            if (filters.status && filters.status !== 'all') {
                query = query.eq('status', filters.status);
            }
            if (filters.obra && filters.obra !== 'all') {
                query = query.eq('obra_id', filters.obra);
            }
            if (filters.responsible && filters.responsible !== 'all') {
                query = query.eq('responsavel_id', filters.responsible);
            }
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching checklists:', error);
            throw error;
        }

        const responsibleMap = await loadResponsibleProfiles((data || []).map((item: any) => item.responsavel_id));
        return (data || []).map((item: any) => mapChecklist(item, responsibleMap));
    };

    const useChecklistsQuery = (filters?: ChecklistFilters) => useQuery({
        queryKey: ['checklists', orgId, filters],
        queryFn: () => fetchChecklists(filters),
        enabled: !!orgId
    });

    const fetchChecklist = async (id: string) => {
        const { data, error } = await supabase
            .from('checklists')
            .select(`
        *,
        obras (id, nome),
        checklist_items (
            *,
            documentos (*)
        )
      `)
            .eq('id', id)
            .single();

        if (error) throw error;

        const responsibleMap = await loadResponsibleProfiles([data.responsavel_id]);
        const responsible = responsibleMap.get(data.responsavel_id);

        return {
            id: data.id,
            title: data.titulo,
            description: data.descricao,
            category: data.categoria,
            status: data.status,
            dueDate: data.data_vencimento,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            startedAt: data.started_at,
            completedAt: data.completed_at,
            signature: data.signature_data ? {
                id: data.id,
                signerName: data.signature_name || '',
                signerEmail: data.signature_email || '',
                signedAt: data.signed_at || data.data_aprovacao || data.updated_at,
                signatureData: data.signature_data,
            } : undefined,
            obra: { id: data.obras?.id, name: data.obras?.nome },
            responsible: responsible ? {
                id: responsible.id,
                name: responsible.name || 'N/A',
                email: responsible.email || '',
                role: 'Respons\u00e1vel'
            } : { id: data.responsavel_id || '', name: 'N/A', email: '', role: '' },
            items: (data.checklist_items?.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)) || []).map((item: any) => ({
                ...mapChecklistItem(item),
                attachments: (item.documentos || []).map((documento: any) => ({
                    id: documento.id,
                    name: documento.nome,
                    url: documento.url,
                    type: documento.tipo,
                    size: documento.tamanho,
                    uploadedAt: documento.created_at,
                    uploadedBy: documento.uploaded_by
                }))
            })),
            progress: calculateProgress(data.checklist_items || [])
        } as Checklist;
    };

    const useChecklistDetail = (id: string) => useQuery({
        queryKey: ['checklist', id],
        queryFn: () => fetchChecklist(id),
        enabled: !!id
    });

    const createChecklist = useMutation({
        mutationFn: async (formData: ChecklistFormData) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data: checklist, error: checklistError } = await supabase
                .from('checklists')
                .insert({
                    org_id: orgId,
                    obra_id: formData.obraId,
                    responsavel_id: formData.responsibleId || user.id,
                    titulo: formData.title,
                    descricao: formData.description,
                    categoria: formData.category,
                    data_vencimento: formData.dueDate,
                    status: 'Rascunho'
                })
                .select()
                .single();

            if (checklistError) throw checklistError;

            if (formData.items && formData.items.length > 0) {
                const itemsToInsert = formData.items.map((item) => ({
                    checklist_id: checklist.id,
                    titulo: item.title,
                    descricao: item.description || null,
                    prioridade: item.priority || MEDIUM_PRIORITY,
                    status: NOT_STARTED_STATUS,
                    obrigatorio: item.isObligatory || false,
                    requer_anexo: item.requiresAttachment || false
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
        mutationFn: async ({ itemId, updates }: { itemId: string, updates: Record<string, any> }) => {
            const { error } = await supabase
                .from('checklist_items')
                .update(normalizeChecklistItemUpdates(updates) as any)
                .eq('id', itemId);

            if (error) throw error;
        },
        onSuccess: () => {
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

    const uploadChecklistItemAttachment = useMutation({
        mutationFn: async ({ itemId, file, checklistId }: { itemId: string, file: File, checklistId: string }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuario nao autenticado");

            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `checklists/${checklistId}/${itemId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('documentos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('documentos')
                .getPublicUrl(filePath);

            const { data: doc, error } = await supabase
                .from("documentos")
                .insert({
                    nome: file.name,
                    tipo: fileExt || 'bin',
                    categoria: 'Evidencia Checklist',
                    tamanho: file.size,
                    url: publicUrl,
                    uploaded_by: user.id,
                    org_id: orgId,
                    checklist_item_id: itemId
                })
                .select()
                .single();

            if (error) throw error;
            return doc;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['checklist'] });
            toast({ title: "Sucesso", description: "Evidencia anexada com sucesso." });
        },
        onError: (error) => {
            console.error("Erro no upload da evidencia:", error);
            toast({ title: "Erro", description: "Erro ao anexar evidencia.", variant: "destructive" });
        }
    });

    return {
        useChecklistsQuery,
        useChecklistDetail,
        createChecklist,
        updateChecklistItem,
        deleteChecklist,
        uploadChecklistItemAttachment
    };
}
