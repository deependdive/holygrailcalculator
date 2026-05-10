"use client";

import { cn } from "@/lib/cn";
import { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";

export function Label({ children, htmlFor, hint }: { children: ReactNode; htmlFor?: string; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-xs text-muted flex items-center gap-2">
      <span>{children}</span>
      {hint && <span className="text-muted/60">— {hint}</span>}
    </label>
  );
}

export function NumberInput({
  value,
  onChange,
  step = 1,
  className,
  ...rest
}: {
  value: number;
  onChange: (n: number) => void;
  step?: number;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "step">) {
  return (
    <input
      type="number"
      step={step}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => {
        const n = parseFloat(e.target.value);
        onChange(Number.isFinite(n) ? n : 0);
      }}
      className={cn(
        "w-full px-2.5 py-1.5 rounded-md border border-border bg-panel2 text-text",
        "text-sm font-mono tabular-nums",
        "focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand",
        className
      )}
      {...rest}
    />
  );
}

export function TextInput({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="text"
      className={cn(
        "w-full px-2.5 py-1.5 rounded-md border border-border bg-panel2 text-text",
        "text-sm",
        "focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand",
        className
      )}
      {...rest}
    />
  );
}

export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full px-2.5 py-1.5 rounded-md border border-border bg-panel2 text-text",
        "text-sm",
        "focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand",
        className
      )}
      {...rest}
    >
      {children}
    </select>
  );
}
