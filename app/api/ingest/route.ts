import { NextResponse, type NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { FunctionArgs } from "convex/server";
import type { Id } from "@/convex/_generated/dataModel";

type IngestArgs = FunctionArgs<typeof api.ingestPublic.ingestBatch>;

function parseUserId(value: string | null): Id<"users"> | undefined {
  if (!value) return undefined;
  return value as Id<"users">;
}

export async function POST(request: NextRequest) {
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
    const body = (await request.json()) as {
      candidates: IngestArgs["candidates"];
      scrapeRun: IngestArgs["scrapeRun"];
      userId?: string;
    };

    if (!Array.isArray(body.candidates) || !body.scrapeRun) {
      return NextResponse.json(
        { error: "Invalid payload: expected candidates[] and scrapeRun" },
        { status: 400 },
      );
    }

    const userId =
      parseUserId(body.userId ?? null) ??
      parseUserId(process.env.SCRAPE_USER_ID ?? null);

    const convex = new ConvexHttpClient(convexUrl);
    const result = await convex.mutation(api.ingestPublic.ingestBatch, {
      secret,
      userId,
      candidates: body.candidates,
      scrapeRun: body.scrapeRun,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ingest failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
