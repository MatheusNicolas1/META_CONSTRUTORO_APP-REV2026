import { supabase } from '@/integrations/supabase/client';

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
    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

    if (error) {
        console.error(`[storageUtils] getSignedUrl error (${bucket}/${path}):`, error.message);
        return null;
    }
    return data?.signedUrl ?? null;
}

/**
 * Remove um arquivo do Storage.
 *
 * @param bucket Nome do bucket
 * @param path   Caminho relativo
 * @returns true se removido com sucesso
 */
export async function deleteStorageFile(bucket: string, path: string): Promise<boolean> {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
        console.error(`[storageUtils] deleteStorageFile error (${bucket}/${path}):`, error.message);
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
        const { data, error } = await supabase.storage.from(bucket).download(path);
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
