import React, { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRegister } from "@/components/materialRegister/registerStore";
import { LABEL } from "@/components/materialRegister/entryFields";
import {
  CSV_COLUMNS,
  autoMatch,
  downloadCsv,
  parseCsv,
  rowToMaterial,
  rowsToCsv,
  splitList,
  templateCsv,
  validateRows,
  type ParsedRow,
} from "@/components/materialRegister/materialEntry";
import { Upload } from "lucide-react";

type Stage = "pick" | "map" | "preview" | "done";

const UNMAPPED = "__ignore__";

interface Result {
  added: number;
  warnings: number;
  skipped: number;
  ids: string[];
  batchId: string;
  skippedCsv: string | null;
}

export const CsvUploadPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { data, addMaterials, removeMaterials, mergeCustomerIds } = useRegister();
  const fileRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>("pick");
  const [filename, setFilename] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [bodyRows, setBodyRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<(string | null)[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [dragging, setDragging] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const ignoredHeaders = headers.filter((_, i) => !mapping[i]);

  const counts = useMemo(() => {
    const errors = rows.filter((r) => r.state === "error").length;
    const warnings = rows.filter((r) => r.state === "warning").length;
    return { total: rows.length, ready: rows.length - errors, warnings, errors };
  }, [rows]);

  const readFile = async (file: File) => {
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.length === 0) return;
    const [head, ...body] = parsed;
    setFilename(file.name);
    setHeaders(head);
    setBodyRows(body);
    setMapping(autoMatch(head));
    setStage("map");
  };

  const toPreview = () => {
    setRows(validateRows(bodyRows, mapping, data));
    setStage("preview");
  };

  const runImport = () => {
    const batchId = `BATCH-${Date.now()}`;
    const importable = rows.filter((r) => r.state !== "error");
    const merges = importable.filter((r) => r.duplicateOf && r.resolution === "merge");
    const adds = importable.filter((r) => !(r.duplicateOf && r.resolution === "merge"));

    merges.forEach((r) =>
      mergeCustomerIds(
        r.duplicateOf!.material_id,
        splitList(r.values.customer_material_ids),
        filename,
        batchId,
      ),
    );

    const ids = addMaterials(
      adds.map((r) => rowToMaterial(r, filename)),
      { batchOrigin: "baselining", source: filename, batchId },
    );

    const skipped = rows.filter((r) => r.state === "error");
    const skippedCsv = skipped.length
      ? rowsToCsv(
          [...headers, "_reason"],
          skipped.map((r) => {
            const reason = Object.values(r.cells)
              .filter((c) => c.state === "error" && c.message)
              .map((c) => c.message)
              .join("; ");
            return [...(bodyRows[r.index] ?? []), reason];
          }),
        )
      : null;

    setResult({
      added: ids.length + merges.length,
      warnings: importable.filter((r) => r.state === "warning").length,
      skipped: skipped.length,
      ids,
      batchId,
      skippedCsv,
    });
    setStage("done");
  };

  const undoImport = () => {
    if (!result) return;
    removeMaterials(result.ids, result.batchId);
    setResult(null);
    setStage("pick");
  };

  const cellClass = (state: string) =>
    state === "error"
      ? "bg-destructive/10 text-destructive"
      : state === "warning"
        ? "bg-amber-500/10 text-amber-700"
        : undefined;

  return (
    <div className="space-y-4">
      {stage === "pick" && (
        <>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) void readFile(f);
            }}
            className={cn(
              "flex flex-col items-center gap-2 rounded-md border border-dashed p-8 text-center",
              dragging ? "border-primary bg-primary/5" : "border-border",
            )}
          >
            <Upload className="h-5 w-5 text-muted-foreground" />
            <div className="text-[11px] text-muted-foreground">Drop a .csv file here</div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void readFile(f);
              }}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px]"
              onClick={() => fileRef.current?.click()}
            >
              Choose file
            </Button>
          </div>
          <button
            type="button"
            onClick={() => downloadCsv("material-prioritisation-template.csv", templateCsv())}
            className="text-[11px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            Download template
          </button>
          <p className="text-[10px] text-muted-foreground">
            Blank cells import as no value — never as zero.
          </p>
        </>
      )}

      {stage === "map" && (
        <>
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-[11px] font-medium text-foreground">
              Column mapping — <span className="font-mono">{filename}</span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              <span className="font-mono tabular-nums">{bodyRows.length}</span> rows detected
            </div>
          </div>
          <div className="max-h-[45vh] overflow-auto rounded-md border border-border">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="sticky top-0 bg-muted/60 text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                  <th className="px-2 py-1.5">Detected header</th>
                  <th className="px-2 py-1.5">First value</th>
                  <th className="px-2 py-1.5">Target field</th>
                </tr>
              </thead>
              <tbody>
                {headers.map((h, i) => (
                  <tr key={`${h}-${i}`} className="border-t border-border/60">
                    <td className="px-2 py-1 font-mono">{h || <span className="opacity-50">(blank)</span>}</td>
                    <td className="px-2 py-1 text-muted-foreground">
                      {bodyRows[0]?.[i]?.trim() || <span className="opacity-50">—</span>}
                    </td>
                    <td className="px-2 py-1">
                      <Select
                        value={mapping[i] ?? UNMAPPED}
                        onValueChange={(v) =>
                          setMapping((prev) =>
                            prev.map((x, j) => (j === i ? (v === UNMAPPED ? null : v) : x)),
                          )
                        }
                      >
                        <SelectTrigger className="h-6 w-64 text-[11px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNMAPPED} className="text-[11px]">
                            Ignore this column
                          </SelectItem>
                          {CSV_COLUMNS.map((c) => (
                            <SelectItem key={c.field} value={c.field} className="text-[11px]">
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {ignoredHeaders.length > 0 && (
            <p className="text-[10px] text-muted-foreground">
              Ignored, nothing lost silently: {ignoredHeaders.map((h) => h || "(blank)").join(", ")}
            </p>
          )}
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-7 text-[11px]" onClick={toPreview}>
              Validate rows
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => setStage("pick")}>
              Back
            </Button>
          </div>
        </>
      )}

      {stage === "preview" && (
        <>
          <div className="text-[11px] font-medium text-foreground">
            <span className="font-mono tabular-nums">{counts.total}</span> rows —{" "}
            <span className="font-mono tabular-nums">{counts.ready}</span> ready,{" "}
            <span className="font-mono tabular-nums text-amber-700">{counts.warnings}</span> warnings,{" "}
            <span className="font-mono tabular-nums text-destructive">{counts.errors}</span> errors
          </div>
          <p className="text-[10px] text-muted-foreground">
            Rows with errors are skipped, the rest import. Two bad rows never fail the file.
          </p>
          <div className="max-h-[45vh] overflow-auto rounded-md border border-border">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="sticky top-0 bg-muted/60 text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                  <th className="px-2 py-1.5">Row</th>
                  {CSV_COLUMNS.filter((c) => expanded || mapping.includes(c.field)).map((c) => (
                    <th key={c.field} className="whitespace-nowrap px-2 py-1.5">
                      {c.label}
                    </th>
                  ))}
                  <th className="px-2 py-1.5">Duplicate</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.index} className="border-t border-border/60 align-top">
                    <td className="px-2 py-1 font-mono tabular-nums text-muted-foreground">{r.index + 1}</td>
                    {CSV_COLUMNS.filter((c) => expanded || mapping.includes(c.field)).map((c) => {
                      const cell = r.cells[c.field];
                      return (
                        <td
                          key={c.field}
                          title={cell.message ?? undefined}
                          className={cn("px-2 py-1", cellClass(cell.state))}
                        >
                          {cell.raw.trim() === "" ? (
                            <span className="text-muted-foreground/50">—</span>
                          ) : (
                            cell.raw
                          )}
                        </td>
                      );
                    })}
                    <td className="whitespace-nowrap px-2 py-1">
                      {r.duplicateOf ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="text-amber-700">
                            {r.duplicateOf.name} ({r.duplicateOf.matchedOn === "cas_number" ? "CAS" : "name"})
                          </span>
                          <select
                            value={r.resolution}
                            onChange={(e) =>
                              setRows((prev) =>
                                prev.map((x) =>
                                  x.index === r.index
                                    ? { ...x, resolution: e.target.value as "add" | "merge" }
                                    : x,
                                ),
                              )
                            }
                            className="rounded-sm border border-border bg-background px-1 py-0.5 text-[10px]"
                          >
                            <option value="add">Add as new</option>
                            <option value="merge">Merge customer IDs</option>
                          </select>
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" className="h-7 text-[11px]" onClick={runImport} disabled={counts.ready === 0}>
              Import {counts.ready} rows
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => setStage("map")}>
              Back to mapping
            </Button>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-[10px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
            >
              {expanded ? "Show mapped columns only" : "Show all supported columns"}
            </button>
          </div>
        </>
      )}

      {stage === "done" && result && (
        <div className="space-y-3">
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-2 py-2 text-[11px] text-emerald-800">
            <span className="font-mono tabular-nums">{result.added}</span> materials added,{" "}
            <span className="font-mono tabular-nums">{result.warnings}</span> with warnings,{" "}
            <span className="font-mono tabular-nums">{result.skipped}</span> skipped.
          </div>
          <p className="text-[10px] text-muted-foreground">
            Loaded figures are recorded as ingested from <span className="font-mono">{filename}</span>, and the
            history entries are baselining — a starting position, not team activity.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" className="h-7 text-[11px]" onClick={onClose}>
              Done
            </Button>
            {result.skippedCsv && (
              <button
                type="button"
                onClick={() => downloadCsv(`skipped-rows-${filename}`, result.skippedCsv!)}
                className="text-[11px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
              >
                Download {result.skipped} skipped rows
              </button>
            )}
            <button
              type="button"
              onClick={undoImport}
              className="text-[11px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
            >
              Undo this import
            </button>
          </div>
        </div>
      )}

      <p className="border-t border-border pt-3 text-[10px] text-muted-foreground">
        Have a large or messy list?{" "}
        <a
          href="mailto:data@vcg.ai?subject=Material%20list%20for%20loading"
          className="underline decoration-dotted underline-offset-2 hover:text-foreground"
        >
          Send it to us and we will clean and load it for you.
        </a>
      </p>
    </div>
  );
};

export default CsvUploadPanel;
