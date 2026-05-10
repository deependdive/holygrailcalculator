import { parseHolygrailWorkbook } from "@/lib/parseWorkbook";
import { persistDashboardForCurrentUser } from "@/lib/state-actions";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not signed in" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "no file" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "file too large (>10 MB)" }, { status: 413 });
  }

  let result;
  try {
    const buf = await file.arrayBuffer();
    result = parseHolygrailWorkbook(buf);
  } catch (e) {
    return NextResponse.json({ error: "couldn't parse workbook: " + (e as Error).message }, { status: 400 });
  }

  const persist = await persistDashboardForCurrentUser(result.state);
  if (!persist.ok) {
    return NextResponse.json({ error: persist.error ?? "persist failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    warnings: result.warnings,
    positionsImported: result.state.positions.length,
  });
}
