// Mirrors the structure of the source workbook (Master Dashboard sheet)
// All formulas live in src/lib/calculations.ts so this stays a pure data shape.

export type MarketCondition = "Downtrend" | "Rally Attempt" | "Confirmed Uptrend";

export type PositionStatus = "Active" | "Order Placed" | "Closed";

export type Tranche = "T1" | "T2" | "T3";

// Risk Framework lookup row (E3:J7 in the workbook)
export interface RiskFrameworkRow {
  profile: MarketCondition;
  risk: number;          // F: 0.0025 / 0.005 / 0.0075
  allocation: number;    // G: 0.03 / 0.05 / 0.10
  maxTrades: string;     // H: "4" / "6–8" / "10–20"
  maxHeat: number;       // I: 0.01 / 0.03 / 0.05
  stateByHeat: string;   // J: HEALTHY / MODERATE / HIGH RISK
}

// One row of the Open Positions table (B22:R34).
// Inputs (user-typed) vs derived (computed) are separated to keep state lean.
export interface PositionInput {
  id: string;                  // local uuid
  stock: string;               // B
  allocation: number;          // C  — fraction of capAtEntry, e.g. 0.03
  capAtEntry: number;          // D  — Portfolio Value at the time the trade was entered
  entryPrice: number;          // F
  stopLoss: number;            // G
  sector?: string;             // O
  setup?: string;              // P
  tranche: Tranche;            // Q
  status: PositionStatus;      // R
  // Optional override quantity. If unset, qty is derived from allocation.
  qtyOverride?: number;
}

// SL Calculator inputs (B3:C20) excluding fields that are computed
export interface SLCalculatorInputs {
  marketCondition: MarketCondition;   // C5
  strategyLimits: number;             // C6 — max position % of capital (e.g. 0.10)
  entryPrice: number;                 // C10
  stopLoss: number;                   // C11
}

// Capital Allocation block (L3:N15) — only the hardcoded inputs, rest derived
export interface CapitalAllocationInputs {
  // Core capital is the sum of contributions. Workbook had =2700000+1000000+420000.
  // We expose it as a single number; users can break it out client-side if they want.
  coreCapital: number;        // M5
  investedAmount: number;     // M6  — sum of cap-required across active positions, OR a manual figure
  cashAvailable: number;      // M8  — actual cash sitting idle in the account
  activeTrades: number;       // F10 (auto-derived from positions, but allow override)
}

// Top-level dashboard state stored per user
export interface DashboardState {
  slCalculator: SLCalculatorInputs;
  capital: CapitalAllocationInputs;
  positions: PositionInput[];
}

// ---------- DERIVED OUTPUTS (returned by calc engine) ----------

export interface SLCalculatorDerived {
  riskEngine: number;           // C7 — chosen from the framework table by marketCondition
  portfolioValue: number;       // C8 — = endingCapital
  riskAmountInr: number;        // C9 — portfolioValue * riskEngine
  slPct: number;                // C12 — (EP - SL)/EP
  calculatedPosition: number;   // C13 — risk-based position sizing in INR
  finalPositionInr: number;     // C14 — MIN(calculatedPosition, portfolioValue * strategyLimits)
  quantity: number;             // C15
  actualRisk: number;           // C16
  realRiskPct: number;          // C17
  maxPositionPct: number;       // C18
  cap: number;                  // C19
  capStatus: "Cap Hit" | "Within Limits"; // C20
}

export interface CapitalAllocationDerived {
  ccia: number;                 // M7 — coreCapital - investedAmount
  pnl: number;                  // M9 — cashAvailable - ccia
  endingCapital: number;        // M10 — coreCapital + pnl
  exposure: number;             // M11 — investedAmount/coreCapital
  cashPct: number;              // M12 — 1 - exposure
  gainOrLossPct: number;        // M13 — (endingCapital - coreCapital)/coreCapital
}

export interface PositionDerived {
  slPct: number;                // H — (EP-SL)/EP
  qty: number;                  // I — capReq / EP, floored
  risk: number;                 // J — (EP-SL) * qty
  capReq: number;               // M — allocation * capAtEntry
  riskPct: number;              // L — risk / portfolio value
  buyingPower: number;          // N — capReq / portfolioValue (i.e. % of capital used)
  weightedSlContribution: number; // capReq * slPct (used by weighted-avg SL%)
}

export interface RiskSummary {
  heat: number;                 // sum of position riskPct across Active rows
  cash: number;                 // = cashAvailable
  exposure: number;             // = M11
  gainOrLossPct: number;        // = M13
  weightedAvgSlPct: number;     // sum(capReq*slPct)/sum(capReq) for Active
  cashAvailableToTrade: number; // cashAvailable (what's free to deploy)
  state: string;                // HEALTHY / MODERATE / HIGH RISK from heat vs framework maxHeat
}

export interface DerivedDashboard {
  sl: SLCalculatorDerived;
  capital: CapitalAllocationDerived;
  positions: (PositionInput & { derived: PositionDerived })[];
  riskSummary: RiskSummary;
  framework: RiskFrameworkRow[];
  activeProfile: RiskFrameworkRow;
}
