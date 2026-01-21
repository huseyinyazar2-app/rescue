import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/adminGuard";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createCsv } from "@/lib/csv";
import { prepareBatchTags } from "@/lib/admin/batches";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

interface BatchRequest {
  quantity: number;
  name?: string;
}

async function fetchExistingCodes(codes: string[]) {
  const { data: existing } = await supabaseAdmin.from("rescue_tags").select("public_code").in("public_code", codes);
  return new Set(existing?.map((tag) => tag.public_code) ?? []);
}

export async function POST(request: Request) {
  try {
    const { user } = await requireAdmin(request);
    const body = (await request.json()) as BatchRequest;

    if (!body.quantity || body.quantity < 1 || body.quantity > 1000) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }

    const batchName = body.name ?? `Batch-${new Date().toISOString()}-${body.quantity}pcs`;

    const { data: batch, error: batchError } = await supabaseAdmin
      .from("rescue_batches")
      .insert({ name: batchName, quantity: body.quantity, created_by: user.id })
      .select("id")
      .single();

    if (batchError || !batch) {
      return NextResponse.json({ error: "Failed to create batch" }, { status: 500 });
    }

    let tagsWithPins = await prepareBatchTags(body.quantity);
    let existingCodes = await fetchExistingCodes(tagsWithPins.map((tag) => tag.public_code));
    let attempts = 0;
    while (existingCodes.size > 0 && attempts < 5) {
      tagsWithPins = await prepareBatchTags(body.quantity, existingCodes);
      existingCodes = await fetchExistingCodes(tagsWithPins.map((tag) => tag.public_code));
      attempts += 1;
    }

    if (existingCodes.size > 0) {
      return NextResponse.json({ error: "Failed to generate unique tags" }, { status: 500 });
    }

    const { error: tagError } = await supabaseAdmin.from("rescue_tags").insert(
      tagsWithPins.map((tag) => ({
        public_code: tag.public_code,
        pin_hash: tag.pin_hash,
        batch_id: batch.id,
      }))
    );

    if (tagError) {
      return NextResponse.json({ error: "Failed to create tags" }, { status: 500 });
    }

    await writeAuditLog({
      actorId: user.id,
      action: "ADMIN_CREATE_BATCH",
      targetType: "batch",
      targetId: batch.id,
      details: { quantity: body.quantity },
    });

    const csv = createCsv(
      tagsWithPins.map((tag) => ({
        public_code: tag.public_code,
        pin: tag.pin,
      }))
    );

    return NextResponse.json({
      batch_id: batch.id,
      tags: tagsWithPins.map((tag) => ({ public_code: tag.public_code, pin: tag.pin })),
      csv,
    });
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      return NextResponse.json({ error: error.message }, { status: (error as { status: number }).status });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
