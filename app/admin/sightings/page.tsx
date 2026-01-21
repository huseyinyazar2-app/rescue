import AdminSection from "@/components/admin/AdminSection";

export default function AdminSightingsPage() {
  return (
    <div className="space-y-6">
      <AdminSection title="Sightings" description="Admin-only view of sensitive finder metadata.">
        <div className="rounded-lg border bg-white p-4 text-sm text-slate-500">
          Data will populate from /api/admin/sightings/list. Opening a detail logs ADMIN_VIEW_SENSITIVE.
        </div>
      </AdminSection>
    </div>
  );
}
