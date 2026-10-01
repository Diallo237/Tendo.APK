import { useAxiosGet } from '@/hooks/use-api';
import { buildApiUrl } from '@/utils/api-client';

export interface Localite {
  id: number;
  name: string;
  code: string;
  type: 'region' | 'departement' | 'commune';
  latitude: string | null;
  longitude: string | null;
}

export const LOCALISATION_KEYS = {
  regions: ['localisation', 'regions'] as const,
  departements: (regionId: number) => ['localisation', 'departements', regionId] as const,
  communes: (depId: number) => ['localisation', 'communes', depId] as const,
};

export function useRegions() {
  return useAxiosGet<Localite[]>(
    LOCALISATION_KEYS.regions,
    buildApiUrl('/localisation/regions/'),
  );
}

export function useDepartements(regionId: number | null) {
  return useAxiosGet<Localite[]>(
    LOCALISATION_KEYS.departements(regionId ?? 0) as readonly unknown[],
    buildApiUrl('/localisation/departements/'),
    regionId ? { params: { region_id: regionId } } : undefined,
    { enabled: !!regionId },
  );
}

export function useCommunes(depId: number | null) {
  return useAxiosGet<Localite[]>(
    LOCALISATION_KEYS.communes(depId ?? 0) as readonly unknown[],
    buildApiUrl('/localisation/communes/'),
    depId ? { params: { departement_id: depId } } : undefined,
    { enabled: !!depId },
  );
}
