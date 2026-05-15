type Props = {
  label: string;
  value: string | number;
};

export function StatCard({ label, value }: Props) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#2A2A30]">
      <div className="text-xs uppercase tracking-wide text-[#86868B] dark:text-[#A1A1AA]">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
