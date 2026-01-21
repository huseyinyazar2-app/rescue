import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/adminGuard";
import { supabaseAdmin } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { user } = await requireAdmin(request);
    const sightingId = params.id;

    const { data, error } = await supabaseAdmin
      .from("sightings")
      .select(
        "id, created_at, pet_id, lat, lon, location_accuracy_m, message, photo_url, finder_contact, metadata, ip_hash, is_suspected_spam"
      )
      .eq("id", sightingId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Sighting not found" }, { status: 404 });
    }

    await writeAuditLog({
      actorId: user.id,
      action: "ADMIN_VIEW_SENSITIVE",
      targetType: "sighting",
      targetId: sightingId,
    });

    return NextResponse.json({ sighting: data });
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      return NextResponse.json({ error: error.message }, { status: (error as { status: number }).status });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
