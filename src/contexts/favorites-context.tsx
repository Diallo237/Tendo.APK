import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useGetFavorites, useToggleFavorite, useSyncFavorites } from '@/services/favorite.service';
import { useUser } from '@/contexts/user-context';

interface FavoritesContextType {
  favorites: number[];
  isFavorite: (productId: number) => boolean;
  toggleFavorite: (productId: number) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const LS_KEY = 'tendo-favorites';
/** Ancienne clé (avant le rebranding) : reprise une fois puis supprimée. */
const LEGACY_LS_KEY = 'diaba-favorites';

function readLocal(): number[] {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored !== null) return JSON.parse(stored);

    const legacy = localStorage.getItem(LEGACY_LS_KEY);
    if (legacy === null) return [];
    localStorage.setItem(LS_KEY, legacy);
    localStorage.removeItem(LEGACY_LS_KEY);
    return JSON.parse(legacy);
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const isAuthenticated = !!user;

  // Favoris locaux (non connecté)
  const [localFavorites, setLocalFavorites] = useState<number[]>(readLocal);

  useEffect(() => {
    if (!isAuthenticated) localStorage.setItem(LS_KEY, JSON.stringify(localFavorites));
  }, [localFavorites, isAuthenticated]);

  // Favoris API (connecté)
  const { data: apiFavorites = [] } = useGetFavorites(isAuthenticated);
  const { mutate: toggleApi } = useToggleFavorite();
  const { mutate: syncApi } = useSyncFavorites();

  // Sync localStorage → Redis une seule fois après connexion
  const synced = useRef(false);
  useEffect(() => {
    if (isAuthenticated && !synced.current) {
      synced.current = true;
      const local = readLocal();
      if (local.length > 0) {
        syncApi(local, {
          onSuccess: () => {
            localStorage.removeItem(LS_KEY);
            setLocalFavorites([]);
          },
        });
      }
    }
    if (!isAuthenticated) synced.current = false;
  }, [isAuthenticated, syncApi]);

  const favorites = isAuthenticated ? apiFavorites : localFavorites;

  const isFavorite = (productId: number) => favorites.includes(productId);

  const toggleFavorite = (productId: number) => {
    if (isAuthenticated) {
      toggleApi(productId);
    } else {
      setLocalFavorites((prev) =>
        prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
      );
    }
  };

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within a FavoritesProvider');
  return context;
}
