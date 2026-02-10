import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { NotificationCenter } from "./NotificationCenter";
import { MobileBottomNav } from "./MobileBottomNav";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="h-14 md:h-16 border-b border-border/50 glass-card sticky top-0 z-40 flex items-center justify-between px-4 md:px-6">
            <SidebarTrigger className="hidden md:flex" />
            <h1 className="md:hidden text-sm font-semibold text-foreground truncate">PromoJour</h1>
            <NotificationCenter />
          </header>
          <div className="flex-1 p-4 md:p-6 lg:p-8 pb-20 md:pb-6">
            {children}
          </div>
        </main>
        <MobileBottomNav />
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
