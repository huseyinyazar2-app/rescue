import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/adminGuard";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const { data, error } = await supabaseAdmin
      .from("rescue_audit_logs")
      .select("id, actor_id, action, target_type, target_id, details, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
    }

    return NextResponse.json({ logs: data ?? [] });
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      return NextResponse.json({ error: error.message }, { status: (error as { status: number }).status });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
