import { BarChart3, Command, FileText, Home, MessageSquare, Package, Settings, ShoppingCart, Tags, Truck, Users } from "lucide-react"
import { Link, useLocation } from 'react-router-dom';
import { usePlatformSettings } from '@/services/user.service';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "./user-avatar";
import { useUser } from "@/contexts/user-context";
import { Avatar } from "@radix-ui/react-avatar";




// Menu items par défaut (e-commerce admin)
const sections = [
  { 
    title: "TABLEAU DE BORD", 
    items: [
      { label: "Accueil", icon: Home, path: "/admin/dashboard" },
    ]
  },
  {
    title: "CATALOGUE", 
    items: [
      { icon: Package, label: "Produits", path: "/admin/products" },
      { icon: Tags, label: "Catégories", path: "/admin/categories" },
    ]
  },
  {
    title: "VENTES",
    items: [
      { icon: ShoppingCart, label: "Commandes", path: "/admin/orders" },
      { icon: Users, label: "Clients", path: "/admin/customers" },
      { icon: Truck, label: "Livraisons", path: "/admin/deliveries" }
    ]
  },
  {
    title: "STATISTIQUES & RAPPORTS",
    items: [
      { icon: BarChart3, label: "Statistiques", path: "/admin/statistics" },
      { icon: FileText, label: "Rapports", path: "/admin/reports" }
    ]
  },
  {
    title: "PARAMÈTRES",
    items: [
      { icon: Settings, label: "Paramètres", path: "/admin/settings" },
      { icon: MessageSquare, label: "Messages", path: "/admin/messages" },
    ]
  }
]


export function AppSidebar({itemsProp}: {itemsProp?: typeof sections }) {
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";
    const { user } = useUser();
    const { data: platform } = usePlatformSettings();
    const siteName = platform?.name ?? 'TENDO';
    const siteLogo = platform?.logo ?? null;

    const location = useLocation();
    const isActive: (path: string) => boolean = (path) => location.pathname === path;

  return (
    <Sidebar collapsible="icon">

      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                  {siteLogo
                    ? <img src={siteLogo} alt={siteName} className="w-full h-full object-contain" />
                    : <Command className="size-4" />
                  }
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{siteName}</span>
                  <span className="truncate text-xs text-muted-foreground">E-commerce</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      {/* <div className="border-t border-b border-border" /> */}
      {!isCollapsed && <Separator />}
      <div className={`h-full overflow-y-auto ${!isCollapsed ? 'p-2' : ''}`}>
        <SidebarContent>
          { (itemsProp ?? sections).map((section) => (
            <SidebarGroup key={section.title}>
              {/* Titre de la section */}
              <SidebarGroupLabel>{section.title}</SidebarGroupLabel>

              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.path} className="cursor-pointer">
                      <SidebarMenuButton asChild>
                        <Link 
                          to={item.path} 
                          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all duration-200 ${
                            isActive(item.path) 
                              ? 'bg-primary/10 text-primary font-semibold' 
                              : 'text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground'
                          }`}
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
      </div>

    <div className="bg-inherit md:shadow-inner hover:none pb-3">
      <SidebarFooter>
        {user && <UserAvatar user={user} />}
        {!user && <Avatar className="h-9 w-9" />}
      </SidebarFooter>
      </div>
    </Sidebar>
  )
}