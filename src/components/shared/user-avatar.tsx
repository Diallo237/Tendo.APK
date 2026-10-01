import {
  Bell,
  ChevronsUpDown,
  CreditCard,
  Heart,
  LogOut,
  Package,
  Settings,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import type { Users } from "@/types/user"
import { Button } from "../ui/button"
import { AuthService, useLogout } from "@/services/auth.service"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { SpaceSwitcherItems } from "@/components/shared/space-switcher"

const initials = (User: Users) => {
    return (
        (User?.first_name?.charAt(0) || '') + 
        (User?.last_name?.charAt(0) || '')
    ).toUpperCase();
}

/** Réglages de l'espace courant : un compte peut cumuler client et fournisseur. */
const getSettingsPath = (user: Users) => {
  const role = AuthService.primaryRole(user);
  if (role === 'admin') return '/admin/settings';
  if (role === 'fournisseur') return '/supplier/settings';
  if (role === 'gerant_depot') return '/depot-manager/settings';
  return '/customer/settings';
};

export function UserAvatar({user}: {user:Users}) {
  // Hook appelé À L'INTÉRIEUR du composant
  const logout = useLogout();

  const handleLogout = () => {
    toast.success('Déconnexion réussie');
    logout();
  };
  const { isMobile } = useSidebar()

  const navigate = useNavigate();

    // Pas d'utilisateur : on n'affiche rien. La redirection est du ressort de
    // AuthGuard et de la déconnexion — sinon elle écrasait leur destination.
    if (!user) {
      return null;
    }

  // Déterminer le chemin de profil selon le rôle

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.profile.avatar} alt={user.full_name} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                    {initials(user)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.full_name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.profile.avatar} alt={user.full_name} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {initials(user)}
                </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.full_name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            {/* <DropdownMenuSeparator /> */}
            {/* <DropdownMenuGroup> */}
              {/* <DropdownMenuItem>
                <Sparkles />
                Upgrade to Pro
              </DropdownMenuItem> */}
            {/* </DropdownMenuGroup> */}
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate(getSettingsPath(user))}>
                    <Settings className="mr-2 size-4" />
                    <span>Mon compte</span>
                </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                Paiements
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <SpaceSwitcherItems user={user} />
            <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 size-4" />
                  <span>Déconnexion</span>
              </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function UserAvatarHeader({user}: {user: Users | null}) {
    
    const navigate = useNavigate();

    const logout = useLogout();

    const handleLogout = () => {
      toast.success('Déconnexion réussie');
      logout();
    };

    // Pas d'utilisateur : on n'affiche rien. La redirection est du ressort de
    // AuthGuard et de la déconnexion — sinon elle écrasait leur destination.
    if (!user) {
      return null;
    }

    // Générer les initiales à partir du nom complet


    // Traduire le rôle en français
    // const getRoleBadge = (role: string) => {
    //     const roles: Record<string, string> = {
    //         'admin': 'Administrateur',
    //         'fournisseur': 'Fournisseur',
    //         'client': 'Client',
    //     };
    //     return roles[role] || role;
    // };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                    {user?.profile.avatar && <AvatarImage src={user?.profile.avatar} alt={user?.full_name} />}
                    <AvatarFallback className="bg-primary text-primary-foreground">
                    {initials(user)}
                    </AvatarFallback>
                </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.full_name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(getSettingsPath(user))}>
                    <Settings className="mr-2 size-4" />
                    <span>Mon compte</span>
                </DropdownMenuItem>

                {AuthService.hasRole(user, 'client') &&
                <DropdownMenuItem onClick={() => navigate('/customer/orders')}>
                    <Package className="mr-2 size-4" />
                    <span>Mes Commandes</span>
                </DropdownMenuItem>
                }   

                {AuthService.hasRole(user, 'client') && 
                <DropdownMenuItem onClick={() => navigate('/customer/favorites')}>
                    <Heart className="mr-2 size-4" />
                    <span>Mes Favoris</span>
                </DropdownMenuItem>}
                <SpaceSwitcherItems user={user} />
                <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 size-4" />
                    <span>Déconnexion</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
