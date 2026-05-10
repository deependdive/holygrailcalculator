"use client";

import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Stat";
import { CheckCircle2, FileSpreadsheet, Loader2, UploadCloud, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Status =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "ok"; positionsImported: number; warnings: string[] }
  | { kind: "err"; message: string };

export function UploadForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [fileName, setFileName] = useState<string | null>(null);
  const router = useRouter();

  const submit = async (file: File) => {
    setStatus({ kind: "uploading" });
    setFileName(file.name);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload-workbook", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setStatus({ kind: "err", message: json.error ?? "upload failed" });
        return;
      }
      setStatus({ kind: "ok", positionsImported: json.positionsImported, warnings: json.warnings ?? [] });
      // Soft refresh — RSC will re-fetch from supabase
      router.refresh();
    } catch (e) {
      setStatus({ kind: "err", message: (e as Error).message });
    }
  };

  return (
    <Card>
      <CardHeader title="Workbook Upload" subtitle="Accepted: .xlsx · max 10 MB" />
      <CardBody className="space-y-4">
        <label
          htmlFor="file"
          className="flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-lg py-10 cursor-pointer hover:border-brand/50 hover:bg-panel2/40"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) submit(f);
          }}
        >
          <UploadCloud className="w-7 h-7 text-muted" />
          <div className="text-sm">
            <span className="text-text">Drop a .xlsx here</span>
            <span className="text-muted"> or click to browse</span>
          </div>
          {fileName && (
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <FileSpreadsheet className="w-4 h-4" /> {fileName}
            </div>
          )}
          <input
            id="file"
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) submit(f);
            }}
          />
        </label>

        {status.kind === "uploading" && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="w-4 h-4 animate-spin" /> Parsing & saving...
          </div>
        )}

        {status.kind === "ok" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-good">
              <CheckCircle2 className="w-4 h-4" />
              Imported {status.positionsImported} position{status.positionsImported === 1 ? "" : "s"}.
            </div>
            {status.warnings.length > 0 && (
              <div className="text-xs text-warn">
                <div className="font-medium mb-1">Warnings:</div>
                <ul className="list-disc list-inside space-y-0.5">
                  {status.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
            <Link href="/" className="inline-block mt-2 text-sm text-brand hover:underline">
              View dashboard →
            </Link>
          </div>
        )}

        {status.kind === "err" && (
          <div className="flex items-start gap-2 text-sm text-bad">
            <XCircle className="w-4 h-4 mt-0.5" />
            <div>
              <div>Upload failed.</div>
              <div className="text-xs text-bad/80">{status.message}</div>
            </div>
          </div>
        )}

        <div className="text-xs text-muted pt-2">
          <Pill tone="muted">Tip</Pill>{" "}
          We read these cells: <span className="font-mono">C5, C6, C10, C11, M5, M6, M8, F10</span>{" "}
          and the positions table starting at row 24.
        </div>
      </CardBody>
    </Card>
  );
}
