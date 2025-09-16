import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabase client (use environment variables in Vercel)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(request: NextRequest) {
  try {
    const { id, title, content, metadata } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Insert into Supabase
    const { error } = await supabase.from("documents").insert([
      {
        id,
        title,
        content,
        metadata: metadata || {},
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error.message);
      return NextResponse.json(
        { error: "Database insert failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Document '${title}' ingested successfully`,
      result: {
        ok: true,
        id,
        title,
        contentLength: content.length,
        metadata: metadata || {},
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Ingest API error:", error);
    return NextResponse.json(
      { error: "Internal server error during ingestion" },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "anaase-ingest-api",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
  }
