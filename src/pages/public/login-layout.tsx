import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { usePlatformSettings } from '@/services/user.service';

interface LoginLayoutProps {
  /** Icône de l'espace (Store, ShieldCheck…). */
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
  /** Liens vers les autres espaces de connexion. */
  footer?: ReactNode;
}

/**
 * Mise en page commune aux trois pages de connexion (client, fournisseur,
 * administration) : logo de la plateforme, carte centrée, retour à la boutique.
 */
export function LoginLayout({ icon, title, description, children, footer }: LoginLayoutProps) {
  const { data: platform } = usePlatformSettings();
  const siteName = platform?.name ?? 'Tendo';

  return (
    <div className="relative min-h-screen bg-muted/30 flex flex-col items-center justify-center px-4 py-10">
      {/* Bascule clair / sombre, en haut à droite */}
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          {platform?.logo ? (
            <img src={platform.logo} alt={siteName} className="h-12 w-auto object-contain" />
          ) : (
            <span className="text-2xl font-bold tracking-tight">{siteName}</span>
          )}
        </div>

        <Card className="shadow-sm">
          <CardHeader className="space-y-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              {icon}
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {children}
            {footer && <div className="border-t pt-4 text-sm text-muted-foreground">{footer}</div>}
          </CardContent>
        </Card>

        <div className="text-center">
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            Retour à la boutique
          </Link>
        </div>
      </div>
    </div>
  );
}
