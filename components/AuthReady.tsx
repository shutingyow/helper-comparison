"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { ReactNode, useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { LoadingState } from "@/components/LoadingState";

type SyncState = "idle" | "syncing" | "ready" | "error";

export function AuthReady({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const storeUser = useMutation(api.users.store);
  const initializePreferences = useMutation(api.preferences.initialize);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setSyncState("ready");
      return;
    }

    let cancelled = false;
    setSyncState("syncing");
    setSyncError(null);

    void (async () => {
      try {
        await storeUser({});
        await initializePreferences({});
        if (!cancelled) setSyncState("ready");
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "Account setup failed";
        setSyncError(message);
        setSyncState("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, storeUser, initializePreferences]);

  if (!isLoaded || syncState === "idle" || syncState === "syncing") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-50 px-4">
        <div className="w-full max-w-md">
          <LoadingState rows={4} />
        </div>
      </div>
    );
  }

  if (syncState === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-50 px-4">
        <div className="max-w-md rounded-xl border border-red-200 bg-white p-6 text-sm text-stone-800 shadow-sm">
          <p className="font-semibold text-stone-900">Could not finish sign-in setup</p>
          <p className="mt-2 text-stone-600">{syncError}</p>
          <p className="mt-3 text-stone-500">
            If this persists, confirm the Clerk <strong>Convex</strong> JWT template
            exists and <code className="rounded bg-stone-100 px-1">CLERK_JWT_ISSUER_DOMAIN</code>{" "}
            is set in the Convex dashboard, then redeploy.
          </p>
          <button
            type="button"
            className="mt-4 rounded-lg bg-coral-600 px-4 py-2 text-sm font-medium text-white hover:bg-coral-700"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
