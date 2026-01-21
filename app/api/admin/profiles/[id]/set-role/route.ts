import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/adminGuard";
import { supabaseAdmin } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

interface RoleRequest {
  role: "admin" | "user";
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { user } = await requireAdmin(request);
    const targetId = params.id;
    const body = (await request.json()) as RoleRequest;

    if (!body.role || !["admin", "user"].includes(body.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("rescue_profiles").update({ role: body.role }).eq("id", targetId);

    if (error) {
      return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
    }

    await writeAuditLog({
      actorId: user.id,
      action: "ADMIN_SET_ROLE",
      targetType: "user",
      targetId,
      details: { role: body.role },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      return NextResponse.json({ error: error.message }, { status: (error as { status: number }).status });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
