"use client";

import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Pill, StatRow } from "@/components/ui/Stat";
import { fmt } from "@/lib/calculations";
import { DerivedDashboard } from "@/lib/types";

export function RiskSummary({ derived }: { derived: DerivedDashboard }) {
  const r = derived.riskSummary;
  const heatTone = r.state === "HIGH RISK" ? "bad" : r.state === "MODERATE" ? "warn" : "good";
  const pnlTone = r.gainOrLossPct > 0 ? "good" : r.gainOrLossPct < 0 ? "bad" : "muted";

  return (
    <Card>
      <CardHeader
        title="Risk Summary"
        subtitle="Live aggregates across active positions"
        right={<Pill tone={heatTone}>{r.state}</Pill>}
      />
      <CardBody>
        <StatRow label="Heat" hint="Σ position risk %" value={fmt.pct(r.heat)} tone={heatTone} />
        <StatRow label="Cash" value={fmt.inr(r.cash)} />
        <StatRow label="Exposure" value={fmt.pct(r.exposure)} />
        <StatRow label="Gain / Loss %" value={fmt.pct(r.gainOrLossPct)} tone={pnlTone} />
        <StatRow label="Weighted Avg SL %" value={fmt.pct(r.weightedAvgSlPct)} />
        <StatRow label="Cash Available to Trade" value={fmt.inr(r.cashAvailableToTrade)} tone="good" />
      </CardBody>
    </Card>
  );
}
