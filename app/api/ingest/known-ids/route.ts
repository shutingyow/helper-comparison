import { NextResponse, type NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

function parseUserId(request: NextRequest): Id<"users"> | undefined {
  const fromQuery = request.nextUrl.searchParams.get("userId");
  const value = fromQuery ?? process.env.SCRAPE_USER_ID ?? undefined;
  return value ? (value as Id<"users">) : undefined;
}

export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-ingest-secret");
  if (!secret || secret !== process.env.INGEST_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const helperPlaceIds = await convex.query(
      api.ingestPublic.listKnownHelperPlaceIds,
      { secret, userId: parseUserId(request) },
    );
    return NextResponse.json({ helperPlaceIds });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list known IDs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
