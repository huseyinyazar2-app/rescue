import AdminSection from "@/components/admin/AdminSection";

export default function AdminPetsPage() {
  return (
    <div className="space-y-6">
      <AdminSection title="Pet Management" description="Search by owner email, pet name, or status.">
        <div className="rounded-lg border bg-white p-4 text-sm text-slate-500">
          Data will populate from /api/admin/pets/list. Admin can update status and last seen area.
        </div>
      </AdminSection>
    </div>
  );
}
