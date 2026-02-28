import { useState } from 'react';
import { toast } from 'sonner';
import { downloadFile } from '@/utils/downloadHelper';

interface UseDownloadOptions {
    onSuccess?: () => void;
    onError?: (error: any) => void;
}

/**
 * Hook para gerenciar o estado de download com feedback visual.
 */
export const useDownload = (options?: UseDownloadOptions) => {
    const [isLoading, setIsLoading] = useState(false);

    const startDownload = async (
        downloadPromise: Promise<Blob | string | void>,
        filename: string,
        mimeType?: string
    ) => {
        setIsLoading(true);
        try {
            const result = await downloadPromise;

            // Se a promise retornar void, assumimos que o download já foi tratado
            // ou que houve algum erro silencioso (embora o try-catch deva pegar).
            if (result) {
                downloadFile(result, filename, mimeType);
                toast.success("Download iniciado com sucesso");
                options?.onSuccess?.();
            }
        } catch (error) {
            console.error("Erro durante o download:", error);
            toast.error("Erro ao gerar arquivo para download");
            options?.onError?.(error);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        startDownload
    };
};
