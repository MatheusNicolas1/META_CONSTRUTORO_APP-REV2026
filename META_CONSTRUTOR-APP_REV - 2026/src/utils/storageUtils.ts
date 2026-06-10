import { supabase } from '@/integrations/supabase/client';

/** Gera uma URL assinada (temporária) para download de arquivo */
export async function getSignedUrl(path: string, bucket = 'documentos', expiresIn = 60): Promise<string | null> {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, expiresIn);
        if (error) throw error;
        return data?.signedUrl ?? null;
    } catch (err) {
        console.error(`[storageUtils] Erro ao gerar signed URL (${bucket}/${path}):`, err);
        return null;
    }
}

/** Marca um documento como excluído no banco (soft delete) */
export async function deleteDocumento(documentoId: string): Promise<void> {
    const { error } = await supabase
        .from('documentos')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', documentoId);
    if (error) throw new Error(error.message);
}

/** Baixa um arquivo do Storage pelo path e retorna o Blob */
export async function downloadStorageFile(path: string, bucket = 'documentos'): Promise<Blob | null> {
    try {
        const { data, error } = await supabase.storage.from(bucket).download(path);
        if (error) throw error;
        return data;
    } catch (err) {
        console.error(`[storageUtils] Erro ao baixar arquivo (${bucket}/${path}):`, err);
        return null;
    }
}

export function getStoragePath(value: string, bucket = 'documentos'): string {
    if (!value) return value;

    try {
        const decodedValue = decodeURIComponent(value);
        const url = new URL(decodedValue);
        const markers = [
            `/storage/v1/object/public/${bucket}/`,
            `/storage/v1/object/sign/${bucket}/`,
            `/storage/v1/object/authenticated/${bucket}/`,
        ];

        for (const marker of markers) {
            const markerIndex = url.pathname.indexOf(marker);
            if (markerIndex >= 0) {
                return url.pathname.slice(markerIndex + marker.length);
            }
        }
    } catch {
        // Already a storage path, not an absolute URL.
    }

    return value
        .replace(new RegExp(`^/?${bucket}/`), '')
        .replace(/^\/+/, '');
}

/**
 * Gera a URL pública de um arquivo no Storage a partir do path relativo salvo no banco.
 * Usa o helper getStoragePath para normalizar, aceitando tanto paths relativos quanto URLs completas.
 *
 * @param bucket Nome do bucket (ex: 'documentos', 'obras-reais')
 * @param value  Path relativo (ex: 'obra-id/arquivo.pdf') ou URL completa
 * @returns URL pública completa ou null se value for vazio
 */
export function getPublicUrl(value: string, bucket = 'documentos'): string | null {
    if (!value) return null;
    const path = getStoragePath(value, bucket);
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl ?? null;
}

/**
 * Faz o download de um arquivo do Storage para o dispositivo do usuário.
 * Aceita path relativo ou URL completa — normaliza internamente.
 * Imagens são baixadas como .jpg/.png original; PDFs/documentos mantêm extensão.
 *
 * @param bucket   Nome do bucket
 * @param value    Path relativo ou URL completa
 * @param filename Nome sugerido para o arquivo baixado (opcional)
 */
export async function downloadStorageFileToDevice(
    bucket: string,
    value: string,
    filename?: string
): Promise<void> {
    const path = getStoragePath(value, bucket);
    const { data, error } = await supabase.storage.from(bucket).download(path);

    if (error || !data) {
        console.error(`[storageUtils] download error (${bucket}/${path}):`, error?.message);
        throw new Error(error?.message || 'Falha ao baixar o arquivo');
    }

    // Cria um URL temporário e dispara o download
    const blobUrl = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename || path.split('/').pop() || 'arquivo';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
}

/**
 * Abre uma imagem em uma nova aba para visualização em tela cheia.
 * Usa getPublicUrl para garantir URL pública do Supabase Storage.
 */
export function openImageInNewTab(value: string, bucket = 'documentos'): void {
    const url = getPublicUrl(value, bucket);
    if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
}
