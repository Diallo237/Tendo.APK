import { AppHeader } from "@/components/shared/app-header";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Home, Store, Settings } from "lucide-react";
import { Outlet } from "react-router-dom";

export default function DepotManagerLayout() {
    const sections = [
        {
            title: "TABLEAU DE BORD",
            items: [
                { label: "Accueil", icon: Home, path: "/depot-manager" },
            ]
        },
        {
            title: "MON DÉPÔT",
            items: [
                { icon: Store, label: "Colis", path: "/depot-manager/shipments" },
            ]
        },
        {
            title: "PARAMÈTRES",
            items: [
                { icon: Settings, label: "Mon compte", path: "/depot-manager/settings" },
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
