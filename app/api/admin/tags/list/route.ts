import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/adminGuard";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabaseAdmin
      .from("tags")
      .select("id, public_code, status, claimed_at, batch_id")
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
    }

    return NextResponse.json({ tags: data ?? [] });
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      return NextResponse.json({ error: error.message }, { status: (error as { status: number }).status });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
