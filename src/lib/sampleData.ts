// Sample dataset for the public homepage. Same stocks as the source workbook,
// but scaled to ₹10,00,000 (10 lakh) starting capital with round numbers.
//
// The math (all active positions only, excluding "Order Placed"):
//   investedAmount = Σ allocation*capAtEntry = (0.05*4 + 0.10*3) * 1,000,000 = 500,000
//   coreCapital    = 1,000,000
//   ccia           = 500,000
//   cashAvailable  = 525,000  → P&L = cash - ccia = +25,000  (a ~2.5% gain)
//   endingCapital  = 1,025,000

import { DashboardState } from "./types";

export const SAMPLE_DASHBOARD: DashboardState = {
  slCalculator: {
    marketCondition: "Confirmed Uptrend",
    strategyLimits: 0.10,    // 10% max position size
    entryPrice: 4479,        // candidate trade — Netweb (sample)
    stopLoss: 4231,
  },
  capital: {
    coreCapital: 1_000_000,   // ₹10,00,000
    investedAmount: 500_000,  // ₹5,00,000 — sum of capReq for Active rows below
    cashAvailable: 525_000,   // ₹5,25,000 — implies +25,000 P&L (~2.5%)
    activeTrades: 7,
  },
  positions: [
    // capAtEntry uses 1,000,000 for simplicity (entered when capital was 10L)
    { id: "p1", stock: "Kirloskar Pneumatic", allocation: 0.05, capAtEntry: 1_000_000, entryPrice: 1562,   stopLoss: 1473,  sector: "Industrials",     setup: "Breakout",     tranche: "T1", status: "Active" },
    { id: "p2", stock: "Lemon Tree Hotels",   allocation: 0.05, capAtEntry: 1_000_000, entryPrice: 121.45, stopLoss: 115,   sector: "Consumer Disc.",  setup: "Cup & Handle", tranche: "T1", status: "Active" },
    { id: "p3", stock: "Bajaj Consumer Care", allocation: 0.05, capAtEntry: 1_000_000, entryPrice: 475,    stopLoss: 442,   sector: "FMCG",            setup: "Pullback",     tranche: "T1", status: "Active" },
    { id: "p4", stock: "Clean Science",       allocation: 0.05, capAtEntry: 1_000_000, entryPrice: 833.4,  stopLoss: 791,   sector: "Specialty Chem",  setup: "Flag",         tranche: "T1", status: "Active" },
    { id: "p5", stock: "Enviro Infra",        allocation: 0.10, capAtEntry: 1_000_000, entryPrice: 217.5,  stopLoss: 204.3, sector: "Infrastructure",  setup: "IPO Base",     tranche: "T1", status: "Active" },
    { id: "p6", stock: "Amara Raja",          allocation: 0.10, capAtEntry: 1_000_000, entryPrice: 899,    stopLoss: 867.75,sector: "Auto Ancillary",  setup: "Pivot",        tranche: "T1", status: "Active" },
    { id: "p7", stock: "Netweb Technologies", allocation: 0.10, capAtEntry: 1_000_000, entryPrice: 4479,   stopLoss: 4231,  sector: "Technology",      setup: "Breakout",     tranche: "T1", status: "Active" },
    { id: "p8", stock: "AGI Greenpac",        allocation: 0.05, capAtEntry: 1_000_000, entryPrice: 646,    stopLoss: 614.2, sector: "Packaging",       setup: "Pullback",     tranche: "T1", status: "Order Placed" },
  ],
};
