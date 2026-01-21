import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { requireAdmin } from "@/lib/auth/adminGuard";
import { supabaseAdmin } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { user } = await requireAdmin(request);
    const tagId = params.id;

    const { data: tag, error } = await supabaseAdmin
      .from("rescue_tags")
      .select("id, public_code")
      .eq("id", tagId)
      .single();

    if (error || !tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    const dataUrl = await QRCode.toDataURL(tag.public_code, { width: 1024, margin: 1 });
    const base64 = dataUrl.split(",")[1];
    const buffer = Buffer.from(base64, "base64");

    await writeAuditLog({
      actorId: user.id,
      action: "ADMIN_EXPORT",
      targetType: "tag",
      targetId: tagId,
      details: { format: "png" },
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename=matrixc-tag-${tag.public_code}.png`,
      },
    });
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      return NextResponse.json({ error: error.message }, { status: (error as { status: number }).status });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
