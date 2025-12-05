type Props = {
  label: string;
  value: number;
  unit?: string;
  tone?: "cyan" | "amber";
};

export function StatBadge({label, value, unit, tone = "cyan"}: Props) {
  const toneClasses =
    tone === "cyan"
      ? "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/40"
      : "bg-neon-amber/10 text-neon-amber border-neon-amber/40";

  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-1 text-sm ${toneClasses}`}>
      <span className="text-xs uppercase tracking-wide text-white/60">{label}</span>
      <span className="font-display text-base">
        {value.toLocaleString()}
        {unit ?? ""}
      </span>
    </div>
  );
}
