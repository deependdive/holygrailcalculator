import { cn } from "@/lib/cn";
import { ReactNode } from "react";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-lg border border-border bg-panel", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border">
      <div>
        <h3 className="text-sm font-semibold tracking-wide uppercase text-muted">{title}</h3>
        {subtitle && <div className="text-xs text-muted/80 mt-0.5">{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("p-4", className)}>{children}</div>;
}
