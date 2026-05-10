import { Card, CardBody, CardHeader } from "@/components/ui/Card";

const RULES = [
  "Risk per trade is governed by market regime (0.25% / 0.50% / 0.75%).",
  "Max position size capped at 10% of portfolio value.",
  "Heat (sum of position risk%) must stay under regime's max heat.",
  "Reduce / pause new entries when state is HIGH RISK.",
  "Stop loss is sacred — never widen it.",
  "Track allocation, cap@entry, and tranche for every position.",
];

export function KeyRules() {
  return (
    <Card>
      <CardHeader title="Key Rules" subtitle="Discipline > prediction" />
      <CardBody className="space-y-2">
        {RULES.map((r, i) => (
          <div key={i} className="flex gap-2 text-sm">
            <span className="text-brand font-mono text-xs mt-0.5">0{i + 1}</span>
            <span className="text-text/90">{r}</span>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
