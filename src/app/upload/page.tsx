import { UploadForm } from "@/components/UploadForm";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-2">Upload your workbook</h1>
      <p className="text-muted text-sm mb-6">
        Drop in a .xlsx that follows the same layout as the template (single &ldquo;Master Dashboard&rdquo; sheet,
        positions in rows 24+, columns B → R). We&apos;ll parse the inputs and recompute everything client-side.
      </p>
      <UploadForm />
    </main>
  );
}
