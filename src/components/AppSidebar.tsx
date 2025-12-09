import { LayoutDashboard, Tag, CalendarDays, BarChart3, Store, Settings, User, LogOut, ShieldCheck } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoPromoJour from "@/assets/logo-promojour.svg";
import { useUserData } from "@/hooks/use-user-data";
import { useStores } from "@/hooks/use-stores";
import { usePermissions } from "@/hooks/use-permissions";

const settingsItems = [
  { title: "Réglages", url: "/settings", icon: Settings },
  { title: "Compte", url: "/account", icon: User },
];

const superAdminItems = [
  { title: "Administration", url: "/super-admin", icon: ShieldCheck },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const { isStoreManager, isFree, isSuperAdmin, loading: userLoading } = useUserData();
  const { stores, loading: storesLoading } = useStores();
  const { canViewCampaigns, canEditOrgSettings } = usePermissions();

  // Déterminer si on affiche "Mon magasin" ou "Mes Magasins"
  const showSingleStore = isStoreManager || (isFree && stores.length === 1);
  const storeUrl = isFree && stores.length === 1 ? "/mon-magasin-free" : 
                   isStoreManager ? "/mon-magasin" : 
                   "/stores";

  // Build menu items based on permissions
  const menuItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Promotions", url: "/promotions", icon: Tag },
    // Campagnes only visible for Pro and Centrale (not Free)
    ...(canViewCampaigns ? [{ title: "Campagnes", url: "/campaigns", icon: CalendarDays }] : []),
    { title: "Statistiques", url: "/stats", icon: BarChart3 },
    { 
      title: showSingleStore ? "Mon magasin" : "Mes Magasins", 
      url: storeUrl, 
      icon: Store 
    },
  ];

  // Settings items - filter based on permissions
  const filteredSettingsItems = canEditOrgSettings 
    ? settingsItems 
    : settingsItems.filter(item => item.url !== "/settings");

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Déconnexion réussie");
      navigate("/");
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
    }
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
              {menuItems.map((item) => (
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

        {filteredSettingsItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Configuration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredSettingsItems.map((item) => (
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
      )}

      {isSuperAdmin && (
        <SidebarGroup>
          <SidebarGroupLabel>Super Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {superAdminItems.map((item) => (
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
      )}
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
