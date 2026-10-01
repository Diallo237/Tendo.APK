import type { ApiError, ApiResponse, UrlParams } from '@/types';
import axios, { type AxiosResponse, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { AuthService } from '@/services/auth.service';

// Type étendu pour gérer le retry
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// ================================
// CLASSE API CLIENT 
// ================================

class ApiClient {
  private client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',  // import.meta.env est l'objet qui contient toutes les variables d'environnement dans un projet Vite
    timeout: 15000,
    withCredentials: true,  // envoie/reçoit les cookies (ex: anon_id pour le suivi visiteur)
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  private isRefreshing = false; // indique si une requête de refresh token est déjà en cours.
  private failedQueue: Array<{   // liste des requêtes qui ont échoué (401) pendant que le token est en cours de rafraîchissement.Ces requêtes seront relancées après le refresh réussi.
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor() {
    this.setupInterceptors();
  }

  private processQueue(error: any, token: string | null = null): void {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });

    this.failedQueue = [];
  }

  private async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || '/api'}/auth/jwt/refresh/`,
        { refresh: refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      const newAccessToken = response.data.access;
      
      // Mettre à jour le token d'accès dans le localStorage
      AuthService.setAuthToken({ access: newAccessToken, refresh: refreshToken }, 'access');
      
      return newAccessToken;
    } catch (error) {
      // Si le refresh échoue avec 401, le refresh token est expiré
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // console.log('Refresh token expiré, déconnexion automatique');
        AuthService.handleUnauthorized();
      }
      throw error;
    }
  }

  private setupInterceptors(): void {
    // Intercepteur pour les requêtes
    this.client.interceptors.request.use(
      (config) => {
        const token = AuthService.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error) => {
        // console.error('[API Request Error]', error);
        return Promise.reject(error);
      }
    );

    // Intercepteur pour les réponses
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        const originalRequest: ExtendedAxiosRequestConfig = error.config;

        // Si erreur 401 et que ce n'est pas déjà une tentative de retry
        if (error.response?.status === 401 && !originalRequest._retry) {
          
          // Ne pas essayer de refresh sur les endpoints d'authentification (login/signup)
          const isLoginEndpoint = originalRequest.url?.includes('/auth/jwt/create/');
          const isSignupEndpoint = originalRequest.url?.includes('/auth/users/') && 
                                   originalRequest.method?.toLowerCase() === 'post';
          const isRefreshEndpoint = originalRequest.url?.includes('/auth/jwt/refresh/');
          
          const isAuthEndpoint = isLoginEndpoint || isSignupEndpoint || isRefreshEndpoint;
          
          if (isAuthEndpoint) {
            // Pour les endpoints de login/signup/refresh, rejeter directement
            return Promise.reject(this.formatError(error));
          }

          // Vérifier si un refresh token existe avant de tenter le refresh
          const hasRefreshToken = !!localStorage.getItem('refreshToken');
          
          if (!hasRefreshToken) {
            // Pas de refresh token, l'utilisateur n'est pas connecté
            // Ne pas tenter de refresh, rejeter directement
            return Promise.reject(this.formatError(error));
          }

          // Marquer la requête comme retryée
          originalRequest._retry = true;

          if (this.isRefreshing) {
            // Si un refresh est déjà en cours, mettre la requête en file d'attente
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
            // Quand la Promise sera résolue, on aura le nouveau token
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.client(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          this.isRefreshing = true;

          try {
            const newToken = await this.refreshToken();
            
            // Mettre à jour le header de la requête originale
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            
            // Traiter toutes les requêtes en attente
            this.processQueue(null, newToken);
            
            // Réessayer la requête originale
            return this.client(originalRequest);
          } catch (refreshError) {
            // Si le refresh échoue, rejeter toutes les requêtes en attente
            this.processQueue(refreshError, null);
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Pour les autres erreurs, utiliser le formatage d'erreur habituel
        return Promise.reject(this.formatError(error));
      }
    );
  }

  private formatError(error: any): ApiError {
    return {
      message: error.response?.data?.message || error.message || 'Une erreur est survenue',
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
      details: error.response?.data
    };
  }

  // Méthodes HTTP typées
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.client.get<ApiResponse<T>>(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.client.post<ApiResponse<T>>(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.client.put<ApiResponse<T>>(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.client.patch<ApiResponse<T>>(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.client.delete<ApiResponse<T>>(url, config);
  }
}

/*
  Fonction pour construire une URL avec des paramètres dynamiques
  Exemple:
    const url = buildApiUrl('/products/{productId}/reviews/{reviewId}', { productId: 123, reviewId: 456 });
    // Résultat: '/products/123/reviews/456'
*/
export const buildApiUrl = (endpoint: string, params: UrlParams = {}): string => {
  let url = endpoint;

  // Remplacer les paramètres dans l'URL (ex: {regionId})
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`{${key}}`, String(value));
  });
  
  return url;
}

// Instance singleton
export const apiClient = new ApiClient();

// Export par défaut de l'instance API
export default apiClient;
