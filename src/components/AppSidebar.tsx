import { useState } from "react";
import { 
  Home, 
  Settings, 
  Users, 
  BarChart3, 
  Calendar, 
  HelpCircle,
  LogOut,
  Building2,
  ClipboardList,
  Bell,
  Search,
  Bookmark,
  Layers
} from "lucide-react";
import vcgLogo from "@/assets/vcg-logo.png";
import vcgIcon from "@/assets/vcg-icon.png";
import { NavLink, useLocation } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const mainItems = [
  { title: "Dashboard", url: "/", icon: Home, disabled: false },
  { title: "Material Pipeline", url: "/material-pipeline", icon: Layers, disabled: false },
  { title: "Super Admin", url: "/super-admin", icon: ClipboardList, disabled: false },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const hasPendingRequests = true;

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  const collapsed = state === "collapsed";

  return (
    <Sidebar
      className="transition-all duration-300 border-r-0"
      collapsible="icon"
    >
      {/* Header - Logo */}
      <SidebarHeader className="h-14 px-3 flex items-center justify-center overflow-hidden">
        {!collapsed ? (
          <img src={vcgLogo} alt="VCG.AI" className="h-9 max-w-full object-contain" />
        ) : (
          <img src={vcgIcon} alt="VCG.AI" className="h-8 w-8 object-contain mx-auto" />
        )}
      </SidebarHeader>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 py-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent text-sidebar-foreground/60 text-sm cursor-pointer hover:bg-sidebar-accent/80 transition-colors">
            <Search className="w-4 h-4" />
            <span>Search...</span>
            <span className="ml-auto text-xs opacity-50">⌘K</span>
          </div>
        </div>
      )}

      <SidebarContent className="px-2">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {collapsed ? (
                    <div className="w-full flex justify-center">
                      <SidebarMenuButton 
                        className={`h-10 w-10 !flex !items-center !justify-center !text-center rounded-lg !p-0 !m-0 transition-colors ${
                          item.disabled
                            ? "opacity-40 cursor-not-allowed"
                            : isActive(item.url)
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                        }`}
                        tooltip={item.title}
                        onClick={() => {
                          if (!item.disabled && item.url !== "#") {
                            window.location.href = item.url;
                          }
                        }}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.title === "VCG Admin" && hasPendingRequests && !item.disabled && (
                          <Bell className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 text-red-500 fill-red-500 animate-pulse" />
                        )}
                      </SidebarMenuButton>
                    </div>
                  ) : item.disabled ? (
                    <SidebarMenuButton asChild className="h-10 rounded-lg text-sm">
                      <div className="flex items-center w-full px-3 gap-3 opacity-40 cursor-not-allowed text-sidebar-foreground">
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.title}</span>
                      </div>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton asChild className="h-10 rounded-lg text-sm transition-colors">
                      <NavLink 
                        to={item.url} 
                        end={item.url === "/"} 
                        className={({ isActive: active }) => `flex items-center w-full px-3 gap-3 rounded-lg transition-colors ${
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                        }`}
                        onClick={item.url === "#" ? (e) => e.preventDefault() : undefined}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <div className="flex items-center justify-between w-full">
                          <span>{item.title}</span>
                          {item.title === "VCG Admin" && hasPendingRequests && (
                            <Bell className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />
                          )}
                        </div>
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-3 border-t border-sidebar-border">
        {/* Settings */}
        {!collapsed ? (
          <NavLink
            to="/settings"
            className={({ isActive: active }) => `flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg transition-colors ${
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </NavLink>
        ) : (
          <NavLink
            to="/settings"
            className={({ isActive: active }) => `flex items-center justify-center w-full py-2 rounded-lg transition-colors ${
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60"
            }`}
          >
            <Settings className="h-4 w-4" />
          </NavLink>
        )}

        <Separator className="!my-2 bg-sidebar-border" />

        {/* User Profile */}
        {!collapsed ? (
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar className="h-8 w-8 border-2 border-sidebar-primary/40">
              <AvatarImage src="/user-avatar.png" alt="Jon Goriup" />
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">JG</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Jon Goriup</span>
              <span className="text-xs text-sidebar-foreground/60">CEO</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-2">
            <Avatar className="h-8 w-8 border-2 border-sidebar-primary/40">
              <AvatarImage src="/user-avatar.png" alt="Jon Goriup" />
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">JG</AvatarFallback>
            </Avatar>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
