"use client";

import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Label, NumberInput, Select } from "@/components/ui/Field";
import { Pill, StatRow } from "@/components/ui/Stat";
import { fmt } from "@/lib/calculations";
import { DerivedDashboard, MarketCondition, SLCalculatorInputs } from "@/lib/types";

const CONDITIONS: MarketCondition[] = ["Downtrend", "Rally Attempt", "Confirmed Uptrend"];

export function SLCalculator({
  inputs,
  derived,
  onChange,
}: {
  inputs: SLCalculatorInputs;
  derived: DerivedDashboard;
  onChange: (next: SLCalculatorInputs) => void;
}) {
  const sl = derived.sl;
  const set = <K extends keyof SLCalculatorInputs>(k: K, v: SLCalculatorInputs[K]) =>
    onChange({ ...inputs, [k]: v });

  return (
    <Card>
      <CardHeader
        title="Market Condition & SL Calculator"
        subtitle="Position sizing for a candidate trade"
        right={
          <Pill tone={sl.capStatus === "Cap Hit" ? "warn" : "good"}>{sl.capStatus}</Pill>
        }
      />
      <CardBody className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Market Condition</Label>
            <Select
              value={inputs.marketCondition}
              onChange={(e) => set("marketCondition", e.target.value as MarketCondition)}
            >
              {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div className="space-y-1">
            <Label hint="max position % of capital">Strategy Limits</Label>
            <NumberInput
              value={inputs.strategyLimits * 100}
              step={0.5}
              onChange={(n) => set("strategyLimits", n / 100)}
            />
          </div>
          <div className="space-y-1">
            <Label>Entry Price (₹)</Label>
            <NumberInput value={inputs.entryPrice} step={0.05} onChange={(n) => set("entryPrice", n)} />
          </div>
          <div className="space-y-1">
            <Label>Stop Loss (₹)</Label>
            <NumberInput value={inputs.stopLoss} step={0.05} onChange={(n) => set("stopLoss", n)} />
          </div>
        </div>

        <div className="pt-2">
          <StatRow label="Risk Engine (dynamic)" hint="from regime" value={fmt.pct(sl.riskEngine, 2)} tone="muted" />
          <StatRow label="Portfolio Value" value={fmt.inr(sl.portfolioValue)} />
          <StatRow label="Risk Amount" value={fmt.inr(sl.riskAmountInr, { decimals: 0 })} />
          <StatRow label="SL %" value={fmt.pct(sl.slPct)} tone={sl.slPct > 0.07 ? "warn" : undefined} />
          <StatRow label="Calculated Position" hint="risk-based" value={fmt.inr(sl.calculatedPosition, { decimals: 0 })} tone="muted" />
          <StatRow label="Final Position" value={fmt.inr(sl.finalPositionInr, { decimals: 0 })} tone="good" />
          <StatRow label="Quantity" value={fmt.num(sl.quantity)} tone="good" />
          <StatRow label="Actual Risk" value={fmt.inr(sl.actualRisk, { decimals: 0 })} />
          <StatRow label="Real Risk %" value={fmt.pct(sl.realRiskPct)} />
          <StatRow label="Cap" hint={`${fmt.pct(sl.maxPositionPct, 1)} of PV`} value={fmt.inr(sl.cap, { decimals: 0 })} />
        </div>
      </CardBody>
    </Card>
  );
}
