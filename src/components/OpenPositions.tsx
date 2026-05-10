"use client";

import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { NumberInput, Select, TextInput } from "@/components/ui/Field";
import { fmt } from "@/lib/calculations";
import { DerivedDashboard, PositionInput, PositionStatus, Tranche } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";

const STATUSES: PositionStatus[] = ["Active", "Order Placed", "Closed"];
const TRANCHES: Tranche[] = ["T1", "T2", "T3"];

export function OpenPositions({
  positions,
  derived,
  onChange,
}: {
  positions: PositionInput[];
  derived: DerivedDashboard;
  onChange: (next: PositionInput[]) => void;
}) {
  const update = (id: string, patch: Partial<PositionInput>) =>
    onChange(positions.map(p => (p.id === id ? { ...p, ...patch } : p)));

  const remove = (id: string) => onChange(positions.filter(p => p.id !== id));

  const add = () => {
    const id = "p" + (Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
    onChange([
      ...positions,
      {
        id,
        stock: "New Position",
        allocation: 0.05,
        capAtEntry: positions[0]?.capAtEntry ?? 1_000_000,
        entryPrice: 100,
        stopLoss: 95,
        sector: "",
        setup: "",
        tranche: "T1",
        status: "Active",
      },
    ]);
  };

  const totals = derived.positions
    .filter(p => p.status === "Active")
    .reduce(
      (acc, p) => {
        acc.capReq += p.derived.capReq;
        acc.risk += p.derived.risk;
        acc.weightedSl += p.derived.weightedSlContribution;
        acc.bp += p.derived.buyingPower;
        return acc;
      },
      { capReq: 0, risk: 0, weightedSl: 0, bp: 0 }
    );
  const weightedAvgSl = totals.capReq === 0 ? 0 : totals.weightedSl / totals.capReq;

  return (
    <Card>
      <CardHeader
        title="Open Positions"
        subtitle="Edit any cell. Quantities recompute on the fly."
        right={
          <button
            onClick={add}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-border bg-panel2 hover:bg-panel2/70 hover:border-brand/50"
          >
            <Plus className="w-3.5 h-3.5" /> Add row
          </button>
        }
      />
      <CardBody className="p-0 overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-muted">
            <tr className="border-b border-border">
              <th className="text-left  px-3 py-2 font-medium">Stock</th>
              <th className="text-right px-2 py-2 font-medium">Alloc</th>
              <th className="text-right px-2 py-2 font-medium">Cap@Entry</th>
              <th className="text-right px-2 py-2 font-medium">EP</th>
              <th className="text-right px-2 py-2 font-medium">SL</th>
              <th className="text-right px-2 py-2 font-medium">SL %</th>
              <th className="text-right px-2 py-2 font-medium">Qty</th>
              <th className="text-right px-2 py-2 font-medium">Risk ₹</th>
              <th className="text-right px-2 py-2 font-medium">Risk %</th>
              <th className="text-right px-2 py-2 font-medium">Cap Req</th>
              <th className="text-right px-2 py-2 font-medium">Buying Pwr</th>
              <th className="text-left  px-2 py-2 font-medium">Sector</th>
              <th className="text-left  px-2 py-2 font-medium">Setup</th>
              <th className="text-left  px-2 py-2 font-medium">Tranche</th>
              <th className="text-left  px-2 py-2 font-medium">Status</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {derived.positions.map((p) => {
              const closed = p.status === "Closed";
              return (
                <tr key={p.id} className={"border-b border-border/50 " + (closed ? "opacity-50" : "")}>
                  <td className="px-3 py-1.5 min-w-[160px]">
                    <TextInput
                      value={p.stock}
                      onChange={(e) => update(p.id, { stock: e.target.value })}
                    />
                  </td>
                  <td className="px-2 py-1.5 w-[88px]">
                    <NumberInput
                      value={p.allocation * 100}
                      step={0.5}
                      onChange={(n) => update(p.id, { allocation: n / 100 })}
                    />
                  </td>
                  <td className="px-2 py-1.5 w-[110px]">
                    <NumberInput
                      value={p.capAtEntry}
                      step={1000}
                      onChange={(n) => update(p.id, { capAtEntry: n })}
                    />
                  </td>
                  <td className="px-2 py-1.5 w-[90px]">
                    <NumberInput
                      value={p.entryPrice}
                      step={0.05}
                      onChange={(n) => update(p.id, { entryPrice: n })}
                    />
                  </td>
                  <td className="px-2 py-1.5 w-[90px]">
                    <NumberInput
                      value={p.stopLoss}
                      step={0.05}
                      onChange={(n) => update(p.id, { stopLoss: n })}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums">{fmt.pct(p.derived.slPct)}</td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums">{fmt.num(p.derived.qty)}</td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums">{fmt.inr(p.derived.risk, { decimals: 0 })}</td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums">{fmt.pct(p.derived.riskPct)}</td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums">{fmt.inr(p.derived.capReq, { decimals: 0 })}</td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums">{fmt.pct(p.derived.buyingPower, 1)}</td>
                  <td className="px-2 py-1.5 min-w-[120px]">
                    <TextInput
                      value={p.sector ?? ""}
                      onChange={(e) => update(p.id, { sector: e.target.value })}
                    />
                  </td>
                  <td className="px-2 py-1.5 min-w-[120px]">
                    <TextInput
                      value={p.setup ?? ""}
                      onChange={(e) => update(p.id, { setup: e.target.value })}
                    />
                  </td>
                  <td className="px-2 py-1.5 w-[70px]">
                    <Select value={p.tranche} onChange={(e) => update(p.id, { tranche: e.target.value as Tranche })}>
                      {TRANCHES.map(t => <option key={t} value={t}>{t}</option>)}
                    </Select>
                  </td>
                  <td className="px-2 py-1.5 w-[120px]">
                    <Select value={p.status} onChange={(e) => update(p.id, { status: e.target.value as PositionStatus })}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </td>
                  <td className="px-2 py-1.5">
                    <button
                      onClick={() => remove(p.id)}
                      className="text-muted hover:text-bad p-1"
                      aria-label="remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="text-xs">
            <tr className="border-t border-border bg-panel2">
              <td colSpan={5} className="px-3 py-2 text-muted">Active totals (Σ)</td>
              <td className="px-2 py-2 text-right font-mono tabular-nums text-muted">{fmt.pct(weightedAvgSl)} <span className="text-muted/60">(wtd)</span></td>
              <td className="px-2 py-2"></td>
              <td className="px-2 py-2 text-right font-mono tabular-nums">{fmt.inr(totals.risk, { decimals: 0 })}</td>
              <td className="px-2 py-2 text-right font-mono tabular-nums">{fmt.pct(derived.riskSummary.heat)}</td>
              <td className="px-2 py-2 text-right font-mono tabular-nums">{fmt.inr(totals.capReq, { decimals: 0 })}</td>
              <td className="px-2 py-2 text-right font-mono tabular-nums">{fmt.pct(totals.bp, 1)}</td>
              <td colSpan={5}></td>
            </tr>
          </tfoot>
        </table>
      </CardBody>
    </Card>
  );
}
