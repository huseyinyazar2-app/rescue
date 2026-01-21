import type { ReactNode } from "react";

interface AdminSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export default function AdminSection({ title, description, children }: AdminSectionProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
