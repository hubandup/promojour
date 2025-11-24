import { LayoutDashboard, Tag, CalendarDays, BarChart3, Store, Settings, User, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

import { useUserData } from "@/hooks/use-user-data";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoPromoJour from "@/assets/logo-promojour.png";

const settingsItems = [
  { title: "Réglages", url: "/settings", icon: Settings },
  { title: "Compte", url: "/account", icon: User },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const { isFree, isStore, isCentral, isSuperAdmin, isStoreManager } = useUserData();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Déconnexion réussie");
      navigate("/");
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  // Adapter les éléments du menu selon le profil
  const getMenuItems = () => {
    const items = [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Promotions", url: "/promotions", icon: Tag },
    ];

    // Campagnes : visible pour super admin ou si pas Free
    if (isSuperAdmin || !isFree) {
      items.push({ title: "Campagnes", url: "/campaigns", icon: CalendarDays });
    }

    items.push({ title: "Statistiques", url: "/stats", icon: BarChart3 });

    // Mes Magasins : visible pour super admin ou Pro/Centrale
    if (isSuperAdmin || ((isStore || isCentral) && !isFree)) {
      items.push({ title: "Mes Magasins", url: "/stores", icon: Store });
    }
    // Mon Magasin : visible seulement pour Free et store_manager, mais PAS pour super admin
    else if (!isSuperAdmin && (isFree || isStoreManager)) {
      items.push({ title: "Mon Magasin", url: "/stores", icon: Store });
    }

    return items;
  };

  return (
    <Sidebar className="border-r">
      <SidebarContent>
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <img src={logoPromoJour} alt="PromoJour" className="h-8" />
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menu principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {getMenuItems().map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Configuration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
