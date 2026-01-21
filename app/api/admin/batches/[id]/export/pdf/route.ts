import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import { requireAdmin } from "@/lib/auth/adminGuard";
import { supabaseAdmin } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireAdmin(request);
    const { id: batchId } = await context.params;

    const { data: tags, error } = await supabaseAdmin
      .from("rescue_tags")
      .select("public_code")
      .eq("batch_id", batchId)
      .order("created_at", { ascending: true })
      .returns<{ public_code: string }[]>();

    if (error) {
      return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
    }

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const columns = 3;
    const rows = 8;
    const margin = 24;
    const cellWidth = (PAGE_WIDTH - margin * 2) / columns;
    const cellHeight = (PAGE_HEIGHT - margin * 2) / rows;
    const qrSize = Math.min(cellWidth, cellHeight) - 24;

    let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let cellIndex = 0;

    for (const tag of tags ?? []) {
      if (cellIndex > 0 && cellIndex % (columns * rows) === 0) {
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      }

      const position = cellIndex % (columns * rows);
      const col = position % columns;
      const row = Math.floor(position / columns);
      const x = margin + col * cellWidth;
      const y = PAGE_HEIGHT - margin - (row + 1) * cellHeight;

      const qrDataUrl = await QRCode.toDataURL(tag.public_code, { width: 512, margin: 1 });
      const qrImage = await pdfDoc.embedPng(qrDataUrl);

      page.drawText("MatrixC Rescue", {
        x: x + 8,
        y: y + cellHeight - 16,
        size: 8,
        font,
      });

      page.drawImage(qrImage, {
        x: x + (cellWidth - qrSize) / 2,
        y: y + 18,
        width: qrSize,
        height: qrSize,
      });

      page.drawText(tag.public_code, {
        x: x + 8,
        y: y + 6,
        size: 9,
        font,
      });

      cellIndex += 1;
    }

    await writeAuditLog({
      actorId: user.id,
      action: "ADMIN_EXPORT",
      targetType: "batch",
      targetId: batchId,
      details: { format: "pdf" },
    });

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=matrixc-batch-${batchId}.pdf`,
      },
    });
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      return NextResponse.json({ error: error.message }, { status: (error as { status: number }).status });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
