"use client";

import { Pill } from "@/components/ui/Stat";
import { LogIn, LogOut, Upload, User } from "lucide-react";
import Link from "next/link";

export function Header({
  user,
  onSignIn,
  onSignOut,
  isSampleData,
}: {
  user: { email?: string | null; name?: string | null; avatarUrl?: string | null } | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isSampleData: boolean;
}) {
  return (
    <header className="sticky top-0 z-10 bg-bg/85 backdrop-blur border-b border-border">
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-semibold tracking-tight">
            Holy Grail <span className="text-muted font-normal">· Trading Dashboard</span>
          </Link>
          {isSampleData && <Pill tone="warn">Sample data</Pill>}
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/upload"
                className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-border bg-panel hover:border-brand/50"
              >
                <Upload className="w-4 h-4" /> Upload workbook
              </Link>
              <div className="flex items-center gap-2 px-2 py-1 rounded-md border border-border bg-panel">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt="" className="w-5 h-5 rounded-full" />
                ) : (
                  <User className="w-4 h-4 text-muted" />
                )}
                <span className="text-xs text-muted truncate max-w-[160px]">{user.name ?? user.email}</span>
              </div>
              <button
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-border bg-panel hover:border-bad/50 hover:text-bad"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </>
          ) : (
            <button
              onClick={onSignIn}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-brand text-white hover:bg-brand/90"
            >
              <LogIn className="w-4 h-4" /> Sign in with Google
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
