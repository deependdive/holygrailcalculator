// Parses an uploaded workbook that follows the source "Master Dashboard"
// layout and extracts a DashboardState. Tolerant to small layout drift
// (we read by named cell coordinates, not by table-walk).

import * as XLSX from "xlsx";
import { DashboardState, MarketCondition, PositionInput, PositionStatus, Tranche } from "./types";

function num(v: unknown, fallback = 0): number {
  if (v === null || v === undefined || v === "") return fallback;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
}

function str(v: unknown, fallback = ""): string {
  if (v === null || v === undefined) return fallback;
  return String(v).trim();
}

function asMarketCondition(v: unknown): MarketCondition {
  const s = str(v).toLowerCase();
  if (s.includes("downtrend")) return "Downtrend";
  if (s.includes("rally")) return "Rally Attempt";
  return "Confirmed Uptrend";
}

function asStatus(v: unknown): PositionStatus {
  const s = str(v).toLowerCase();
  if (s.includes("close")) return "Closed";
  if (s.includes("order")) return "Order Placed";
  return "Active";
}

function asTranche(v: unknown): Tranche {
  const s = str(v).toUpperCase();
  if (s === "T2") return "T2";
  if (s === "T3") return "T3";
  return "T1";
}

// Reads a cell's CALCULATED value (data_only-equivalent) when SheetJS has it,
// otherwise falls back to its raw value. SheetJS gives us .v (value) for cells
// that have been computed by Excel before we received the file.
function cellVal(sheet: XLSX.WorkSheet, addr: string): unknown {
  const cell = sheet[addr] as XLSX.CellObject | undefined;
  if (!cell) return undefined;
  return cell.v;
}

export interface ParseResult {
  state: DashboardState;
  warnings: string[];
}

export function parseHolygrailWorkbook(buf: ArrayBuffer): ParseResult {
  const wb = XLSX.read(buf, { type: "array", cellFormula: true, cellDates: true });
  const sheetName = wb.SheetNames.find(s => /master|dashboard/i.test(s)) ?? wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const warnings: string[] = [];

  // ----- SL Calculator block (B3:C20). Inputs only — derived will be recomputed.
  const marketCondition = asMarketCondition(cellVal(sheet, "C5"));
  const strategyLimits = num(cellVal(sheet, "C6"), 0.10);
  const entryPrice = num(cellVal(sheet, "C10"), 0);
  const stopLoss = num(cellVal(sheet, "C11"), 0);

  // ----- Capital Allocation block (L3:N15)
  const coreCapital = num(cellVal(sheet, "M5"), 0);
  const investedAmount = num(cellVal(sheet, "M6"), 0);
  const cashAvailable = num(cellVal(sheet, "M8"), 0);
  const activeTrades = num(cellVal(sheet, "F10"), 0);

  if (coreCapital === 0) warnings.push("Core Capital (cell M5) is 0 or missing.");
  if (entryPrice === 0) warnings.push("Entry Price (cell C10) is 0 or missing.");

  // ----- Open Positions table (B22:R34). Row 23 is the header; data starts row 24.
  // Columns: B=Stock, C=Allocation, D=Cap@Entry, F=EP, G=SL, O=Sector, P=Setup, Q=Tranche, R=Status
  const positions: PositionInput[] = [];
  for (let row = 24; row <= 60; row++) {
    const stock = str(cellVal(sheet, `B${row}`));
    const tranche = cellVal(sheet, `Q${row}`);
    const status = cellVal(sheet, `R${row}`);
    const allocation = num(cellVal(sheet, `C${row}`));
    const ep = num(cellVal(sheet, `F${row}`));

    // Stop walking once we hit a fully blank row (no stock, no tranche, no status, no EP).
    if (!stock && !tranche && !status && allocation === 0 && ep === 0) break;
    // Skip empty intermediate rows that have only a tranche/status (closed-but-blank)
    if (!stock && ep === 0) continue;

    positions.push({
      id: "p" + row, // stable id derived from source row
      stock: stock || `Row ${row}`,
      allocation,
      capAtEntry: num(cellVal(sheet, `D${row}`), coreCapital),
      entryPrice: ep,
      stopLoss: num(cellVal(sheet, `G${row}`)),
      sector: str(cellVal(sheet, `O${row}`)) || undefined,
      setup: str(cellVal(sheet, `P${row}`)) || undefined,
      tranche: asTranche(tranche),
      status: asStatus(status),
    });
  }

  if (positions.length === 0) {
    warnings.push("No positions found between rows 24-60. Expected the same layout as the template.");
  }

  return {
    state: {
      slCalculator: { marketCondition, strategyLimits, entryPrice, stopLoss },
      capital: { coreCapital, investedAmount, cashAvailable, activeTrades },
      positions,
    },
    warnings,
  };
}
