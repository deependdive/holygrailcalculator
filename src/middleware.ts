import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

// Refreshes the Supabase session cookie on every request so RSCs see the
// up-to-date auth state.
export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(toSet) {
          toSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          toSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();
  return res;
}

export const config = {
  matcher: [
    // Skip Next internals, static assets, and the OAuth callback (which writes
    // cookies of its own and shouldn't be racing with middleware).
    "/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
