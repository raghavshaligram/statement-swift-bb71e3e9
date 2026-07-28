import { useCallback, useRef, useState } from "react";
import { Upload, FileText, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

export type InlineConvertResult = { count: number; warnings: string[] };

type State =
  | { phase: "idle" }
  | { phase: "working" }
  | { phase: "done"; result: InlineConvertResult; fileName: string }
  | { phase: "error"; message: string };

export function InlineConverter({
  accept,
  sourceLabel,
  targetLabel,
  onConvert,
}: {
  /** File input accept string, e.g. ".csv" or ".ofx,.qfx" */
  accept: string;
  sourceLabel: string;
  targetLabel: string;
  /**
   * Does the real work: read the file, parse it, map to Transaction[], and
   * trigger the export/download itself (via the existing exportTo* function
   * for that format) -- this component only owns the UI state around that
   * call, not the conversion logic, which stays in each route file so it
   * can use its own specific parser + exporter pair.
   */
  onConvert: (file: File) => Promise<InlineConvertResult>;
}) {
  const [state, setState] = useState<State>({ phase: "idle" });
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setState({ phase: "working" });
      try {
        const result = await onConvert(file);
        setState({ phase: "done", result, fileName: file.name });
      } catch (err) {
        setState({
          phase: "error",
          message: err instanceof Error ? err.message : "Something went wrong while converting this file.",
        });
      }
    },
    [onConvert]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  if (state.phase === "working") {
    return (
      <div className="mt-5 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-emerald/40 bg-emerald-soft/30 px-6 py-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald" />
        <span className="text-sm font-semibold text-ink">Converting…</span>
      </div>
    );
  }

  if (state.phase === "done") {
    return (
      <div className="mt-5 rounded-xl border-2 border-emerald/40 bg-emerald-soft/30 px-6 py-8 text-center">
        <CheckCircle2 className="mx-auto h-9 w-9 text-emerald" />
        <div className="mt-3 text-sm font-semibold text-ink">
          {state.result.count} transaction{state.result.count === 1 ? "" : "s"} converted
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Your {targetLabel} file downloaded automatically.</p>
        {state.result.warnings.length > 0 && (
          <div className="mx-auto mt-4 max-w-sm space-y-1 text-left">
            {state.result.warnings.map((w, i) => (
              <div key={i} className="flex gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                {w}
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => setState({ phase: "idle" })}
          className="mt-5 rounded-md border border-border bg-background px-4 py-2 text-xs font-semibold text-ink transition hover:bg-surface-muted"
        >
          Convert another {sourceLabel} file
        </button>
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="mt-5 rounded-xl border-2 border-rose-300 bg-rose-50 px-6 py-8 text-center">
        <AlertTriangle className="mx-auto h-9 w-9 text-rose-500" />
        <div className="mt-3 text-sm font-semibold text-ink">Couldn't convert this file</div>
        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">{state.message}</p>
        <button
          onClick={() => setState({ phase: "idle" })}
          className="mt-5 rounded-md border border-border bg-background px-4 py-2 text-xs font-semibold text-ink transition hover:bg-surface-muted"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      className={`mt-5 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
        dragOver ? "border-emerald bg-emerald-soft/60" : "border-border bg-surface-muted/40 hover:border-emerald hover:bg-emerald-soft/50"
      }`}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald text-primary-foreground">
        <Upload className="h-5 w-5" />
      </span>
      <span className="text-sm font-semibold text-ink">Drag and drop your {sourceLabel} file here</span>
      <span className="text-xs text-muted-foreground">or click to browse your files</span>
      <span className="mt-1 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="rounded-md bg-surface-muted px-2 py-0.5 flex items-center gap-1">
          <FileText className="h-3 w-3" /> {sourceLabel}
        </span>
        <span>→</span>
        <span className="rounded-md bg-surface-muted px-2 py-0.5">{targetLabel}</span>
      </span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
