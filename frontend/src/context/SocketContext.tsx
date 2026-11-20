"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "../hooks/redux";
import { NOTIFICATIONS_QUERY_KEY } from "../hooks/queries/useNotifications";
import { NotificationItem } from "../types/notification.types";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  latestNotification: NotificationItem | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  latestNotification: null,
});

export const useSocket = (): SocketContextType => useContext(SocketContext);

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [latestNotification, setLatestNotification] = useState<NotificationItem | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const queryClient = useQueryClient();
  const { token, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Only connect if user is authenticated with a valid token
    const activeToken: string | null =
      token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);

    if (!isAuthenticated && !activeToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const socketUrl: string =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

    const socket: Socket = io(socketUrl, {
      auth: { token: activeToken },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      console.log(`[Socket] Connected to backend gateway (id: ${socket.id})`);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      console.log("[Socket] Disconnected from backend gateway");
    });

    // Real-Time Notification Listener
    socket.on("notification:new", (notification: NotificationItem) => {
      console.log("[Socket] Received real-time notification:", notification);
      setLatestNotification(notification);

      // Instantly invalidate TanStack Query cache to refresh badge, attendance, leaves, overtime, advances & payroll
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ["attendance"] });
      void queryClient.invalidateQueries({ queryKey: ["leaves"] });
      void queryClient.invalidateQueries({ queryKey: ["overtime"] });
      void queryClient.invalidateQueries({ queryKey: ["advances"] });
      void queryClient.invalidateQueries({ queryKey: ["payroll"] });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [token, isAuthenticated, queryClient]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        latestNotification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
