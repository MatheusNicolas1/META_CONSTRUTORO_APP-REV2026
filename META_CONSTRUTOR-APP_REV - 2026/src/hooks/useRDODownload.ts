import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useRDODownload = () => {
    const [isProcessing, setIsProcessing] = useState(false);

    /**
     * Dispara a requisição para a Edge Function que gera e retorna o PDF do RDO.
     *
     * @param rdoId - UUID do RDO a ser baixado
     */
    const downloadRDO = async (rdoId: string) => {
        const toastId = toast.loading('Gerando PDF do RDO (pode levar alguns segundos)...');
        setIsProcessing(true);
        try {
            // Obter token do usuário atual para autenticar
            const { data: { session } } = await supabase.auth.getSession();

            // Fazer a chamada usando fetch nativo para capturar o Blob com segurança
            // pois supabase.functions.invoke pode tentar fazer parse como JSON
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
            const functionUrl = `${supabaseUrl}/functions/v1/generate-rdo-pdf`;

            const reqHeaders: Record<string, string> = {
                'Content-Type': 'application/json',
                Accept: 'application/pdf',
            };

            if (session?.access_token) {
                reqHeaders['Authorization'] = `Bearer ${session.access_token}`;
            }

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: reqHeaders,
                body: JSON.stringify({ rdoId })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro do servidor: ${response.status} - ${errorText}`);
            }

            const contentType = response.headers.get('content-type');
            const contentDisposition = response.headers.get('content-disposition');
            let filename = `RDO-${rdoId.substring(0, 8)}.pdf`;

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace('.html', '.pdf');
                }
            }

            if (!contentType || !contentType.includes('application/pdf')) {
                const errorText = await response.text();
                throw new Error(`Resposta inesperada da Edge Function: ${contentType || 'sem content-type'} - ${errorText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('PDF gerado com sucesso!', { id: toastId });

        } catch (err: any) {
            console.error('Erro ao baixar PDF do RDO:', err);
            toast.error(`Falha ao gerar PDF: ${err.message}`, { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    return { downloadRDO, isDownloading: isProcessing };
};
