import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRequireOrg } from "@/hooks/requireOrg";

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

export const useDocuments = (filters?: { obraId?: string; categoria?: string; search?: string }) => {
    const queryClient = useQueryClient();
    const { orgId } = useRequireOrg();

    const { data: documentos = [], isLoading } = useQuery({
        queryKey: ["documentos", orgId, filters],
        queryFn: async () => {

            let query = supabase
                .from("documentos")
                .select(`
          *,
          obra:obras(id, nome, org_id)
        `)
                .order("created_at", { ascending: false });

            if (orgId) {
                query = query.not('obra_id', 'is', null).filter('obra.org_id', 'eq', orgId);
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

            const filteredData = orgId
                ? data?.filter((d: any) => d.obra?.org_id === orgId)
                : data;

            return (filteredData || []) as unknown as Documento[];
        },
        enabled: true
    });

    const uploadDocument = useMutation({
        mutationFn: async (data: CreateDocumentData) => {
            // ... existing logic ...
            // 1. Upload to Storage
            // Normalize filename to avoid issues
            const fileExt = data.file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${data.obra_id || 'geral'}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('documentos')
                .upload(filePath, data.file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('documentos')
                .getPublicUrl(filePath);

            // 2. Insert into Table
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const { data: doc, error } = await supabase
                .from("documentos")
                .insert({
                    nome: data.nome,
                    tipo: fileExt || 'bin', // The file extension/type
                    categoria: data.categoria, // 'Projeto', 'Licença', etc.
                    tamanho: data.file.size,
                    url: publicUrl,
                    uploaded_by: user.id,
                    obra_id: data.obra_id || null,
                    descricao: data.descricao
                })
                .select()
                .single();

            if (error) throw error;
            return doc;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["documentos", orgId] });
            toast.success("Documento enviado com sucesso!");
        },
        onError: (error) => {
            console.error("Erro no upload:", error);
            toast.error("Erro ao enviar documento.");
        },
    });

    const deleteDocument = useMutation({
        mutationFn: async (id: string) => {
            const { data: doc } = await supabase.from("documentos").select("url").eq("id", id).single();

            if (doc) {
                try {
                    const urlParts = doc.url.split('/documentos/');
                    if (urlParts.length > 1) {
                        const filePath = urlParts[1];
                        await supabase.storage.from('documentos').remove([filePath]);
                    }
                } catch (e) {
                    console.warn("Could not delete file from storage", e);
                }
            }

            const { error } = await supabase
                .from("documentos")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["documentos", orgId] });
            toast.success("Documento excluído!");
        },
        onError: (error) => {
            console.error("Erro ao excluir:", error);
            toast.error("Erro ao excluir documento.");
        },
    });

    return {
        documentos,
        isLoading,
        uploadDocument,
        deleteDocument,
    };
};
