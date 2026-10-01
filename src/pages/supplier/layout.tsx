import { AppHeader } from "@/components/shared/app-header";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import {
  Home,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  MessageSquare,
  FileText,
  Tags
} from "lucide-react";
import { Outlet } from "react-router-dom";


export default function SupplierLayout() {
    const sections = [
        { 
            title: "TABLEAU DE BORD", 
            items: [
                { label: "Accueil", icon: Home, path: "/supplier" },
            ]
        },
        {
            title: "MES PRODUITS",
            items: [
                { icon: Tags, label: "Catégories", path: "/supplier/categories" },
                { icon: Package, label: "Catalogue", path: "/supplier/products" },
            ]
        },
        {
            title: "VENTES",
            items: [
                { icon: ShoppingCart, label: "Commandes", path: "/supplier/orders" },
            ]
        },
        {
            title: "STATISTIQUES",
            items: [
                { icon: BarChart3, label: "Statistiques", path: "/supplier/statistics" },
                { icon: FileText, label: "Rapports", path: "/supplier/reports" }
            ]
        },
        {
            title: "PARAMÈTRES",
            items: [
                { icon: Settings, label: "Mon compte", path: "/supplier/settings" },
                { icon: MessageSquare, label: "Messages", path: "/supplier/messages" },
            ]
        }
    ];
    
    return (
        <SidebarProvider>
            <AppSidebar itemsProp={sections} />
            <SidebarInset>
                <AppHeader />
                <main className="flex flex-1 flex-col py-6">
                    <Outlet />
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}