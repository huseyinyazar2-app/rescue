import AdminSection from "@/components/admin/AdminSection";

export default function AdminProfilesPage() {
  return (
    <div className="space-y-6">
      <AdminSection title="User Roles" description="Change roles between admin and user.">
        <div className="rounded-lg border bg-white p-4 text-sm text-slate-500">
          Data will populate from /api/admin/profiles/list. Role changes write audit logs.
        </div>
      </AdminSection>
    </div>
  );
}
