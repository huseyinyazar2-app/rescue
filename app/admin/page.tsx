import StatCard from "@/components/admin/StatCard";
import AdminSection from "@/components/admin/AdminSection";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <AdminSection title="Overview" description="System-wide metrics for tags, pets, and sightings.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Tags" value="—" helper="Claimed vs unclaimed" />
          <StatCard title="Pets Lost" value="—" helper="Currently marked lost" />
          <StatCard title="Pets Found" value="—" helper="Recovered pets" />
          <StatCard title="Sightings (24h)" value="—" helper="Reports in last 24h" />
        </div>
      </AdminSection>
      <AdminSection title="Recent Sightings" description="Last 20 reports with approximate area and timestamp.">
        <div className="rounded-lg border bg-white p-4 text-sm text-slate-500">
          Data will populate from /api/admin/sightings/list.
        </div>
      </AdminSection>
    </div>
  );
}
