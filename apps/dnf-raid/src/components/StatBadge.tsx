type Props = {
  label: string;
  value: number;
  unit?: string;
  tone?: "cyan" | "amber";
};

export function StatBadge({label, value, unit, tone = "cyan"}: Props) {
  const toneClasses =
    tone === "cyan"
      ? "bg-primary-muted text-primary border-primary/30"
      : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-1 text-sm ${toneClasses}`}>
      <span className="text-xs uppercase tracking-wide text-text-subtle">{label}</span>
      <span className="font-display text-base text-text">
        {value.toLocaleString()}
        {unit ?? ""}
      </span>
    </div>
  );
}
