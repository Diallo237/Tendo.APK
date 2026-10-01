const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400';

const getBaseUrl = (): string =>
  import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin;

export function getImageUrl(imagePath: string | string[] | undefined): string {
  if (!imagePath) return DEFAULT_IMAGE;
  const path = Array.isArray(imagePath) ? imagePath[0] : imagePath;
  if (!path) return DEFAULT_IMAGE;
  if (path.startsWith('http')) return path;
  return `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}
