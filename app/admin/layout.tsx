import type { ReactNode } from "react";
import AdminNav from "@/components/admin/AdminNav";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-semibold">MatrixC Rescue Admin</h1>
          <span className="text-sm text-slate-500">Secure console</span>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl gap-6 px-6 py-6">
        <aside className="w-60">
          <AdminNav />
        </aside>
        <main className="flex-1 space-y-6">{children}</main>
      </div>
    </div>
  );
}
