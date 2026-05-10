"use client";

import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Stat";
import { fmt } from "@/lib/calculations";
import { DerivedDashboard } from "@/lib/types";

export function RiskFramework({ derived }: { derived: DerivedDashboard }) {
  const active = derived.activeProfile;
  return (
    <Card>
      <CardHeader title="Risk Framework" subtitle="Hard rules by market regime" />
      <CardBody className="p-0">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted">
            <tr className="border-b border-border">
              <th className="text-left  px-4 py-2 font-medium">Profile</th>
              <th className="text-right px-2 py-2 font-medium">Risk</th>
              <th className="text-right px-2 py-2 font-medium">Allocation</th>
              <th className="text-right px-2 py-2 font-medium">Max Trades</th>
              <th className="text-right px-2 py-2 font-medium">Max Heat</th>
              <th className="text-right px-4 py-2 font-medium">State</th>
            </tr>
          </thead>
          <tbody>
            {derived.framework.map(row => {
              const isActive = row.profile === active.profile;
              return (
                <tr key={row.profile} className={isActive ? "bg-brand/10" : ""}>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      {row.profile}
                      {isActive && <Pill tone="brand">active</Pill>}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums">{fmt.pct(row.risk, 2)}</td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums">{fmt.pct(row.allocation, 1)}</td>
                  <td className="px-2 py-2 text-right">{row.maxTrades}</td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums">{fmt.pct(row.maxHeat, 1)}</td>
                  <td className="px-4 py-2 text-right text-xs">{row.stateByHeat}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardBody>
    </Card>
  );
}
