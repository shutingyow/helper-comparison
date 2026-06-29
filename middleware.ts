import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/login(.*)",
  "/auth/complete(.*)",
  "/guide(.*)",
  "/api/ingest(.*)",
  "/api/scraper(.*)",
]);

function isClerkConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
  );
}

const clerkAuthMiddleware = clerkMiddleware(
  async (auth, request) => {
    if (isPublicRoute(request)) {
      return;
    }

    const { userId } = await auth();
    if (!userId) {
      const signIn = new URL("/sign-in", request.url);
      signIn.searchParams.set("redirect_url", request.url);
      return NextResponse.redirect(signIn);
    }
  },
  { signInUrl: "/sign-in" },
);

function missingClerkMiddleware(request: NextRequest) {
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Authentication not configured</title>
</head>
<body style="font-family: system-ui, sans-serif; max-width: 42rem; margin: 4rem auto; padding: 0 1rem; color: #1c1917;">
  <h1>Authentication not configured</h1>
  <p>Clerk environment variables are missing on this deployment.</p>
  <p>Add these in Vercel → Project → Settings → Environment Variables (Production):</p>
  <ul>
    <li><code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code></li>
    <li><code>CLERK_SECRET_KEY</code></li>
    <li><code>CLERK_JWT_ISSUER_DOMAIN</code> (also set in the Convex dashboard)</li>
  </ul>
  <p>Get keys from <a href="https://dashboard.clerk.com/~/api-keys">dashboard.clerk.com</a>, then redeploy.</p>
</body>
</html>`,
    {
      status: 503,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}

export default function middleware(
  request: NextRequest,
  event: Parameters<typeof clerkAuthMiddleware>[1],
) {
  if (!isClerkConfigured()) {
    return missingClerkMiddleware(request);
  }

  return clerkAuthMiddleware(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
