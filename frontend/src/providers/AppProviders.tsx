"use client";

import React, { ReactNode, useState } from "react";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store } from "../store";
import { SocketProvider } from "../context/SocketContext";

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const [queryClient] = useState<QueryClient>(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes fresh data (no refetching needed)
            gcTime: 10 * 60 * 1000, // 10 minutes cache retention in memory
            refetchOnWindowFocus: false, // Prevents aggressive background refetching
            retry: 1,
          },
        },
      })
  );

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SocketProvider>{children}</SocketProvider>
      </QueryClientProvider>
    </Provider>
  );
};
