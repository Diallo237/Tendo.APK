import { AuthService } from "@/services/auth.service";
import { useUser } from "@/contexts/user-context";
import { loginPathForLocation } from "@/helpers/login-paths";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

function roleHome(role: string): string {
  switch (role) {
    case 'admin': return '/admin';
    case 'fournisseur': return '/supplier';
    case 'gerant_depot': return '/depot-manager';
    case 'client': return '/customer';
    default: return '/';
  }
}

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  // Les hooks doivent être appelés avant tout `return` conditionnel : sinon, à la
  // déconnexion (ou à l'expiration du token) le composant rend moins de hooks
  // qu'au rendu précédent → « Rendered fewer hooks than expected ».
  const { user } = useUser();
  const { pathname } = useLocation();
  const isConnected = AuthService.isAuthenticated();

  if (!isConnected) {
    // Vers la page de connexion de l'espace visé, pas vers l'accueil : c'est ce
    // qui donne le bon comportement à la déconnexion comme à l'expiration.
    return <Navigate to={loginPathForLocation(pathname)} replace />;
  }

  if (allowedRoles && user && !allowedRoles.some((role) => AuthService.hasRole(user, role))) {
    return <Navigate to={roleHome(AuthService.primaryRole(user))} replace />;
  }

  return <>{children}</>;
}
