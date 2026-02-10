import { LayoutDashboard, Tag, BarChart3, Store, Menu } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useUserData } from "@/hooks/use-user-data";
import { useStores } from "@/hooks/use-stores";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const { isStoreManager, isFree } = useUserData();
  const { stores } = useStores();
  const { toggleSidebar } = useSidebar();

  const showSingleStore = isStoreManager || (isFree && stores.length === 1);
  const storeUrl = isFree && stores.length === 1 ? "/mon-magasin-free" : 
                   isStoreManager ? "/mon-magasin" : 
                   "/stores";

  const items = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Promos", url: "/promotions", icon: Tag },
    { title: "Stats", url: "/stats", icon: BarChart3 },
    { title: showSingleStore ? "Magasin" : "Magasins", url: storeUrl, icon: Store },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-lg safe-area-bottom">
      <div className="flex items-stretch justify-around">
        {items.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 px-3 flex-1 min-h-[56px] text-muted-foreground transition-colors",
                isActive && "text-primary"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-tight">{item.title}</span>
          </NavLink>
        ))}
        <button
          onClick={toggleSidebar}
          className="flex flex-col items-center justify-center gap-0.5 py-2 px-3 flex-1 min-h-[56px] text-muted-foreground transition-colors active:text-primary"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-tight">Plus</span>
        </button>
      </div>
    </nav>
  );
}
