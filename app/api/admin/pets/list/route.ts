import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/adminGuard";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const ownerEmail = searchParams.get("owner_email");
    const name = searchParams.get("name");
    const status = searchParams.get("status");

    let ownerIds: string[] | null = null;
    if (ownerEmail) {
      const { data: owners } = await supabaseAdmin
        .from("rescue_profiles")
        .select("id")
        .ilike("email", `%${ownerEmail}%`);
      ownerIds = owners?.map((owner) => owner.id) ?? [];
      if (ownerIds.length === 0) {
        return NextResponse.json({ pets: [] });
      }
    }

    let query = supabaseAdmin
      .from("rescue_pets")
      .select(
        "id, name, status, last_seen_area, tag:rescue_tags(public_code), owner:rescue_profiles(email), created_at"
      )
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (name) {
      query = query.ilike("name", `%${name}%`);
    }

    if (ownerIds) {
      query = query.in("owner_id", ownerIds);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: "Failed to fetch pets" }, { status: 500 });
    }

    return NextResponse.json({ pets: data ?? [] });
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      return NextResponse.json({ error: error.message }, { status: (error as { status: number }).status });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
