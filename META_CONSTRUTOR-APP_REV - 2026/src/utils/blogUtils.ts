export const ARTICLES_PER_PAGE = 6;

export function getPageFromSlug(slug: string | undefined): number {
  const num = Number(slug);
  return Number.isFinite(num) && num >= 1 ? Math.floor(num) : 1;
}

export function getPaginationRange(currentPage: number, totalPages: number): (number | '...')[] {
  const delta = 2;
  const range: (number | '...')[] = [];
  const left = Math.max(2, currentPage - delta);
  const right = Math.min(totalPages - 1, currentPage + delta);

  range.push(1);
  if (left > 2) range.push('...');
  for (let i = left; i <= right; i++) range.push(i);
  if (right < totalPages - 1) range.push('...');
  if (totalPages > 1) range.push(totalPages);

  return range;
}
