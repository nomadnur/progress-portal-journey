import { BarChart3, ClipboardList, Users, Target, LogOut } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { state } = useSidebar();
  const { profile, signOut } = useAuth();
  const { isManager } = useUserRole();
  const location = useLocation();
  const currentPath = location.pathname;

  const userItems = [
    { title: "Dashboard", url: "/", icon: BarChart3 },
    { title: "Assessment", url: "/assessment", icon: ClipboardList },
  ];

  const managerItems = [
    { title: "Manager Dashboard", url: "/manager", icon: Users },
    { title: "Assessment Campaigns", url: "/campaigns", icon: Target },
  ];

  const items = isManager() 
    ? [...userItems, ...managerItems] 
    : userItems;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b p-4">
        <div>
          <h2 className="text-lg font-semibold">Progress Portal</h2>
          <p className="text-sm text-muted-foreground">
            {profile?.full_name || profile?.email}
          </p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start"
        >
          <LogOut className="h-4 w-4" />
          <span className="ml-2">Sign Out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}