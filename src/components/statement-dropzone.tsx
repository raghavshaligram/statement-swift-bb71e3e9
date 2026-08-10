/**
 * Shared drag-and-drop target for PDF statements. Used by the homepage hero
 * (compact variant) and /upload (full variant) so the drag/drop + file-input
 * logic lives in exactly one place. Callers own what happens to the files
 * (queueing them, kicking off parsing, etc.) via `onFiles`.
 */
import { useRef, useState } from "react";
import { Upload, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatementDropzone({
  variant = "full",
  multiple = true,
  onFiles,
  className,
}: {
  variant?: "compact" | "full";
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const compact = variant === "compact";

  function handleFiles(list: FileList | File[]) {
    const files = Array.from(list).filter(
      (f) =>
        f.type === "application/pdf" ||
        f.type === "image/jpeg" ||
        f.type === "image/png" ||
        f.type === "image/webp" ||
        /\.(pdf|jpe?g|png|webp|iif|csv|ofx|qfx|qif|sta|mt940|940)$/i.test(f.name),
    );
    if (files.length) onFiles(files);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      className={cn(
        "group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-card transition",
        compact ? "gap-3 px-6 py-8" : "gap-4 px-8 py-16",
        dragOver
          ? "border-emerald bg-emerald-soft/40"
          : "border-border hover:border-emerald/60 hover:bg-surface-muted",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-emerald-soft text-emerald",
          compact ? "h-10 w-10" : "h-16 w-16",
        )}
      >
        <Upload className={compact ? "h-4 w-4" : "h-7 w-7"} />
      </div>
      <div className="text-center">
        <div className={cn("font-semibold text-ink", compact ? "text-sm" : "text-lg")}>
          Drop a statement here
        </div>
        <div className={cn("mt-1 text-muted-foreground", compact ? "text-xs" : "text-sm")}>
          {compact
            ? "PDF, scan, or photo"
            : "PDF, scan, or photo — multi-file, no size cap, no page limit with Lifetime"}
        </div>
      </div>
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border bg-background text-accent-foreground",
          compact ? "px-2.5 py-0.5 text-[10px] font-medium" : "px-3 py-1 text-[11px] font-medium",
        )}
      >
        <ShieldCheck className={compact ? "h-2.5 w-2.5 text-emerald" : "h-3 w-3 text-emerald"} />
        Processed on your device — nothing uploaded, ever
      </div>
      {!compact && (
        <div className="text-center text-xs text-muted-foreground">
          PDF, JPG, PNG, or WEBP · Up to 6 pages per conversion
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept="application/pdf,image/jpeg,image/png,image/webp,.iif,.csv,text/csv,.ofx,.qfx,.qif,.sta,.mt940,.940"
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
    </div>
  );
}
