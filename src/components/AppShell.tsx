"use client";

import { Dashboard } from "@/components/Dashboard";
import { Header } from "@/components/Header";
import { getSupabaseBrowser } from "@/lib/supabaseClient";
import { DashboardState } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

type AuthUser = { id: string; email?: string | null; name?: string | null; avatarUrl?: string | null };

export function AppShell({
  initialState,
  initialUser,
  isSampleData,
}: {
  initialState: DashboardState;
  initialUser: AuthUser | null;
  isSampleData: boolean;
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const supabase = getSupabaseBrowser();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user;
        setUser({
          id: u.id,
          email: u.email,
          name: (u.user_metadata?.full_name as string | undefined) ?? null,
          avatarUrl: (u.user_metadata?.avatar_url as string | undefined) ?? null,
        });
      } else {
        setUser(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const onSignIn = useCallback(async () => {
    const redirectTo = `${window.location.origin}/auth/callback?next=/`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  }, [supabase]);

  const onSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  }, [supabase]);

  // Persist on edits — only when logged in. Posts to a server action.
  const onPersist = user
    ? async (s: DashboardState) => {
        try {
          await fetch("/api/persist-state", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(s),
          });
        } catch {
          // no-op: keep UX uninterrupted, surface errors only on explicit save flows
        }
      }
    : undefined;

  return (
    <>
      <Header user={user} onSignIn={onSignIn} onSignOut={onSignOut} isSampleData={isSampleData} />
      <Dashboard initialState={initialState} onPersist={onPersist} isSampleData={isSampleData} />
    </>
  );
}
