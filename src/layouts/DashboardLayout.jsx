"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import AiCopilot from "@/features/ai/AiCopilot";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";
import { tokenStorage } from "@/utils/storage";

/** Restores the user session (token cookie present but store empty). */
function useSessionBootstrap() {
  const { user, setAuth } = useAuthStore();
  const [ready, setReady] = useState(!!user);

  useEffect(() => {
    if (user) {
      setReady(true);
      return;
    }
    const token = tokenStorage.getAccessToken();
    if (!token) {
      // Middleware will redirect; avoid a blank screen meanwhile.
      setReady(true);
      return;
    }
    authService
      .getProfile()
      .then((profile) => setAuth({ user: profile }))
      .finally(() => setReady(true));
  }, [user, setAuth]);

  return ready;
}

export default function DashboardLayout({ children }) {
  const ready = useSessionBootstrap();
  useNotifications();

  if (!ready) {
    return <LoadingSpinner fullPage label="Loading your workspace…" />;
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
          <Footer />
        </main>
      </div>
      <AiCopilot />
    </div>
  );
}
