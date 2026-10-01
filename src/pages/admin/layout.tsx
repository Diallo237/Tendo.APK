import { AppHeader } from "@/components/shared/app-header";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import {
  Archive,
  Home,
  Package,
  Percent,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  MessageSquare,
  Tags,
  FileText,
  Store,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { Outlet } from "react-router-dom";


export default function AdminLayout() {
    
    const sections = [
        { 
            title: "TABLEAU DE BORD", 
            items: [
                { label: "Accueil", icon: Home, path: "/admin" },
            ]
        },
        {
            title: "CATALOGUE", 
            items: [
                { icon: Package, label: "Produits", path: "/admin/products" },
                { icon: Tags, label: "Catégories", path: "/admin/categories" },
                { icon: Archive, label: "Produits archivés", path: "/admin/archived-products" },
            ]
        },
        {
            title: "VENTES",
            items: [
                { icon: ShoppingCart, label: "Commandes", path: "/admin/orders" },
                { icon: Package, label: "Dépôts", path: "/admin/depots" }
            ]
        },
        {
            title: "UTILISATEURS",
            items: [
                { icon: Users, label: "Clients", path: "/admin/customers" },
                { icon: Store, label: "Fournisseurs", path: "/admin/suppliers" },
                { icon: UserPlus, label: "Demandes fournisseur", path: "/admin/supplier-requests" },
                { icon: UserCheck, label: "Gérants de dépôt", path: "/admin/depot-managers" },
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
                { icon: Percent, label: "Commissions", path: "/admin/commissions" },
                { icon: MessageSquare, label: "Messages", path: "/admin/messages" },
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