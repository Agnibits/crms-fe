"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider delayDuration={200}>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3500,
                style: {
                  background: "var(--card)",
                  color: "var(--card-foreground)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  fontSize: "0.875rem",
                },
              }}
            />
          </TooltipProvider>
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
