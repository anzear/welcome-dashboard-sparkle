import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScopeChip, TargetRef } from "./IndicatorPrimitives";
import {
  INDICATORS, METHOD_TAGS, SCOPE_TARGET_KEYS, TARGET_POSITION_LABELS, affectedPathwayIds, emptyIndicatorTarget,
  findIndicatorValue, type IndicatorDefinition, type IndicatorTarget, type IndicatorTargetKey, type IndicatorValue,
  type MethodTag, useHitlStore,
} from "@/lib/hitlStore";
import { cn } from "@/lib/utils";

type Outcome = "created" | "corrected" | "exists" | "justification" | "invalid";
type ExistingMode = "skip" | "correct";
type RawRow = { indicator: string; feedstock: string; process: string; product: string; application: string; value: string; unit: string; valueDate: string; justification: string; method: string; methodDetail: string; note: string };
type BulkRow = RawRow & { key: string; definition: IndicatorDefinition | null; target: IndicatorTarget; errors: string[]; warnings: string[]; duplicate: boolean; existingId: string | null; existingMode: ExistingMode; outcome?: Outcome; recordId?: string; pathwayCount?: number };

const normalize = (value: string | null | undefined) => (value ?? "").trim().toLocaleLowerCase();
const methodFromLabel = (value: string): MethodTag | null => METHOD_TAGS.find(tag => normalize(tag.label) === normalize(value) || tag.value === normalize(value).replace(/\s+/g, "_"))?.value ?? null;
const emptyRaw = (): RawRow => ({ indicator: "", feedstock: "", process: "", product: "", application: "", value: "", unit: "", valueDate: "", justification: "", method: "", methodDetail: "", note: "" });
const parseNumber = (raw: string, definition: IndicatorDefinition): number | null | undefined => {
  if (!raw.trim()) return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return undefined;
  if (definition.value_type === "trl" && (!Number.isInteger(value) || value < 1 || value > 9)) return undefined;
  if (definition.value_type === "count" && (!Number.isInteger(value) || value < 0)) return undefined;
  return value;
};
const targetIdentity = (definition: IndicatorDefinition, target: IndicatorTarget) => `${definition.key}|${SCOPE_TARGET_KEYS[definition.scope].map(key => normalize(target[key])).join("|")}`;

function buildRows(rawRows: RawRow[], existingValues: IndicatorValue[]): { rows: BulkRow[]; duplicates: number } {
  const seen = new Set<string>(); let duplicates = 0;
  const rows = rawRows.slice(0, 200).map((raw, index) => {
    const definition = INDICATORS.find(item => normalize(item.label) === normalize(raw.indicator)) ?? null;
    const supplied: Record<IndicatorTargetKey, string> = { feedstock: raw.feedstock.trim(), process: raw.process.trim(), product: raw.product.trim(), application: raw.application.trim() };
    const target: IndicatorTarget = { ...emptyIndicatorTarget };
    const errors: string[] = []; const warnings: string[] = [];
    if (!definition) errors.push("Unknown indicator");
    if (definition) {
      const used = SCOPE_TARGET_KEYS[definition.scope];
      used.forEach(key => { target[key] = supplied[key] || null; });
      const missing = used.filter(key => !supplied[key]).map(key => TARGET_POSITION_LABELS[key]);
      const ignored = (Object.keys(supplied) as IndicatorTargetKey[]).filter(key => !used.includes(key) && supplied[key]).map(key => TARGET_POSITION_LABELS[key]);
      if (missing.length) errors.push(`Missing ${missing.join(", ")}`);
      if (ignored.length) warnings.push(`Ignored: ${ignored.join(", ")}`);
      if (parseNumber(raw.value, definition) === undefined) errors.push("Invalid value");
      if (!raw.value.trim()) warnings.push("No value");
    }
    const identity = definition ? targetIdentity(definition, target) : `invalid-${index}`;
    const duplicate = Boolean(definition) && seen.has(identity);
    if (duplicate) duplicates += 1; else if (definition) seen.add(identity);
    const existing = definition ? findIndicatorValue(existingValues, definition.key, target) : null;
    return { ...raw, key: `${index}-${identity}`, definition, target, errors, warnings, duplicate, existingId: existing?.id ?? null, existingMode: "skip" as const };
  });
  return { rows, duplicates };
}

const parsePaste = (text: string): RawRow[] => text.split(/\r?\n/).filter(line => line.trim()).map(line => {
  const parts = line.split(";"); const row = emptyRaw();
  [row.indicator, row.feedstock, row.process, row.product, row.application, row.value, row.unit, row.valueDate] = Array.from({ length: 8 }, (_, index) => parts[index] ?? "");
  return row;
});

export const downloadBulkIndicatorValuesTemplate = () => {
  const headers = ["Indicator", "Feedstock", "Process", "Product", "Application", "Value", "Unit", "Value date", "Justification", "Method", "Method detail", "Note"];
  const example = ["Product price", "", "", "Lactic acid", "", 1650, "EUR/t", "2026-06-30", "Average of three European quotes", "Expert judgement", "Quotes reviewed for comparable grades", "Optional note"];
  const sheet = XLSX.utils.aoa_to_sheet([headers, example]); const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, sheet, "Indicator values"); XLSX.writeFile(workbook, "bulk-indicator-values-template.xlsx");
};

function OutcomeChip({ outcome }: { outcome: Outcome }) {
  const labels: Record<Outcome, string> = { created: "Created", corrected: "Corrected", exists: "Skipped: exists", justification: "Skipped: no justification", invalid: "Invalid" };
  return <Badge variant="outline" className={cn("inline-flex h-6 items-center gap-1 whitespace-nowrap px-2 text-xs font-normal", outcome === "created" || outcome === "corrected" ? "border-primary/30 bg-primary/10 text-primary" : outcome === "invalid" ? "border-destructive/30 bg-destructive/10 text-destructive" : "text-muted-foreground")}>{labels[outcome]}</Badge>;
}

export function BulkAddIndicatorValuesDialog({ open, onClose, onOpenRecord }: { open: boolean; onClose: () => void; onOpenRecord: (id: string) => void }) {
  const store = useHitlStore(); const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1); const [paste, setPaste] = useState(""); const [rows, setRows] = useState<BulkRow[]>([]); const [uploadRows, setUploadRows] = useState<RawRow[]>([]); const [uploadError, setUploadError] = useState(""); const [pendingReview, setPendingReview] = useState(false);
  const [allJustification, setAllJustification] = useState(""); const [allMethod, setAllMethod] = useState<MethodTag>("expert_judgement"); const [allMethodDetail, setAllMethodDetail] = useState(""); const [allDate, setAllDate] = useState(""); const [allNote, setAllNote] = useState("");
  const sourceRows = uploadRows.length ? uploadRows : parsePaste(paste); const built = useMemo(() => buildRows(sourceRows, store.indicatorValues), [paste, uploadRows, store.indicatorValues]); const activeRows = rows.length ? rows : built.rows; const overLimit = sourceRows.length > 200;
  const reset = () => { setStep(1); setPaste(""); setRows([]); setUploadRows([]); setUploadError(""); setPendingReview(false); setAllJustification(""); setAllMethod("expert_judgement"); setAllMethodDetail(""); setAllDate(""); setAllNote(""); };
  useEffect(() => { if (open) reset(); }, [open]);
  const updateRow = (key: string, patch: Partial<BulkRow>) => setRows(current => current.map(row => row.key === key ? { ...row, ...patch } : row));
  const validSourceRows = activeRows.filter(row => !row.duplicate && row.definition && row.errors.length === 0);
  const beginReview = () => { setRows(built.rows); setStep(2); };
  const readUpload = async (file: File) => {
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" }); const sheet = workbook.Sheets[workbook.SheetNames[0]]; if (!sheet) return;
      const values = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const rows = values.map(value => ({ indicator: String(value.Indicator ?? ""), feedstock: String(value.Feedstock ?? ""), process: String(value.Process ?? value["Process/Technology"] ?? ""), product: String(value.Product ?? ""), application: String(value.Application ?? value["Application/Market"] ?? ""), value: String(value.Value ?? ""), unit: String(value.Unit ?? ""), valueDate: String(value["Value date"] ?? ""), justification: String(value.Justification ?? ""), method: String(value.Method ?? ""), methodDetail: String(value["Method detail"] ?? ""), note: String(value.Note ?? "") }));
      setUploadRows(rows); setRows([]); setPaste(""); setUploadError("");
    } catch { setUploadError("Could not read this file"); }
  };
  const applyAll = () => setRows(current => current.map(row => !row.duplicate && row.definition && row.errors.length === 0 ? { ...row, justification: allJustification, method: METHOD_TAGS.find(item => item.value === allMethod)?.label ?? "", methodDetail: allMethodDetail, valueDate: allDate, note: allNote } : row));
  const clearAll = () => { setAllJustification(""); setAllMethod("expert_judgement"); setAllMethodDetail(""); setAllDate(""); setAllNote(""); setRows(current => current.map(row => !row.duplicate && row.definition && row.errors.length === 0 ? { ...row, justification: "", method: "", methodDetail: "", valueDate: "", note: "" } : row)); };
  const rowWritable = (row: BulkRow) => Boolean(row.justification.trim()) && (!row.existingId || row.existingMode === "correct");
  const writeCount = validSourceRows.filter(rowWritable).length; const correctionCount = validSourceRows.filter(row => rowWritable(row) && row.existingId).length;
  const writeRows = () => {
    const batchId = `bulk-${Date.now()}`; const now = new Date().toISOString(); let numericId = Math.max(0, ...store.indicatorValues.map(item => Number(item.id.match(/\d+/)?.[0] ?? 0))); const occupied = [...store.indicatorValues];
    const results = rows.map(row => {
      if (row.duplicate || !row.definition || row.errors.length) return { ...row, outcome: "invalid" as const, pathwayCount: 0 };
      if (!row.justification.trim()) return { ...row, outcome: "justification" as const, pathwayCount: affectedPathwayIds({ scope: row.definition.scope, target: row.target }, store.pathways).length };
      const existing = findIndicatorValue(occupied, row.definition.key, row.target);
      if (existing && row.existingMode !== "correct") return { ...row, outcome: "exists" as const, recordId: existing.id, pathwayCount: affectedPathwayIds(existing, store.pathways).length };
      const parsedValue = parseNumber(row.value, row.definition); if (parsedValue === undefined) return { ...row, outcome: "invalid" as const, pathwayCount: 0 };
      const note = [row.note.trim(), `batch ${batchId}`].filter(Boolean).join(" · "); const methodTag = methodFromLabel(row.method) ?? "expert_judgement"; const date = row.valueDate ? new Date(`${row.valueDate.slice(0, 10)}T00:00:00.000Z`).toISOString() : null;
      if (existing) {
        const changes: [keyof IndicatorValue, unknown, unknown][] = [["corrected_value", existing.corrected_value, parsedValue], ["unit", existing.unit, row.unit.trim() || row.definition.unit], ["value_date", existing.value_date, date], ["justification", existing.justification, row.justification.trim()], ["method_tag", existing.method_tag, methodTag], ["method_detail", existing.method_detail, row.methodDetail.trim() || null], ["correction_note", existing.correction_note, note], ["corrected_at", existing.corrected_at, now], ["batch_id", existing.batch_id, batchId]];
        changes.forEach(([field, prior, next]) => { if (prior !== next) store.recordChange({ entity_type: "indicator_value", entity_id: existing.id, field, prior_value: prior, new_value: next, operation: "update", note }); });
        if (existing.status !== "accepted") store.recordChange({ entity_type: "indicator_value", entity_id: existing.id, field: "status", prior_value: existing.status, new_value: "accepted", operation: "accept", note: "bulk correction" });
        return { ...row, outcome: "corrected" as const, recordId: existing.id, pathwayCount: affectedPathwayIds(existing, store.pathways).length };
      }
      numericId += 1; const id = `iv-${String(numericId).padStart(3, "0")}`; const record: IndicatorValue = { id, created_at: now, updated_at: now, status_changed_at: now, last_actor: store.currentUser.name, trace_id: null, indicator_key: row.definition.key, scope: row.definition.scope, target: row.target, value: null, unit: row.unit.trim() || row.definition.unit, value_date: date, status: pendingReview ? "review_pending" : "accepted", corrected_value: parsedValue, correction_note: note, corrected_at: now, justification: row.justification.trim(), method_tag: methodTag, method_detail: row.methodDetail.trim() || null, batch_id: batchId };
      occupied.push(record); store.recordChange({ entity_type: "indicator_value", entity_id: id, field: null, prior_value: null, new_value: record, operation: "create", note });
      return { ...row, outcome: "created" as const, recordId: id, pathwayCount: affectedPathwayIds(record, store.pathways).length };
    });
    setRows(results); setStep(3); const created = results.filter(row => row.outcome === "created").length; const corrected = results.filter(row => row.outcome === "corrected").length; toast.success(`${created} created · ${corrected} corrected · ${results.length - created - corrected} skipped`);
  };
  const exportCsv = () => { const values = [["Indicator", "Target", "Outcome", "Record", "Pathways"], ...rows.map(row => [row.indicator, SCOPE_TARGET_KEYS[row.definition?.scope ?? "feedstock"].map(key => row.target[key]).filter(Boolean).join(" → "), row.outcome ?? "Invalid", row.recordId ?? "", row.pathwayCount ?? 0])]; const csv = values.map(line => line.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n"); const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "indicator-values-bulk-results.csv"; anchor.click(); URL.revokeObjectURL(url); };
  const setAllExisting = (mode: ExistingMode) => setRows(current => current.map(row => row.existingId ? { ...row, existingMode: mode } : row));
  const counts = { created: rows.filter(row => row.outcome === "created").length, corrected: rows.filter(row => row.outcome === "corrected").length, skipped: rows.filter(row => row.outcome && !["created", "corrected"].includes(row.outcome)).length };
  const close = () => { reset(); onClose(); };
  return <Dialog open={open} onOpenChange={value => { if (!value) close(); }}><DialogContent className="flex max-h-[94vh] w-[min(96vw,1400px)] max-w-none flex-col overflow-hidden"><DialogHeader><DialogTitle>Bulk add indicator values</DialogTitle><DialogDescription>Add up to 200 values or placeholders in one shared audited batch.</DialogDescription></DialogHeader><div className="grid grid-cols-3 border-b pb-3">{["Rows", "Review", "Result"].map((label, index) => <div key={label} className={cn("border-b-2 pb-2 text-center text-xs font-medium", step === index + 1 ? "border-primary text-foreground" : step > index + 1 ? "border-primary/40 text-foreground" : "border-border text-muted-foreground")}>{index + 1}. {label}</div>)}</div><div className="min-h-0 flex-1 overflow-y-auto py-2">
    {step === 1 && <Tabs defaultValue="paste"><TabsList><TabsTrigger value="paste">Paste</TabsTrigger><TabsTrigger value="upload">Upload</TabsTrigger></TabsList><TabsContent value="paste" className="space-y-2"><Textarea aria-label="Indicator rows" value={paste} onChange={event => { setPaste(event.target.value); setUploadRows([]); setRows([]); }} placeholder="Indicator; Feedstock; Process; Product; Application; Value; Unit; Value date" className="min-h-52 font-mono text-xs" /><p className="text-xs text-muted-foreground">Product price;;;Lactic acid;;1650;EUR/t;2026-06-30</p></TabsContent><TabsContent value="upload"><div className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-md border border-dashed" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file && /\.(xlsx|csv)$/i.test(file.name)) void readUpload(file); }}><FileSpreadsheet className="h-7 w-7 text-muted-foreground" /><p className="text-xs text-muted-foreground">Drop a .xlsx or .csv file here, or choose a file.</p><Input ref={inputRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) void readUpload(file); }} /><Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>Choose file</Button><Button variant="link" size="sm" onClick={downloadBulkIndicatorValuesTemplate}><Download className="mr-1 h-3 w-3" />Download template</Button></div>{uploadError && <p className="mt-2 text-xs text-destructive">{uploadError}</p>}</TabsContent><p className="mt-3 text-xs text-muted-foreground">{activeRows.length} rows · {built.duplicates} duplicate rows removed</p>{overLimit && <p className="text-xs text-destructive">Maximum 200 rows per batch</p>}<div className="mt-3 overflow-x-auto rounded-md border"><Table className="min-w-[1200px]"><TableHeader><TableRow><TableHead>Indicator</TableHead><TableHead>Target</TableHead><TableHead>Value</TableHead><TableHead>Validation</TableHead></TableRow></TableHeader><TableBody>{activeRows.map(row => <TableRow key={row.key} className={row.errors.length || row.duplicate ? "opacity-60" : undefined}><TableCell className="text-xs">{row.indicator || "—"}</TableCell><TableCell className="text-xs">{row.definition ? <TargetRef iv={{ scope: row.definition.scope, target: row.target }} /> : "—"}</TableCell><TableCell className="font-mono text-xs">{row.value || "—"}</TableCell><TableCell className="text-xs"><div className="space-y-1">{row.duplicate && <p className="text-destructive">Duplicate row</p>}{row.errors.map(error => <p key={error} className="text-destructive">{error}</p>)}{row.warnings.map(warning => <p key={warning} className="text-warning-foreground">{warning}</p>)}{!row.duplicate && !row.errors.length && !row.warnings.length && <p className="text-primary">Valid</p>}</div></TableCell></TableRow>)}</TableBody></Table></div></Tabs>}
    {step === 2 && <div className="space-y-4"><div className="space-y-3 rounded-md border bg-muted/30 p-3"><p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Apply to all rows</p><div className="grid gap-2 md:grid-cols-5"><Input aria-label="Apply justification" placeholder="Justification" value={allJustification} onChange={event => setAllJustification(event.target.value)} /><Select value={allMethod} onValueChange={value => setAllMethod(value as MethodTag)}><SelectTrigger aria-label="Apply method"><SelectValue /></SelectTrigger><SelectContent>{METHOD_TAGS.map(tag => <SelectItem key={tag.value} value={tag.value}>{tag.label}</SelectItem>)}</SelectContent></Select><Input aria-label="Apply method detail" placeholder="Method detail" value={allMethodDetail} onChange={event => setAllMethodDetail(event.target.value)} /><Input aria-label="Apply value date" type="date" value={allDate} onChange={event => setAllDate(event.target.value)} /><Input aria-label="Apply note" placeholder="Note" value={allNote} onChange={event => setAllNote(event.target.value)} /></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={applyAll}>Apply</Button><Button variant="ghost" size="sm" onClick={clearAll}>Clear all</Button><span className="ml-auto text-xs text-muted-foreground">Existing:</span><Button variant="outline" size="sm" onClick={() => setAllExisting("skip")}>Skip all</Button><Button variant="outline" size="sm" onClick={() => setAllExisting("correct")}>Correct all</Button></div></div><div className="overflow-x-auto"><Table className="min-w-[2100px]"><TableHeader><TableRow><TableHead>Scope</TableHead><TableHead>Indicator</TableHead><TableHead>Target</TableHead><TableHead>Pathways</TableHead><TableHead>Value</TableHead><TableHead>Unit</TableHead><TableHead>Value date</TableHead><TableHead>Justification</TableHead><TableHead>Method</TableHead><TableHead>Existing</TableHead></TableRow></TableHeader><TableBody>{validSourceRows.map(row => { const parsed = row.definition ? parseNumber(row.value, row.definition) : undefined; return <TableRow key={row.key}><TableCell><ScopeChip scope={row.definition?.scope ?? "feedstock"} /></TableCell><TableCell className="whitespace-nowrap text-xs">{row.definition?.label}</TableCell><TableCell><TargetRef iv={{ scope: row.definition?.scope ?? "feedstock", target: row.target }} /></TableCell><TableCell className="text-xs">{affectedPathwayIds({ scope: row.definition?.scope ?? "feedstock", target: row.target }, store.pathways).length}</TableCell><TableCell><Input aria-label={`Value ${row.key}`} className="h-8 w-28 text-xs" value={row.value} onChange={event => updateRow(row.key, { value: event.target.value })} />{parsed === undefined && <p className="text-[10px] text-destructive">Invalid value</p>}</TableCell><TableCell><Input aria-label={`Unit ${row.key}`} className="h-8 w-28 text-xs" value={row.unit || row.definition?.unit || ""} onChange={event => updateRow(row.key, { unit: event.target.value })} /></TableCell><TableCell><Input aria-label={`Value date ${row.key}`} type="date" className="h-8 w-36 text-xs" value={row.valueDate.slice(0, 10)} onChange={event => updateRow(row.key, { valueDate: event.target.value })} /></TableCell><TableCell><Input aria-label={`Justification ${row.key}`} className="h-8 min-w-64 text-xs" value={row.justification} onChange={event => updateRow(row.key, { justification: event.target.value })} />{!row.justification.trim() && <p className="text-[10px] text-destructive">Justification required</p>}</TableCell><TableCell><Select value={methodFromLabel(row.method) ?? "expert_judgement"} onValueChange={value => updateRow(row.key, { method: METHOD_TAGS.find(tag => tag.value === value)?.label ?? "" })}><SelectTrigger aria-label={`Method ${row.key}`} className="h-8 min-w-40 text-xs"><SelectValue /></SelectTrigger><SelectContent>{METHOD_TAGS.map(tag => <SelectItem key={tag.value} value={tag.value}>{tag.label}</SelectItem>)}</SelectContent></Select></TableCell><TableCell>{row.existingId ? <div className="flex items-center gap-2"><Button variant="link" className="h-auto p-0 font-mono text-xs" onClick={() => onOpenRecord(row.existingId ?? "")}>Exists · {row.existingId}</Button><Select value={row.existingMode} onValueChange={value => updateRow(row.key, { existingMode: value as ExistingMode })}><SelectTrigger aria-label={`Existing action ${row.key}`} className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="skip">Skip</SelectItem><SelectItem value="correct">Correct existing</SelectItem></SelectContent></Select></div> : <Badge variant="outline" className="inline-flex h-6 items-center gap-1 whitespace-nowrap border-primary/30 bg-primary/10 px-2 text-xs text-primary">New</Badge>}</TableCell></TableRow>; })}</TableBody></Table></div><label className="flex items-center gap-2 text-xs"><Checkbox checked={pendingReview} onCheckedChange={checked => setPendingReview(checked === true)} />Create as review pending</label></div>}
    {step === 3 && <div className="space-y-3"><div className="overflow-x-auto rounded-md border"><Table><TableHeader><TableRow><TableHead>Indicator</TableHead><TableHead>Target</TableHead><TableHead>Outcome</TableHead><TableHead>Record</TableHead><TableHead>Pathways</TableHead></TableRow></TableHeader><TableBody>{rows.map(row => <TableRow key={row.key}><TableCell className="text-xs">{row.definition?.label ?? row.indicator}</TableCell><TableCell>{row.definition ? <TargetRef iv={{ scope: row.definition.scope, target: row.target }} /> : "—"}</TableCell><TableCell><OutcomeChip outcome={row.outcome ?? "invalid"} /></TableCell><TableCell>{row.recordId ? <Button variant="link" className="h-auto p-0 font-mono text-xs" onClick={() => onOpenRecord(row.recordId ?? "")}>{row.recordId}</Button> : "—"}</TableCell><TableCell>{row.pathwayCount ?? 0}</TableCell></TableRow>)}</TableBody></Table></div><p className="text-xs text-muted-foreground">{counts.created} created · {counts.corrected} corrected · {counts.skipped} skipped</p></div>}
  </div><DialogFooter className="border-t pt-3">{step === 1 && <><Button variant="outline" onClick={close}>Cancel</Button><Button disabled={!validSourceRows.length || overLimit} onClick={beginReview}>Continue</Button></>}{step === 2 && <><Button variant="outline" onClick={() => setStep(1)}>Back</Button><Button disabled={!writeCount} onClick={writeRows}>Write {writeCount} values ({correctionCount} corrections)</Button></>}{step === 3 && <><span className="mr-auto text-xs text-muted-foreground">{counts.created} created · {counts.corrected} corrected · {counts.skipped} skipped</span><Button variant="outline" onClick={exportCsv}><Download className="mr-1 h-4 w-4" />Export results CSV</Button><Button onClick={close}>Close</Button></>}</DialogFooter></DialogContent></Dialog>;
}
