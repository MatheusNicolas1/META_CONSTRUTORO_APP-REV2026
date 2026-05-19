import { supabase } from '@/integrations/supabase/client';

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
 * Gera uma URL temporária assinada (signed URL) para um arquivo no Storage.
 * Usar sempre que o bucket for privado — nunca expor path diretamente.
 *
 * @param bucket  Nome do bucket (ex: 'documentos')
 * @param path    Caminho relativo dentro do bucket (ex: '<rdo_id>/arquivo.pdf')
 * @param expiresIn Tempo em segundos (default: 600 = 10 min)
 */
export async function getSignedUrl(
    bucket: string,
    path: string,
    expiresIn = 600
): Promise<string | null> {
    const storagePath = getStoragePath(path, bucket);
    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(storagePath, expiresIn);

    if (error) {
        console.error(`[storageUtils] getSignedUrl error (${bucket}/${storagePath}):`, error.message);
        return null;
    }
    return data?.signedUrl ?? null;
}

export async function downloadStorageFile(
    bucket: string,
    path: string
): Promise<Blob | null> {
    const storagePath = getStoragePath(path, bucket);
    const { data, error } = await supabase.storage.from(bucket).download(storagePath);

    if (error || !data) {
        console.error(`[storageUtils] downloadStorageFile error (${bucket}/${storagePath}):`, error?.message);
        return null;
    }

    return data;
}

/**
 * Remove um arquivo do Storage.
 *
 * @param bucket Nome do bucket
 * @param path   Caminho relativo
 * @returns true se removido com sucesso
 */
export async function deleteStorageFile(bucket: string, path: string): Promise<boolean> {
    const storagePath = getStoragePath(path, bucket);
    const { error } = await supabase.storage.from(bucket).remove([storagePath]);
    if (error) {
        console.error(`[storageUtils] deleteStorageFile error (${bucket}/${storagePath}):`, error.message);
        return false;
    }
    return true;
}

/**
 * Exclui um documento: remove do banco + do Storage.
 *
 * @param docId       UUID do registro na tabela `documentos`
 * @param storagePath Path relativo no bucket (campo `url` do banco)
 * @param bucket      Bucket onde o arquivo está (default: 'documentos')
 * @returns true se ambas as operações tiveram sucesso
 */
export async function deleteDocumento(
    docId: string,
    storagePath: string,
    bucket = 'documentos'
): Promise<boolean> {
    // 1. Remover do banco (RLS garante que só dono ou admin podem deletar)
    const { error: dbError } = await supabase
        .from('documentos')
        .delete()
        .eq('id', docId);

    if (dbError) {
        console.error('[storageUtils] deleteDocumento DB error:', dbError.message);
        return false;
    }

    // 2. Remover do Storage (best-effort: se falhar, loga mas não reverte o banco)
    const storageOk = await deleteStorageFile(bucket, storagePath);
    if (!storageOk) {
        console.warn('[storageUtils] deleteDocumento: arquivo removido do banco mas falhou no Storage.');
    }

    return true;
}

/**
 * Converte um arquivo do Storage para base64 (usado para embutir imagens no PDF).
 *
 * @param bucket Nome do bucket
 * @param path   Caminho relativo
 * @returns string base64 (sem prefixo data:...) ou null em caso de erro
 */
export async function getFileAsBase64(bucket: string, path: string): Promise<string | null> {
    try {
        const storagePath = getStoragePath(path, bucket);
        const { data, error } = await supabase.storage.from(bucket).download(storagePath);
        if (error || !data) {
            console.error('[storageUtils] getFileAsBase64 download error:', error?.message);
            return null;
        }

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                // Remove o prefixo "data:image/...;base64,"
                const base64 = result.split(',')[1] ?? null;
                resolve(base64);
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(data);
        });
    } catch (err) {
        console.error('[storageUtils] getFileAsBase64 unexpected error:', err);
        return null;
    }
}
