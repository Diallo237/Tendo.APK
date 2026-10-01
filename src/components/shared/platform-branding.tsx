import { useEffect } from 'react';

import { usePlatformSettings } from '@/services/user.service';
import { getImageUrl } from '@/utils/image';

/** Valeurs de repli, identiques à celles écrites en dur dans index.html. */
const NOM_PAR_DEFAUT = 'Tendo';
const ICONE_PAR_DEFAUT = '/logo-tendo.png';

/** Met à jour (ou crée) une balise <link rel="..."> du document. */
function definirIcone(rel: string, href: string) {
  let lien = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!lien) {
    lien = document.createElement('link');
    lien.rel = rel;
    document.head.appendChild(lien);
  }
  if (lien.href !== href) lien.href = href;
}

/**
 * Aligne l'onglet du navigateur sur les paramètres de la plateforme : le titre
 * suit le nom, l'icône suit le logo téléversé dans l'espace d'administration.
 *
 * Sans cela, le nom et l'icône restaient figés dans index.html au moment du
 * build, et ne changeaient donc pas quand on modifiait le logo dans l'admin.
 *
 * Ne rend rien : c'est un effet de bord sur <head>.
 */
export function PlatformBranding() {
  const { data: platform } = usePlatformSettings();

  useEffect(() => {
    const nom = platform?.name?.trim() || NOM_PAR_DEFAUT;
    if (document.title !== nom) document.title = nom;

    // `updated_at` sert de numéro de version : sans lui, le navigateur garde
    // l'ancienne icône en cache très longtemps après un changement de logo.
    const version = platform?.updated_at ? `?v=${encodeURIComponent(platform.updated_at)}` : '';
    const icone = platform?.logo ? `${getImageUrl(platform.logo)}${version}` : ICONE_PAR_DEFAUT;

    definirIcone('icon', icone);
    definirIcone('shortcut icon', icone);
    definirIcone('apple-touch-icon', icone);
  }, [platform?.name, platform?.logo, platform?.updated_at]);

  return null;
}
