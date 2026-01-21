import { supabaseAdmin } from "@/lib/supabase/server";

interface AuditLogInput {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: Record<string, unknown> | null;
}

export async function writeAuditLog({
  actorId,
  action,
  targetType,
  targetId = null,
  details = null,
}: AuditLogInput) {
  await supabaseAdmin.from("audit_logs").insert({
    actor_id: actorId,
    action,
    target_type: targetType,
    target_id: targetId,
    details,
  });
}
