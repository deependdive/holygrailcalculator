# Holy Grail · Trading Dashboard

A web port of the `claude_trading_holygrail.xlsx` workbook. The homepage is the
workbook recreated as an interactive dashboard; sign in with Google to upload your
own workbook and see your live numbers.

Stack: **Next.js 14 (App Router) + TypeScript + Tailwind + Supabase (auth + Postgres) + SheetJS + Recharts + lucide-react**.

Formulas from the workbook are ported verbatim to a pure-TS engine in
`src/lib/calculations.ts`. Every input on the page recomputes the rest live.

---

## 1. Local setup

```bash
cd holygrail
npm install
cp .env.local.example .env.local   # already filled in if you got this from me
npm run dev
```

App runs at http://localhost:3000.

The `.env.local` you got from me already has:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` ← **rotate this in Supabase after we're done**
- `NEXT_PUBLIC_SITE_URL=http://localhost:3000` ← change to your Vercel URL after deploy

## 2. Run the database migration

In Supabase Studio (https://app.supabase.com/project/xjarxqpmcwbnncpfbkvh):

1. Open **SQL Editor → New query**.
2. Paste the contents of `supabase/migrations/20260510000000_init.sql`.
3. **Run**.

This creates `profiles`, `dashboard_settings`, `positions`, RLS policies, and an
`auth.users` insert trigger that auto-provisions a profile + settings row on first
sign-in.

## 3. Configure Google OAuth

### a) Google Cloud Console
1. https://console.cloud.google.com → **APIs & Services → Credentials**
2. **Create OAuth client ID → Web application**
3. Authorized redirect URIs — add **all** of these:
   - `https://xjarxqpmcwbnncpfbkvh.supabase.co/auth/v1/callback`
   - (later) `https://<your-vercel-app>.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback`
4. Save the Client ID + Client Secret.

> ⚠️ You sent me the callback URL `https://holygrail.supabase.co/auth/v1/callback`,
> but your project URL is `https://xjarxqpmcwbnncpfbkvh.supabase.co`. Unless you've
> set up a **custom domain** for Supabase Auth (Pro plan), use the project URL
> form above. If you do have a custom domain, also register that variant.

### b) Supabase
1. Studio → **Authentication → Providers → Google → Enable**.
2. Paste the Client ID + Client Secret.
3. Studio → **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000` (then update to your Vercel URL after deploy)
   - **Redirect URLs**: add `http://localhost:3000/auth/callback` and your Vercel URL `/auth/callback`.

## 4. Try it

1. `npm run dev` → http://localhost:3000.
2. You'll see the dashboard with sample data (₹10,00,000 starting capital, same stocks as the source workbook).
3. Click **Sign in with Google** (top-right) → complete OAuth.
4. Click **Upload workbook** → drop in `claude_trading_holygrail.xlsx`.
5. Dashboard re-renders with your numbers. Edits autosave (1s debounce) to your row in Supabase.

## 5. Deploy to Vercel

You said you'd link the repo and either deploy via Vercel UI or push from the terminal.

### One-time setup in Vercel
After connecting the repo:
1. **Settings → Environment Variables** — add the same four variables from `.env.local`. Set `NEXT_PUBLIC_SITE_URL` to your Vercel URL (e.g. `https://holygrail.vercel.app`).
2. Push the branch / click **Deploy**.

### Then come back here and:
1. Add the new Vercel URL to Supabase **Auth → URL Configuration → Redirect URLs**.
2. Add `https://<your-vercel-app>.vercel.app/auth/callback` to Google Cloud Console.
3. Update `NEXT_PUBLIC_SITE_URL` in Vercel env vars to the production URL.
4. Redeploy.

## 6. What's where

```
src/
├── app/
│   ├── page.tsx                    # Home / dashboard (RSC; reads user state)
│   ├── upload/page.tsx             # /upload workbook flow
│   ├── auth/callback/route.ts      # OAuth code exchange
│   └── api/
│       ├── upload-workbook/route.ts  # Server route — parses .xlsx → Supabase
│       └── persist-state/route.ts    # Autosave endpoint
├── components/
│   ├── AppShell.tsx                # Client-only auth + persist wiring
│   ├── Dashboard.tsx               # Layout + recompute on input change
│   ├── SLCalculator.tsx            # B3:C20 of the workbook
│   ├── CapitalAllocation.tsx       # L3:N15
│   ├── RiskSummary.tsx             # E13:H20
│   ├── RiskFramework.tsx           # E3:J7 lookup
│   ├── OpenPositions.tsx           # B22:R34, fully editable
│   ├── KeyRules.tsx
│   ├── Header.tsx                  # Google sign-in button
│   ├── UploadForm.tsx
│   └── ui/                         # Card, Field, Stat primitives
├── lib/
│   ├── calculations.ts             # Pure-TS port of every formula
│   ├── types.ts                    # Schemas
│   ├── sampleData.ts               # ₹10L sample dataset
│   ├── parseWorkbook.ts            # .xlsx → DashboardState
│   ├── state-actions.ts            # Server actions for load/persist
│   ├── supabaseServer.ts
│   └── supabaseClient.ts
├── middleware.ts                   # Refreshes Supabase session cookie
└── globals.css
supabase/
└── migrations/20260510000000_init.sql
```

## 7. Calculation reference

All formulas are in `src/lib/calculations.ts`. Each is annotated with its
originating cell coordinate. Quick map:

| Workbook cell | Field                | Formula                                   |
|---------------|----------------------|-------------------------------------------|
| C7            | Risk Engine          | lookup(marketCondition) → 0.25/0.50/0.75% |
| C8            | Portfolio Value      | = M10 (Ending Capital)                    |
| C9            | Risk Amount          | = C8 × C7                                 |
| C12           | SL %                 | = (C10 − C11)/C10                         |
| C13           | Calculated Position  | = (C9/(C10−C11)) × C10                    |
| C14           | Final Position       | = MIN(C13, C8 × C6)                       |
| C15           | Quantity             | = floor(C14/C10)                          |
| C16           | Actual Risk          | = (C10 − C11) × C15                       |
| C17           | Real Risk %          | = C16/C8                                  |
| C20           | Cap Status           | "Cap Hit" if C14 < C13 else "Within Limits" |
| M7            | CC − IA              | = M5 − M6                                 |
| M9            | P&L                  | = M8 − M7                                 |
| M10           | Ending Capital       | = M5 + M9                                 |
| M11           | Exposure             | = M6/M5                                   |
| M13           | Gain/Loss %          | = (M10 − M5)/M5                           |
| H{row}        | per-pos SL %         | = (EP − SL)/EP                            |
| I{row}        | per-pos Qty          | = floor(allocation × cap@entry / EP)      |
| J{row}        | per-pos Risk         | = (EP − SL) × Qty                         |
| L{row}        | per-pos Risk %       | = Risk / Portfolio Value                  |
| M{row}        | per-pos Cap Req      | = allocation × cap@entry                  |
| N{row}        | per-pos Buying Power | = Cap Req / Portfolio Value               |
| Risk Summary  | Heat                 | Σ (per-pos Risk %) over Active rows       |
| Risk Summary  | Weighted Avg SL %    | Σ(Cap Req × SL %) / Σ Cap Req              |

## 8. Open questions / decisions made

- **"Active Trades" (F10)** — left as an editable input; the workbook had it
  hardcoded. If you'd rather it auto-derive from `count(positions where status=Active)`,
  delete the input and call the count instead — one-line change in
  `CapitalAllocation.tsx`.
- **Sector / Setup columns** — were blank in your workbook. I put placeholder
  values in the sample dataset (Industrials, Breakout, etc.) and made the
  parser tolerant of empty cells. If you fill those in your workbook before
  re-uploading, they'll pass through.
- **Recommendation logic** — I interpreted "trading recommendation" as the SL
  Calculator's output (qty + final position INR for a candidate trade). If you
  meant something else (a buy/hold/sell signal column, a screen of stocks to
  consider, etc.), tell me what rule should drive it and I'll add a column.

## 9. Security notes

- The **service_role key** in `.env.local` bypasses RLS — never put it in
  client code. Currently it's wired but **unused** — every read/write goes
  through the user-scoped server client. Rotate it in Supabase after we're done
  since it was shared in chat.
- All tables have RLS scoped to `auth.uid()`. A signed-in user can only see/edit
  their own rows.
- Cookies use the default secure flags from `@supabase/ssr`. Sessions refresh
  in `middleware.ts` on every request.
