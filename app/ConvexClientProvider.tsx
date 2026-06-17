"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convex) {
    return (
      <div className="p-6 text-sm text-amber-800 bg-amber-50 border-b border-amber-200">
        Set <code>NEXT_PUBLIC_CONVEX_URL</code> in <code>.env.local</code> and
        run <code>npx convex dev</code>.
      </div>
    );
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
