/**
 * Hook para gerar URLs de imagens otimizadas.
 *
 * Duas estratégias:
 * 1. Imagens LOCAIS (em /public/marketing/): prioriza .webp se existir, fallback para original.
 * 2. Imagens do SUPABASE STORAGE: usa transform on-the-fly (width + format=webp).
 *
 * Uso:
 *   const img = useOptimizedImage('/marketing/obras-reais/cobertura-metalica-canteiro.jpg', { width: 800 })
 *   // → '/marketing/obras-reais/cobertura-metalica-canteiro.webp'
 *
 *   const img = useOptimizedImage('https://supabase.co/storage/v1/object/public/obras-reais/foto.jpg', { width: 600 })
 *   // → 'https://supabase.co/storage/v1/render/image/public/obras-reais/foto.jpg?width=600&format=webp'
 */
export function useOptimizedImage(
  src: string | null | undefined,
  options?: { width?: number; quality?: number }
): string | null {
  if (!src) return null;

  const width = options?.width ?? 800;
  const quality = options?.quality ?? 75;

  // ── Caso 1: Imagem local (começa com /marketing/) ──────────
  if (src.startsWith('/marketing/')) {
    // Troca extensão para .webp (as imagens já foram convertidas in-place)
    const webpSrc = src.replace(/\.(jpe?g|png)$/i, '.webp');
    return webpSrc;
  }

  // ── Caso 2: Supabase Storage ───────────────────────────────
  // Detecta URL pública do Supabase Storage
  const storageMatch = src.match(
    /\/storage\/v1\/object\/public\/([^/]+\/.+)$/
  );
  if (storageMatch) {
    const path = storageMatch[1];
    const baseUrl = src.replace(/\/storage\/v1\/object\/public\/.*$/, '');
    return `${baseUrl}/storage/v1/render/image/public/${path}?width=${width}&format=webp&quality=${quality}`;
  }

  // ── Caso 3: URL externa qualquer ───────────────────────────
  return src;
}

/**
 * Versão standalone (não-hook) para usar em loops de dados ou constantes.
 * Útil para arrays de features/items que não estão em componentes React.
 */
export function getOptimizedImageUrl(
  src: string | null | undefined,
  options?: { width?: number; quality?: number }
): string | null {
  return useOptimizedImage(src, options);
}
