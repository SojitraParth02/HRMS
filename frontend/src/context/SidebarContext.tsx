"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { usePathname } from "next/navigation";
import { SidebarContextType, SidebarProviderProps } from "../types/sidebar.types";

export type { SidebarContextType, SidebarProviderProps };

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const pathname = usePathname();

  const toggleCollapse = useCallback((): void => {
    setIsCollapsed((prev: boolean): boolean => !prev);
  }, []);

  const toggleMobile = useCallback((): void => {
    setIsMobileOpen((prev: boolean): boolean => !prev);
  }, []);

  const closeMobile = useCallback((): void => {
    setIsMobileOpen(false);
  }, []);

  // Automatically close mobile drawer on route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const value = useMemo<SidebarContextType>(
    () => ({
      isCollapsed,
      isMobileOpen,
      toggleCollapse,
      toggleMobile,
      closeMobile,
    }),
    [isCollapsed, isMobileOpen, toggleCollapse, toggleMobile, closeMobile]
  );

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebarContext = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within a SidebarProvider");
  }
  return context;
};

export default SidebarContext;
