// Pure-TS port of the workbook formulas. Zero React, zero side effects — just math.
// Every formula here corresponds to a cell in the Master Dashboard sheet; the
// originating cell is noted in a comment so you can trace back to source.

import {
  CapitalAllocationDerived,
  CapitalAllocationInputs,
  DashboardState,
  DerivedDashboard,
  MarketCondition,
  PositionDerived,
  PositionInput,
  RiskFrameworkRow,
  RiskSummary,
  SLCalculatorDerived,
  SLCalculatorInputs,
} from "./types";

// ----- Risk Framework lookup table (E5:J7) -----
export const RISK_FRAMEWORK: RiskFrameworkRow[] = [
  { profile: "Downtrend",         risk: 0.0025, allocation: 0.03, maxTrades: "4",     maxHeat: 0.01, stateByHeat: "HEALTHY" },
  { profile: "Rally Attempt",     risk: 0.005,  allocation: 0.05, maxTrades: "6–8",   maxHeat: 0.03, stateByHeat: "MODERATE" },
  { profile: "Confirmed Uptrend", risk: 0.0075, allocation: 0.10, maxTrades: "10–20", maxHeat: 0.05, stateByHeat: "HIGH RISK" },
];

export function frameworkFor(condition: MarketCondition): RiskFrameworkRow {
  return RISK_FRAMEWORK.find(r => r.profile === condition) ?? RISK_FRAMEWORK[0];
}

// Heat → state. Mirrors the J5:J7 mapping but driven by actual heat, not just regime.
function stateFromHeat(heat: number): string {
  if (heat >= 0.05) return "HIGH RISK";
  if (heat >= 0.03) return "MODERATE";
  return "HEALTHY";
}

// ----- Capital Allocation Summary (L3:N15) -----
export function computeCapital(c: CapitalAllocationInputs): CapitalAllocationDerived {
  const ccia = c.coreCapital - c.investedAmount;        // M7
  const pnl = c.cashAvailable - ccia;                   // M9
  const endingCapital = c.coreCapital + pnl;            // M10
  const exposure = c.coreCapital === 0 ? 0 : c.investedAmount / c.coreCapital; // M11
  const cashPct = 1 - exposure;                         // M12
  const gainOrLossPct = c.coreCapital === 0 ? 0 : (endingCapital - c.coreCapital) / c.coreCapital; // M13
  return { ccia, pnl, endingCapital, exposure, cashPct, gainOrLossPct };
}

// ----- Per-position derivations (row-level columns H, I, J, L, M, N) -----
function computePosition(p: PositionInput, portfolioValue: number): PositionDerived {
  const slPct = p.entryPrice === 0 ? 0 : (p.entryPrice - p.stopLoss) / p.entryPrice; // H
  const capReq = p.allocation * p.capAtEntry;                                        // M
  const qty = p.qtyOverride ?? (p.entryPrice === 0 ? 0 : Math.floor(capReq / p.entryPrice)); // I
  const risk = (p.entryPrice - p.stopLoss) * qty;                                    // J
  const riskPct = portfolioValue === 0 ? 0 : risk / portfolioValue;                  // L
  const buyingPower = portfolioValue === 0 ? 0 : capReq / portfolioValue;            // N
  const weightedSlContribution = capReq * slPct;
  return { slPct, qty, risk, capReq, riskPct, buyingPower, weightedSlContribution };
}

// ----- SL Calculator (B3:C20) -----
export function computeSLCalculator(
  s: SLCalculatorInputs,
  portfolioValue: number,
): SLCalculatorDerived {
  const fw = frameworkFor(s.marketCondition);
  const riskEngine = fw.risk;                                         // C7
  const riskAmountInr = portfolioValue * riskEngine;                  // C9
  const slPct = s.entryPrice === 0 ? 0 : (s.entryPrice - s.stopLoss) / s.entryPrice; // C12

  const denom = s.entryPrice - s.stopLoss;
  const calculatedPosition = denom <= 0 ? 0 : (riskAmountInr / denom) * s.entryPrice; // C13
  const cap = portfolioValue * s.strategyLimits;                      // C19
  const finalPositionInr = Math.min(calculatedPosition, cap);         // C14
  const quantity = s.entryPrice === 0 ? 0 : Math.floor(finalPositionInr / s.entryPrice); // C15
  const actualRisk = (s.entryPrice - s.stopLoss) * quantity;          // C16
  const realRiskPct = portfolioValue === 0 ? 0 : actualRisk / portfolioValue; // C17

  return {
    riskEngine,
    portfolioValue,
    riskAmountInr,
    slPct,
    calculatedPosition,
    finalPositionInr,
    quantity,
    actualRisk,
    realRiskPct,
    maxPositionPct: s.strategyLimits,
    cap,
    capStatus: finalPositionInr < calculatedPosition ? "Cap Hit" : "Within Limits",
  };
}

// ----- Risk Summary (E13:H20). The workbook had labels but no values. -----
function computeRiskSummary(
  positionsWithDerived: (PositionInput & { derived: PositionDerived })[],
  capital: CapitalAllocationDerived,
  capitalInputs: CapitalAllocationInputs,
): RiskSummary {
  const active = positionsWithDerived.filter(p => p.status === "Active");
  const heat = active.reduce((sum, p) => sum + p.derived.riskPct, 0);
  const totalCapReq = active.reduce((sum, p) => sum + p.derived.capReq, 0);
  const weightedSlNumerator = active.reduce((sum, p) => sum + p.derived.weightedSlContribution, 0);
  const weightedAvgSlPct = totalCapReq === 0 ? 0 : weightedSlNumerator / totalCapReq;
  return {
    heat,
    cash: capitalInputs.cashAvailable,
    exposure: capital.exposure,
    gainOrLossPct: capital.gainOrLossPct,
    weightedAvgSlPct,
    cashAvailableToTrade: capitalInputs.cashAvailable,
    state: stateFromHeat(heat),
  };
}

// ----- Top-level: take state, return everything the dashboard needs. -----
export function computeDashboard(state: DashboardState): DerivedDashboard {
  const capital = computeCapital(state.capital);
  const portfolioValue = capital.endingCapital; // C8 = M10

  const positions = state.positions.map(p => ({
    ...p,
    derived: computePosition(p, portfolioValue),
  }));

  const sl = computeSLCalculator(state.slCalculator, portfolioValue);
  const riskSummary = computeRiskSummary(positions, capital, state.capital);
  const activeProfile = frameworkFor(state.slCalculator.marketCondition);

  return { sl, capital, positions, riskSummary, framework: RISK_FRAMEWORK, activeProfile };
}

// ----- Formatters used across the UI. Indian numbering for INR. -----
export const fmt = {
  inr(n: number, opts: { decimals?: number } = {}): string {
    if (!isFinite(n)) return "—";
    const d = opts.decimals ?? 0;
    // en-IN gives lakh/crore grouping (1,00,000) — exactly what the workbook implies.
    return "₹" + n.toLocaleString("en-IN", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });
  },
  pct(n: number, decimals = 2): string {
    if (!isFinite(n)) return "—";
    return (n * 100).toFixed(decimals) + "%";
  },
  num(n: number, decimals = 0): string {
    if (!isFinite(n)) return "—";
    return n.toLocaleString("en-IN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  },
};
