"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";
import { api } from "@/convex/_generated/api";
import { LoadingState } from "@/components/LoadingState";

/**
 * Post-sign-in landing page. Waits for Clerk session hydration, syncs the Convex
 * user record, then performs a full document navigation to /inbox so middleware
 * sees the session cookie on the first protected request.
 */
export default function AuthCompletePage() {
  const { isLoaded, isSignedIn } = useAuth();
  const storeUser = useMutation(api.users.store);
  const initializePreferences = useMutation(api.preferences.initialize);
  const redirectStarted = useRef(false);

  useEffect(() => {
    if (!isLoaded || redirectStarted.current) return;

    if (!isSignedIn) {
      redirectStarted.current = true;
      window.location.replace("/sign-in");
      return;
    }

    redirectStarted.current = true;
    void (async () => {
      try {
        await storeUser({});
        await initializePreferences({});
      } catch {
        // AuthReady on /inbox will retry and surface setup errors.
      }
      window.location.replace("/inbox");
    })();
  }, [isLoaded, isSignedIn, storeUser, initializePreferences]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-warm-50 px-4">
      <div className="w-full max-w-md">
        <LoadingState rows={4} />
      </div>
    </div>
  );
}
