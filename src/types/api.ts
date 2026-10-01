// Interface pour la configuration d'un service
export interface ServiceConfig {
  readonly baseURL: string;
  readonly basePath: string;
  readonly endpoints: Record<string, string>;
}

// Types pour les réponses API standardisées
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  // status: 'success' | 'error';
}

// Interface pour les réponses paginées (Django REST Framework)
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Interface pour les erreurs API
export interface ApiError {
  message: string;
  code: string;
  details?: any;
}

// Type pour les paramètres d'URL
export type UrlParams = Record<string, string | number>;