"use client";

import { useEffect, useRef, useState } from "react";
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

/**
 * Restores the user session, and refreshes it once per load even when the store
 * was rehydrated from localStorage — otherwise an open tab keeps the role,
 * permissions and locked fields it had at sign-in, and the UI would gate on
 * stale rules after an admin edits them.
 */
function useSessionBootstrap() {
  const { user, setAuth } = useAuthStore();
  // Don't block the first paint when we already have a cached user.
  const [ready, setReady] = useState(!!user);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const token = tokenStorage.getAccessToken();
    if (!token) {
      // Middleware will redirect; avoid a blank screen meanwhile.
      setReady(true);
      return;
    }
    authService
      .getProfile()
      .then((profile) => setAuth({ user: profile }))
      .catch(() => {}) // keep the cached user; the API layer handles auth failures
      .finally(() => setReady(true));
  }, [setAuth]);

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
