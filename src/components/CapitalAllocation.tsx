"use client";

import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Label, NumberInput } from "@/components/ui/Field";
import { StatRow } from "@/components/ui/Stat";
import { fmt } from "@/lib/calculations";
import { CapitalAllocationInputs, DerivedDashboard } from "@/lib/types";

export function CapitalAllocation({
  inputs,
  derived,
  onChange,
}: {
  inputs: CapitalAllocationInputs;
  derived: DerivedDashboard;
  onChange: (next: CapitalAllocationInputs) => void;
}) {
  const c = derived.capital;
  const set = <K extends keyof CapitalAllocationInputs>(k: K, v: CapitalAllocationInputs[K]) =>
    onChange({ ...inputs, [k]: v });

  const pnlTone = c.pnl > 0 ? "good" : c.pnl < 0 ? "bad" : "muted";

  return (
    <Card>
      <CardHeader title="Capital Allocation Summary" subtitle="Editable cells in blue" />
      <CardBody className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Core Capital</Label>
            <NumberInput value={inputs.coreCapital} step={1000} onChange={(n) => set("coreCapital", n)} />
          </div>
          <div className="space-y-1">
            <Label>Invested Amount</Label>
            <NumberInput value={inputs.investedAmount} step={1000} onChange={(n) => set("investedAmount", n)} />
          </div>
          <div className="space-y-1">
            <Label>Cash Available</Label>
            <NumberInput value={inputs.cashAvailable} step={1000} onChange={(n) => set("cashAvailable", n)} />
          </div>
          <div className="space-y-1">
            <Label>Active Trades</Label>
            <NumberInput value={inputs.activeTrades} step={1} onChange={(n) => set("activeTrades", n)} />
          </div>
        </div>

        <div className="pt-2">
          <StatRow label="CC – IA" hint="Core Capital − Invested" value={fmt.inr(c.ccia)} />
          <StatRow label="P&L" value={fmt.inr(c.pnl)} tone={pnlTone} />
          <StatRow label="Ending Capital" value={fmt.inr(c.endingCapital)} tone="good" />
          <StatRow label="Exposure" value={fmt.pct(c.exposure)} />
          <StatRow label="Cash" value={fmt.pct(c.cashPct)} />
          <StatRow label="Gain / Loss %" value={fmt.pct(c.gainOrLossPct)} tone={pnlTone} />
        </div>
      </CardBody>
    </Card>
  );
}
