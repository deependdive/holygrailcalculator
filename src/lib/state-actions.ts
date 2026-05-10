// Server-only helpers to load and persist a logged-in user's dashboard state.
// Called from server components (page.tsx) and route handlers (api/*).
// All reads/writes are RLS-scoped to auth.uid() — no service-role usage here.
// (next/headers imported transitively guards against client-side use.)

import { getSupabaseServer } from "./supabaseServer";
import { CapitalAllocationInputs, DashboardState, MarketCondition, PositionInput, PositionStatus, SLCalculatorInputs, Tranche } from "./types";

export async function loadDashboardForCurrentUser(): Promise<DashboardState | null> {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: settings }, { data: positions }] = await Promise.all([
    supabase.from("dashboard_settings").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("positions").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
  ]);

  if (!settings) return null;

  const sl: SLCalculatorInputs = {
    marketCondition: settings.market_condition as MarketCondition,
    strategyLimits: settings.strategy_limits,
    entryPrice: settings.entry_price,
    stopLoss: settings.stop_loss,
  };
  const cap: CapitalAllocationInputs = {
    coreCapital: settings.core_capital,
    investedAmount: settings.invested_amount,
    cashAvailable: settings.cash_available,
    activeTrades: settings.active_trades,
  };
  const pos: PositionInput[] = (positions ?? []).map((p) => ({
    id: p.id,
    stock: p.stock,
    allocation: p.allocation,
    capAtEntry: p.cap_at_entry,
    entryPrice: p.entry_price,
    stopLoss: p.stop_loss,
    sector: p.sector ?? undefined,
    setup: p.setup ?? undefined,
    tranche: p.tranche as Tranche,
    status: p.status as PositionStatus,
    qtyOverride: p.qty_override ?? undefined,
  }));

  return { slCalculator: sl, capital: cap, positions: pos };
}

export async function persistDashboardForCurrentUser(state: DashboardState): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not signed in" };

  // Upsert settings (one row per user)
  const { error: settingsErr } = await supabase
    .from("dashboard_settings")
    .upsert({
      user_id: user.id,
      market_condition: state.slCalculator.marketCondition,
      strategy_limits: state.slCalculator.strategyLimits,
      entry_price: state.slCalculator.entryPrice,
      stop_loss: state.slCalculator.stopLoss,
      core_capital: state.capital.coreCapital,
      invested_amount: state.capital.investedAmount,
      cash_available: state.capital.cashAvailable,
      active_trades: state.capital.activeTrades,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

  if (settingsErr) return { ok: false, error: settingsErr.message };

  // Wipe + reinsert positions. Simple, durable, fine for ~dozens of rows.
  const { error: delErr } = await supabase.from("positions").delete().eq("user_id", user.id);
  if (delErr) return { ok: false, error: delErr.message };

  if (state.positions.length > 0) {
    const rows = state.positions.map((p) => ({
      id: p.id,
      user_id: user.id,
      stock: p.stock,
      allocation: p.allocation,
      cap_at_entry: p.capAtEntry,
      entry_price: p.entryPrice,
      stop_loss: p.stopLoss,
      sector: p.sector ?? null,
      setup: p.setup ?? null,
      tranche: p.tranche,
      status: p.status,
      qty_override: p.qtyOverride ?? null,
    }));
    const { error: insErr } = await supabase.from("positions").insert(rows);
    if (insErr) return { ok: false, error: insErr.message };
  }

  return { ok: true };
}
