import AdminSection from "@/components/admin/AdminSection";

export default function AdminAuditPage() {
  return (
    <div className="space-y-6">
      <AdminSection title="Audit Logs" description="Recent admin activity with sensitive actions.">
        <div className="rounded-lg border bg-white p-4 text-sm text-slate-500">
          Data will populate from /api/admin/audit/list (last 500 entries).
        </div>
      </AdminSection>
    </div>
  );
}
