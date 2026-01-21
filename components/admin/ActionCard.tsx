import type { ReactNode } from "react";

interface ActionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export default function ActionCard({ title, description, children }: ActionCardProps) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
