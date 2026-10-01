import { Separator } from "@radix-ui/react-separator";
import { Breadcrumb, BreadcrumbList } from "../ui/breadcrumb";
import { SidebarTrigger } from "../ui/sidebar";
import { ThemeToggle } from "./theme-toggle";
import { UserAvatarHeader } from "./user-avatar";
import { useUser } from "@/contexts/user-context";



export function AppHeader() {
    const { user } = useUser();

    return (
      <header className="flex h-16 shrink-0 items-center sticky top-0 bg-background/80 backdrop-blur-sm border-b gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {/* {generateBreadcrumbs()} */}
                  </BreadcrumbList>
                  </Breadcrumb>
          </div>
          <div className="ml-auto flex items-center gap-2 px-4">
            <ThemeToggle />
              <div className="h-6 w-px bg-border" />
                <UserAvatarHeader user={user} />
              </div> 
                    
          </header>
    );
}