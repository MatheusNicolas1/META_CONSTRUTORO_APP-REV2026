import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRequireOrg } from "@/hooks/requireOrg";
import { validateDocumentUploadFile } from "@/utils/documentUploadValidation";

export type DocumentType = 'Projeto' | 'Licença' | 'Relatório' | 'Memorial' | 'Cronograma' | 'Contrato' | 'Certificado' | 'Laudo' | 'Outros';

export interface Documento {
    id: string;
    nome: string;
    tipo: string; // File extension/MIME or functional type (e.g. 'pdf')
    tamanho: number | null;
    url: string;
    created_at: string;
    uploaded_by: string;
    obra_id: string | null;
    rdo_id: string | null;
    descricao: string | null;
    categoria: string; // Functional category (e.g. 'Projeto')
    // Joins
    obra?: {
        id: string;
        nome: string;
    } | null;
}

interface CreateDocumentData {
    nome: string;
    descricao?: string;
    categoria: string; // The functional type
    obra_id?: string;
    file: File;
}

export const useDocuments = (filters?: { obraId?: string; categoria?: string; search?: string; enabled?: boolean }) => {
    const queryClient = useQueryClient();
    const { orgId } = useRequireOrg();

    const { data: documentos = [], isLoading } = useQuery({
        queryKey: ["documentos", orgId, filters],
        queryFn: async () => {
            if (!orgId) {
                return [];
            }

            let query = supabase
                .from("documentos")
                .select(`
          *,
          obra:obras(id, nome, org_id)
        `)
                .is('deleted_at' as any, null)
                .order("created_at", { ascending: false });

            if (orgId) {
                query = query.eq('org_id', orgId);
            }

            if (filters?.obraId && filters.obraId !== 'all') {
                query = query.eq('obra_id', filters.obraId);
            }
            if (filters?.categoria && filters.categoria !== 'all') {
                query = query.eq('categoria', filters.categoria);
            }
            if (filters?.search) {
                query = query.ilike('nome', `%${filters.search}%`);
            }

            const { data, error } = await query;

            if (error) {
                console.error("Erro ao buscar documentos:", error);
                throw error;
            }

            return (data || []) as unknown as Documento[];
        },
        enabled: filters?.enabled ?? true
    });

    const uploadDocument = useMutation({
        mutationFn: async (data: CreateDocumentData) => {
            if (!orgId) {
                throw new Error("Organizacao ativa obrigatoria para enviar documentos.");
            }

            // ... existing logic ...
            // 1. Upload to Storage
            // Normalize filename to avoid issues
            const fileExt = validateDocumentUploadFile(data.file);

            const safeBaseName = data.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${safeBaseName}`;
            const filePath = `${data.obra_id || 'geral'}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('documentos')
                .upload(filePath, data.file);

            if (uploadError) throw uploadError;

            // 2. Insert into Table
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const { data: doc, error } = await supabase
                .from("documentos")
                .insert({
                    nome: data.nome,
                    tipo: fileExt,
                    categoria: data.categoria,
                    tamanho: data.file.size,
                    url: filePath,
                    uploaded_by: user.id,
                    org_id: orgId,
                    obra_id: data.obra_id || null,
                    descricao: data.descricao
                })
                .select()
                .single();

            if (error) {
                await supabase.storage.from('documentos').remove([filePath]);
                throw error;
            }
            return doc;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["documentos", orgId] });
            toast.success("Documento enviado com sucesso!");
        },
        onError: (error) => {
            console.warn("Erro no upload:", error);
            toast.error(`Erro ao enviar documento: ${error.message}`);
        },
    });

    const deleteDocument = useMutation({
        mutationFn: async (id: string) => {
            if (!orgId) {
                throw new Error("Organizacao ativa obrigatoria para excluir documentos.");
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuario nao autenticado");

            const { error } = await (supabase as any)
                .from("documentos")
                .update({
                    deleted_at: new Date().toISOString(),
                    deleted_by: user.id,
                    delete_origin: "documentos",
                })
                .eq("id", id)
                .eq("org_id", orgId)
                .select("id")
                .single();

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["documentos", orgId] });
            toast.success("Documento movido para a Lixeira. Voce pode restaurar por ate 30 dias.");
        },
        onError: (error) => {
            console.error("Erro ao excluir:", error);
            toast.error("Erro ao excluir documento.");
        },
    });

    const updateDocument = useMutation({
        mutationFn: async ({ id, ...updateData }: { id: string; nome?: string; categoria?: string; descricao?: string }) => {
            if (!orgId) {
                throw new Error("Organizacao ativa obrigatoria para atualizar documentos.");
            }

            const { data, error } = await supabase
                .from("documentos")
                .update(updateData)
                .eq("id", id)
                .eq("org_id", orgId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["documentos", orgId] });
            toast.success("Documento atualizado com sucesso!");
        },
        onError: (error) => {
            console.error("Erro ao atualizar:", error);
            toast.error("Erro ao atualizar documento.");
        },
    });

    return {
        documentos,
        isLoading,
        uploadDocument,
        updateDocument,
        deleteDocument,
    };
};
