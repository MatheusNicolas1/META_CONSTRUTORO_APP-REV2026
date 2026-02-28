/**
 * Utilitário para download de arquivos no lado do cliente.
 * Suporta o download de Blobs ou Strings, garantindo a revogação da URL
 * para evitar vazamentos de memória (memory leaks).
 */
export const downloadFile = (data: Blob | string, filename: string, mimeType?: string) => {
    let blob: Blob;

    if (data instanceof Blob) {
        blob = data;
    } else {
        blob = new Blob([data], { type: mimeType || 'text/plain;charset=utf-8' });
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.setAttribute('download', filename);

    // Ocultar o elemento para evitar efeitos visuais na página
    link.style.display = 'none';
    document.body.appendChild(link);

    link.click();

    // Limpeza de recursos
    document.body.removeChild(link);

    // Pequeno timeout para garantir que o navegador processou o click antes de revogar a URL
    setTimeout(() => {
        window.URL.revokeObjectURL(url);
    }, 100);
};

/**
 * Helper para formatar a data no padrão DD-MM-AAAA
 */
export const formatDownloadDate = (date: Date = new Date()): string => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
};

/**
 * Gera o nome de arquivo padronizado: modulo-identificador-data.extensao
 */
export const generateStandardFilename = (modulo: string, identifier: string | null, extension: string): string => {
    const dateStr = formatDownloadDate();
    const cleanModulo = modulo.toLowerCase().trim().replace(/\s+/g, '-');
    const cleanId = identifier ? `-${identifier.toLowerCase().trim().replace(/\s+/g, '-')}` : '';
    const cleanExt = extension.startsWith('.') ? extension : `.${extension}`;

    return `${cleanModulo}${cleanId}-${dateStr}${cleanExt}`;
};
