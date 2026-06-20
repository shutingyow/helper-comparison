import { NextResponse, type NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

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
      api.ingestPublic.listMissingPhoneHelperPlaceIds,
      { secret },
    );
    return NextResponse.json({ helperPlaceIds });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list missing-phone IDs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
