import AdminSection from "@/components/admin/AdminSection";
import ActionCard from "@/components/admin/ActionCard";

export default function AdminTagsPage() {
  return (
    <div className="space-y-6">
      <AdminSection title="Batch Creation" description="Generate pre-minted tags and export PINs securely.">
        <ActionCard title="Create a batch" description="Create a new batch of QR tags and download the PIN CSV once.">
          <ul className="text-sm text-slate-500">
            <li>POST /api/admin/batches/create</li>
            <li>CSV includes public_code + PIN (one-time)</li>
            <li>Audit log is written automatically</li>
          </ul>
        </ActionCard>
      </AdminSection>
      <AdminSection title="Tags" description="Manage existing tags and export QR assets.">
        <div className="rounded-lg border bg-white p-4 text-sm text-slate-500">
          Data will populate from /api/admin/tags/list. PDF/PNG export via /api/admin/batches/:id/export/pdf.
        </div>
      </AdminSection>
    </div>
  );
}
