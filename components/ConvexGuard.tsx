"use client";

import type { ReactNode } from "react";

interface ConvexGuardProps {
  children: ReactNode;
}

export function ConvexGuard({ children }: ConvexGuardProps) {
  const configured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

  if (!configured) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-medium">Convex not connected</p>
        <p className="mt-1 text-amber-800">
          Set <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_CONVEX_URL</code> and
          run <code className="rounded bg-amber-100 px-1">npx convex dev</code> to load live
          data. The UI is ready for the foundation agent to wire up.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
