"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function UserSync() {
  const { isSignedIn, isLoaded } = useAuth();
  const storeUser = useMutation(api.users.store);
  const initializePreferences = useMutation(api.preferences.initialize);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      void (async () => {
        await storeUser({});
        await initializePreferences({});
      })();
    }
  }, [isLoaded, isSignedIn, storeUser, initializePreferences]);

  return null;
}
