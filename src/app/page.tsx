import { AppShell } from "@/components/AppShell";
import { loadDashboardForCurrentUser } from "@/lib/state-actions";
import { SAMPLE_DASHBOARD } from "@/lib/sampleData";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Logged in → try to load their saved dashboard. If they have no positions
  // yet AND no real entry/SL filled in, treat as "fresh user" and show sample
  // so the screen isn't empty. Once they upload a workbook, real data takes over.
  let state = SAMPLE_DASHBOARD;
  let isSampleData = true;

  if (user) {
    const saved = await loadDashboardForCurrentUser();
    const looksFresh = saved && saved.positions.length === 0 && saved.slCalculator.entryPrice === 0;
    if (saved && !looksFresh) {
      state = saved;
      isSampleData = false;
    }
  }

  const initialUser = user
    ? {
        id: user.id,
        email: user.email,
        name: (user.user_metadata?.full_name as string | undefined) ?? null,
        avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? null,
      }
    : null;

  return <AppShell initialState={state} initialUser={initialUser} isSampleData={isSampleData} />;
}
