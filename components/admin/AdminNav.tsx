import Link from "next/link";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/tags", label: "Tags & Batches" },
  { href: "/admin/pets", label: "Pets" },
  { href: "/admin/sightings", label: "Sightings" },
  { href: "/admin/profiles", label: "Users" },
  { href: "/admin/audit", label: "Audit Logs" },
];

export default function AdminNav() {
  return (
    <nav className="rounded-lg border bg-white p-4">
      <ul className="space-y-2 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link className="block rounded px-3 py-2 text-slate-700 hover:bg-slate-100" href={link.href}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
