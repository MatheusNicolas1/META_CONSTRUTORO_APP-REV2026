import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ReportPdfColumn = {
  key: string;
  label: string;
};

export type ReportPdfSection = {
  title: string;
  description?: string;
  meta?: Array<{ label: string; value: unknown }>;
  columns?: ReportPdfColumn[];
  rows?: Record<string, unknown>[];
  notes?: string[];
  attachments?: Array<{ name: string; type?: string; base64?: string }>;
};

export type ReportPdfPayload = {
  reportType: string;
  title: string;
  subtitle?: string;
  generatedAt?: string;
  meta?: Array<{ label: string; value: unknown }>;
  sections: ReportPdfSection[];
};

const getFilenameFromDisposition = (contentDisposition: string | null, fallback: string) => {
  if (!contentDisposition) return fallback;
  const match = contentDisposition.match(/filename="?([^"]+)"?/i);
  return match?.[1] || fallback;
};

const fallbackFilename = (reportType: string) => {
  const data = new Date().toISOString().slice(0, 10);
  const tipo = reportType
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
  return `RELATORIO_${tipo || 'GERAL'}_${data}.PDF`;
};

export const useReportPdfDownload = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadReportPdf = async (payload: ReportPdfPayload) => {
    const toastId = toast.loading('Gerando PDF do relatorio...');
    setIsDownloading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const functionUrl = `${supabaseUrl}/functions/v1/generate-rdo-pdf`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/pdf',
      };

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          reportType: payload.reportType,
          report: {
            ...payload,
            generatedAt: payload.generatedAt || new Date().toLocaleString('pt-BR'),
          },
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erro do servidor: ${response.status} - ${text}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        const text = await response.text();
        throw new Error(`Resposta inesperada da Edge Function: ${contentType || 'sem content-type'} - ${text}`);
      }

      const blob = await response.blob();
      const filename = getFilenameFromDisposition(
        response.headers.get('content-disposition'),
        fallbackFilename(payload.reportType)
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);

      toast.success('PDF gerado com sucesso.', { id: toastId });
    } catch (error: any) {
      console.error('Erro ao gerar PDF de relatorio:', error);
      toast.error(`Falha ao gerar PDF: ${error.message}`, { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  return { downloadReportPdf, isDownloading };
};
