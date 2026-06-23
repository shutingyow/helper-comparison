import { NextResponse, type NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

function parseUserId(request: NextRequest): Id<"users"> | undefined {
  const fromQuery = request.nextUrl.searchParams.get("userId");
  const value = fromQuery ?? process.env.SCRAPE_USER_ID ?? undefined;
  if (!value) return undefined;
  return value as Id<"users">;
}

export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-ingest-secret");
  if (!secret || secret !== process.env.INGEST_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseUserId(request);
  if (!userId) {
    return NextResponse.json(
      { error: "userId query param or SCRAPE_USER_ID env var required" },
      { status: 400 },
    );
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_CONVEX_URL not configured" },
      { status: 500 },
    );
  }

  try {
    const convex = new ConvexHttpClient(convexUrl);
    const config = await convex.action(
      api.scraperCredentials.getDecryptedForScraperWithSecret,
      { secret, userId },
    );

    if (!config) {
      return NextResponse.json(
        { error: "No enabled HelperPlace credentials found for this user" },
        { status: 404 },
      );
    }

    return NextResponse.json({ userId, ...config });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load scraper credentials";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
