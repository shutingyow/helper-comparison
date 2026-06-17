"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { type ReactNode, useMemo } from "react";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) return null;
    return new ConvexReactClient(url);
  }, []);

  if (!client) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-sm text-zinc-600">
        Set <code className="mx-1 rounded bg-zinc-100 px-1">NEXT_PUBLIC_CONVEX_URL</code>{" "}
        in your environment to connect Convex.
      </div>
    );
  }

  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
