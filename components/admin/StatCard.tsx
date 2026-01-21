interface StatCardProps {
  title: string;
  value: string;
  helper?: string;
}

export default function StatCard({ title, value, helper }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      {helper ? <div className="mt-2 text-xs text-slate-400">{helper}</div> : null}
    </div>
  );
}
