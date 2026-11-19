import { ReactNode, ComponentType } from "react";
import { IconProps } from "./icon.types";

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
  icon: ComponentType<IconProps>;
}
