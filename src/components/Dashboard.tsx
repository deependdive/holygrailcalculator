"use client";

import { CapitalAllocation } from "@/components/CapitalAllocation";
import { KeyRules } from "@/components/KeyRules";
import { OpenPositions } from "@/components/OpenPositions";
import { RiskFramework } from "@/components/RiskFramework";
import { RiskSummary } from "@/components/RiskSummary";
import { SLCalculator } from "@/components/SLCalculator";
import { computeDashboard } from "@/lib/calculations";
import { DashboardState } from "@/lib/types";
import { useEffect, useMemo, useRef, useState } from "react";

export function Dashboard({
  initialState,
  onPersist,
  isSampleData,
}: {
  initialState: DashboardState;
  onPersist?: (s: DashboardState) => void;
  isSampleData: boolean;
}) {
  const [state, setState] = useState<DashboardState>(initialState);
  const [edited, setEdited] = useState(false);
  const initialMount = useRef(true);
  const derived = useMemo(() => computeDashboard(state), [state]);

  // Mark "edited" on the second state update (first happens at mount).
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    setEdited(true);
  }, [state]);

  // Debounced persist for logged-in users — only after the user actually edits
  // something, and never if we're showing sample data on a fresh account.
  useEffect(() => {
    if (!onPersist || isSampleData || !edited) return;
    const t = setTimeout(() => onPersist(state), 1000);
    return () => clearTimeout(t);
  }, [state, onPersist, isSampleData, edited]);

  return (
    <main className="max-w-[1400px] mx-auto px-4 py-6 space-y-4">
      {isSampleData && (
        <div className="text-xs text-muted bg-panel border border-border rounded-md px-3 py-2">
          You&apos;re viewing sample data with ₹10,00,000 starting capital. Sign in with Google
          to upload your workbook and see your live numbers.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SLCalculator
          inputs={state.slCalculator}
          derived={derived}
          onChange={(v) => setState((s) => ({ ...s, slCalculator: v }))}
        />
        <CapitalAllocation
          inputs={state.capital}
          derived={derived}
          onChange={(v) => setState((s) => ({ ...s, capital: v }))}
        />
        <div className="space-y-4">
          <RiskSummary derived={derived} />
          <KeyRules />
        </div>
      </div>

      <RiskFramework derived={derived} />

      <OpenPositions
        positions={state.positions}
        derived={derived}
        onChange={(positions) => setState((s) => ({ ...s, positions }))}
      />
    </main>
  );
}
