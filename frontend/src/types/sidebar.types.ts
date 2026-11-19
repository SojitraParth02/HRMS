import { ReactNode } from "react";

export interface SidebarContextType {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggleCollapse: () => void;
  toggleMobile: () => void;
  closeMobile: () => void;
}

export interface SidebarProviderProps {
  children: ReactNode;
}

export interface SidebarNavItem {
  title: string;
  href: string;
  icon: (props: { className?: string }) => ReactNode;
}
