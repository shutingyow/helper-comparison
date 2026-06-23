"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function UserSync() {
  const { isSignedIn, isLoaded } = useAuth();
  const storeUser = useMutation(api.users.store);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      void storeUser({});
    }
  }, [isLoaded, isSignedIn, storeUser]);

  return null;
}
