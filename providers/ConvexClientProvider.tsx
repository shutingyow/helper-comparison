"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ReactNode, useMemo } from "react";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const convex = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) return null;
    return new ConvexReactClient(url);
  }, []);

  if (!publishableKey) {
    return (
      <div className="border-b border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        Set <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
        <code>NEXT_PUBLIC_CONVEX_URL</code> in <code>.env.local</code>.
      </div>
    );
  }

  if (!convex) {
    return (
      <ClerkProvider publishableKey={publishableKey}>
        <div className="border-b border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          Set <code>NEXT_PUBLIC_CONVEX_URL</code> in <code>.env.local</code> and run{" "}
          <code>npx convex dev</code>.
        </div>
      </ClerkProvider>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
