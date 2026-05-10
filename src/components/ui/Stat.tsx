import { cn } from "@/lib/cn";
import { ReactNode } from "react";

export function StatRow({
  label,
  value,
  tone,
  hint,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  tone?: "good" | "bad" | "warn" | "muted";
  hint?: string;
  className?: string;
}) {
  const toneClass =
    tone === "good" ? "text-good" :
    tone === "bad"  ? "text-bad"  :
    tone === "warn" ? "text-warn" :
    tone === "muted"? "text-muted":
    "text-text";
  return (
    <div className={cn("flex items-center justify-between py-1.5 border-b border-border/50 last:border-0", className)}>
      <span className="text-xs text-muted">
        {label}
        {hint && <span className="text-muted/60 ml-1">— {hint}</span>}
      </span>
      <span className={cn("text-sm font-mono tabular-nums", toneClass)}>{value}</span>
    </div>
  );
}

export function Pill({ children, tone }: { children: ReactNode; tone?: "good" | "bad" | "warn" | "muted" | "brand" }) {
  const map = {
    good:  "bg-good/15  text-good  border-good/30",
    bad:   "bg-bad/15   text-bad   border-bad/30",
    warn:  "bg-warn/15  text-warn  border-warn/30",
    muted: "bg-muted/15 text-muted border-muted/30",
    brand: "bg-brand/15 text-brand border-brand/30",
  } as const;
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border",
      map[tone ?? "muted"]
    )}>
      {children}
    </span>
  );
}
