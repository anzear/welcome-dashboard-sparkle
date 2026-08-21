import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  JOURNEY_STATUS_META,
  loadMaterialRows,
  type MaterialRow,
} from "@/lib/materialPipelineData";
import { DEMO_FLAG_KEY, getDemoRows } from "@/lib/demoPipelineRows";
import MaterialPipelineCompare from "@/components/MaterialPipelineCompare";

type Measure = "spend" | "emissions" | "volume" | "applications";

const MEASURES: { key: Measure; label: string }[] = [
  { key: "spend", label: "Spend" },
  { key: "emissions", label: "Emissions" },
  { key: "volume", label: "Volume" },
  { key: "applications", label: "Applications" },
];

const measureValue = (r: MaterialRow, m: Measure): number | null => {
  switch (m) {
    case "spend":
      return r.annualSpend;
    case "emissions":
      return r.ghgContribution;
    case "volume":
      return r.annualVolume;
    case "applications":
      return r.applicationCount;
  }
};

const ALL = "__all__";

const fmt = (v: number | null, digits = 0) =>
  v == null ? "—" : v.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: 0 });

function Cell({
  value,
  computed = false,
  digits = 0,
}: {
  value: number | null;
  computed?: boolean;
  digits?: number;
}) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  return (
    <span
      className={cn(
        "tabular-nums",
        computed && "text-muted-foreground italic decoration-dotted underline underline-offset-4"
      )}
      title={computed ? "Computed value" : undefined}
    >
      {fmt(value, digits)}
    </span>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-7 w-auto min-w-[9rem] text-[11px]">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL} className="text-[11px]">
          {label}: All
        </SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o} className="text-[11px]">
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function MaterialPipelineList() {
  const navigate = useNavigate();
  const [realRows, setRealRows] = useState<MaterialRow[]>([]);
  const [showDemo, setShowDemo] = useState<boolean>(
    () => typeof window !== "undefined" && localStorage.getItem(DEMO_FLAG_KEY) === "on"
  );
  const rows = useMemo(
    () => (showDemo ? [...realRows, ...getDemoRows()] : realRows),
    [realRows, showDemo]
  );
  const [view, setView] = useState<"list" | "compare">("list");
  const [scope, setScope] = useState<"all" | "introduce" | "replace">("all");
  const [measure, setMeasure] = useState<Measure>("spend");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<Record<string, string>>({
    materialClass: ALL,
    group: ALL,
    status: ALL,
    owner: ALL,
    tag: ALL,
    entryType: ALL,
    priority: ALL,
  });

  useEffect(() => {
    const load = () => setRealRows(loadMaterialRows());
    load();
    window.addEventListener("storage", load);
    window.addEventListener("portfolioUpdated", load);
    window.addEventListener("materialBriefUpdated", load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("portfolioUpdated", load);
      window.removeEventListener("materialBriefUpdated", load);
    };
  }, []);

  const uniq = (vals: (string | undefined)[]) =>
    Array.from(new Set(vals.filter((v): v is string => !!v))).sort();

  const options = useMemo(
    () => ({
      materialClass: uniq(rows.map((r) => r.materialClass)),
      group: uniq(rows.map((r) => r.customerMaterialGroup)),
      status: uniq(rows.map((r) => r.journeyStatus)),
      owner: uniq(rows.map((r) => r.owner)),
      tag: uniq(rows.flatMap((r) => r.applicationCategories)),
      entryType: uniq(rows.map((r) => r.entryType)),
    }),
    [rows]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filters.materialClass !== ALL && r.materialClass !== filters.materialClass) return false;
      if (filters.group !== ALL && r.customerMaterialGroup !== filters.group) return false;
      if (filters.status !== ALL && r.journeyStatus !== filters.status) return false;
      if (filters.owner !== ALL && r.owner !== filters.owner) return false;
      if (filters.tag !== ALL && !r.applicationCategories.includes(filters.tag)) return false;
      if (filters.entryType !== ALL && r.entryType !== filters.entryType) return false;
      if (scope !== "all" && r.intent !== scope) return false;
      if (filters.priority !== ALL) {
        const wantsYes = filters.priority === "Yes";
        if (r.prioritySelected !== wantsYes) return false;
      }
      if (q) {
        const hay = `${r.name} ${r.customerMaterialIds}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, filters, search, scope]);

  const { ranked, unranked } = useMemo(() => {
    const ranked = filtered
      .filter((r) => measureValue(r, measure) != null)
      .sort((a, b) => (measureValue(b, measure) as number) - (measureValue(a, measure) as number));
    const unranked = filtered.filter((r) => measureValue(r, measure) == null);
    return { ranked, unranked };
  }, [filtered, measure]);

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) filtered.forEach((r) => next.delete(r.id));
      else filtered.forEach((r) => next.add(r.id));
      return next;
    });

  const headerCls = "px-3 py-2 text-[9px] uppercase tracking-widest font-semibold text-muted-foreground whitespace-nowrap";
  const cellCls = "px-3 py-2.5 text-xs align-middle";

  const renderRow = (r: MaterialRow, rank: number | null) => {
    const status = JOURNEY_STATUS_META[r.journeyStatus] || JOURNEY_STATUS_META.not_started;
    return (
      <tr
        key={r.id}
        className="border-t border-border hover:bg-muted/40 cursor-pointer transition-colors"
        onClick={() => navigate(r.href)}
      >
        {/* reserved indicator slot */}
        <td className="w-6" />
        <td className={cn(cellCls, "w-8")} onClick={(e) => e.stopPropagation()}>
          <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggleRow(r.id)} />
        </td>
        <td className={cn(cellCls, "w-10 text-[10px] tabular-nums text-muted-foreground")}>
          {rank == null ? "—" : rank}
        </td>
        <td className={cellCls}>
          <div className="font-medium text-foreground flex items-center gap-1.5">
            {r.name}
            {r.id.startsWith("demo::") && (
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground border border-border rounded px-1 py-px">
                Demo
              </span>
            )}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {r.materialClass || "—"}
          </div>
        </td>
        <td className={cn(cellCls, "text-right")}>
          <Cell value={r.annualVolume} />
        </td>
        <td className={cn(cellCls, "text-right")}>
          <Cell value={r.unitPrice} computed={r.unitPriceComputed} digits={2} />
        </td>
        <td className={cn(cellCls, "text-right")}>
          <Cell value={r.annualSpend} computed={r.annualSpendComputed} />
        </td>
        <td className={cn(cellCls, "text-right")}>
          <Cell value={r.ghgFactor} computed={r.ghgFactorComputed} digits={2} />
        </td>
        <td className={cn(cellCls, "text-right")}>
          <Cell value={r.ghgContribution} computed={r.ghgContributionComputed} />
        </td>
        <td className={cn(cellCls, "text-right")}>
          <Cell value={r.supplierCount} />
        </td>
        <td className={cellCls}>
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] whitespace-nowrap",
              status.chip
            )}
          >
            {status.label}
          </span>
        </td>
        <td className={cellCls}>{r.owner || <span className="text-muted-foreground">—</span>}</td>
        <td className={cellCls}>
          {r.prioritySelected ? (
            <span
              className="inline-flex items-center gap-1 text-[10px] text-foreground"
              title={r.priorityPeriod ? `Priority period · ${r.priorityPeriod}` : "Priority period"}
            >
              <Star className="w-3 h-3 fill-current" />
              {r.priorityPeriod || "Priority period"}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </td>
        <td className={cellCls}>
          {r.applicationCategories.length ? (
            <div className="flex flex-wrap gap-1">
              {r.applicationCategories.slice(0, 3).map((t) => (
                <Badge key={t} variant="secondary" className="text-[9px] px-1.5 py-0 font-normal">
                  {t}
                </Badge>
              ))}
              {r.applicationCategories.length > 3 && (
                <span className="text-[10px] text-muted-foreground">
                  +{r.applicationCategories.length - 3}
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <section className="rounded-lg border-2 border-border bg-card">
      {/* Control bar */}
      <div className="px-4 py-3 border-b-2 border-border space-y-3">
        {/* View is the primary navigation for this workspace. */}
        <div className="flex items-center justify-between gap-3 flex-wrap pb-3 border-b border-border">
          <div className="inline-flex rounded-md border border-border bg-muted p-0.5">
            {([
              { key: "list", label: "List view" },
              { key: "compare", label: "Compare view" },
            ] as const).map((v) => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={cn(
                  "px-2.5 py-1 rounded-[5px] text-[11px] transition-colors",
                  view === v.key
                    ? "bg-foreground text-background shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={showDemo ? "secondary" : "outline"}
              className="h-7 text-[11px] gap-1"
              onClick={() => {
                const next = !showDemo;
                setShowDemo(next);
                localStorage.setItem(DEMO_FLAG_KEY, next ? "on" : "off");
              }}
            >
              <Sparkles className="w-3 h-3" />
              {showDemo ? "Hide demo data" : "Populate demo data"}
            </Button>
            <Button size="sm" disabled className="h-7 text-[11px] gap-1">
              <Plus className="w-3 h-3" />
              Add material
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex rounded-md border border-border bg-muted p-0.5">
            {([
              { key: "all", label: "All materials" },
              { key: "introduce", label: "New materials" },
              { key: "replace", label: "Substitute source" },
            ] as const).map((v) => (
              <button
                key={v.key}
                onClick={() => setScope(v.key)}
                className={cn(
                  "px-2.5 py-1 rounded-[5px] text-[11px] transition-colors",
                  scope === v.key
                    ? "bg-foreground text-background shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
          {view === "list" && (
            <>
              <span className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground">
                Ranked by
              </span>
              <div className="inline-flex rounded-md border border-border bg-muted p-0.5">
                {MEASURES.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setMeasure(m.key)}
                    className={cn(
                      "px-2.5 py-1 rounded-[5px] text-[11px] transition-colors",
                      measure === m.key
                        ? "bg-foreground text-background shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground">
                ranking {ranked.length} of {filtered.length}
              </span>
            </>
          )}
          {view === "compare" && (
            <span className="text-[10px] text-muted-foreground">
              comparing {filtered.length} materials
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or material ID"
              className="h-7 pl-7 text-[11px] w-56"
            />
          </div>
          <FilterSelect
            label="Class"
            value={filters.materialClass}
            onChange={(v) => setFilters((f) => ({ ...f, materialClass: v }))}
            options={options.materialClass}
          />
          <FilterSelect
            label="Group"
            value={filters.group}
            onChange={(v) => setFilters((f) => ({ ...f, group: v }))}
            options={options.group}
          />
          <Select
            value={filters.status}
            onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
          >
            <SelectTrigger className="h-7 w-auto min-w-[9rem] text-[11px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL} className="text-[11px]">Status: All</SelectItem>
              {options.status.map((s) => (
                <SelectItem key={s} value={s} className="text-[11px]">
                  {JOURNEY_STATUS_META[s]?.label || s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FilterSelect
            label="Owner"
            value={filters.owner}
            onChange={(v) => setFilters((f) => ({ ...f, owner: v }))}
            options={options.owner}
          />
          <FilterSelect
            label="Tag"
            value={filters.tag}
            onChange={(v) => setFilters((f) => ({ ...f, tag: v }))}
            options={options.tag}
          />
          <FilterSelect
            label="Entry type"
            value={filters.entryType}
            onChange={(v) => setFilters((f) => ({ ...f, entryType: v }))}
            options={options.entryType}
          />
          <Select
            value={filters.priority}
            onValueChange={(v) => setFilters((f) => ({ ...f, priority: v }))}
          >
            <SelectTrigger className="h-7 w-auto min-w-[9rem] text-[11px]">
              <SelectValue placeholder="Priority period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL} className="text-[11px]">Priority period: All</SelectItem>
              <SelectItem value="Yes" className="text-[11px]">Selected as priority</SelectItem>
              <SelectItem value="No" className="text-[11px]">Not selected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
            <span className="text-[11px] font-semibold">{selected.size} selected</span>
            <div className="flex items-center gap-1.5 ml-auto">
              <Button size="sm" variant="outline" disabled className="h-6 text-[10px]">Set status</Button>
              <Button size="sm" variant="outline" disabled className="h-6 text-[10px]">Set owner</Button>
              <Button size="sm" variant="outline" disabled className="h-6 text-[10px]">Add tag</Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[10px]"
                onClick={() => setSelected(new Set())}
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </div>

      {view === "compare" ? (
        <MaterialPipelineCompare rows={filtered} />
      ) : filtered.length === 0 ? (
        <div className="px-4 py-10 text-center text-xs text-muted-foreground">
          No materials match the current filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="bg-muted/30">
                <th className="w-6" />
                <th className={cn(headerCls, "w-8")}>
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                </th>
                <th className={cn(headerCls, "w-10 text-left")}>#</th>
                <th className={cn(headerCls, "text-left")}>Name</th>
                <th className={cn(headerCls, "text-right")}>Volume (t/yr)</th>
                <th className={cn(headerCls, "text-right")}>Price (€/kg)</th>
                <th className={cn(headerCls, "text-right")}>Spend (€)</th>
                <th className={cn(headerCls, "text-right")}>GHG factor (kgCO₂e/kg)</th>
                <th className={cn(headerCls, "text-right")}>GHG (tCO₂e/yr)</th>
                <th className={cn(headerCls, "text-right")}>Suppliers</th>
                <th className={cn(headerCls, "text-left")}>Status</th>
                <th className={cn(headerCls, "text-left")} title="Period the material is prioritised for">Priority period</th>
                <th className={cn(headerCls, "text-left")}>Owner</th>
                <th className={cn(headerCls, "text-left")}>Tags</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r, i) => renderRow(r, i + 1))}
              {unranked.length > 0 && (
                <tr className="border-t border-border bg-muted/20">
                  <td colSpan={14} className="px-3 py-1.5 text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                    No figure — no {MEASURES.find((m) => m.key === measure)?.label.toLowerCase()} value ({unranked.length})
                  </td>
                </tr>
              )}
              {unranked.map((r) => renderRow(r, null))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
