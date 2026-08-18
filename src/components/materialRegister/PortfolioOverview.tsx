import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useRegister } from "@/components/materialRegister/registerStore";
import { EMPTY_FILTERS, type Filters } from "@/components/materialRegister/registerStore";
import BulkActionDialog, { type BulkKind } from "@/components/materialRegister/BulkActionDialog";
import { StatusPill } from "@/components/materialRegister/primitives";
import { JUDGED_CRITERIA } from "@/config/assessmentCriteria";
import {
  datePassed,
  hasOverdueCondition,
  holdReviewOverdue,
  overdueConditions,
  todayIso,
} from "@/components/materialRegister/gate";
import {
  PRODUCT_LINES,
  SCOPE_UNTAGGED,
  productLinesOf,
  type Scope,
} from "@/components/materialRegister/productLines";
import type { Material } from "@/types/materialPrioritisation";

export type OverviewTab = "register" | "grid" | "assessment";

interface Props {
  /** Drilling in sets the scope and opens a tab. The overview itself is global. */
  onEnter: (tab: OverviewTab, opts?: { scope?: Scope; filters?: Partial<Filters>; extras?: () => void }) => void;
}

const eur = (v: number) => {
  if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `€${(v / 1_000).toFixed(0)}k`;
  return `€${v.toFixed(0)}`;
};

const nf = new Intl.NumberFormat("en-GB");

const daysBetween = (isoA: string, isoB: string) =>
  Math.round((Date.parse(isoB) - Date.parse(isoA)) / 86_400_000);

/** How long the oldest overdue gate item has been overdue. Never a score. */
const overdueDays = (m: Material) => {
  const now = todayIso();
  const dates: string[] = overdueConditions(m).map((c) => c.due_date);
  if (holdReviewOverdue(m) && m.hold_review_date) dates.push(m.hold_review_date);
  const oldest = dates.sort()[0];
  return oldest ? daysBetween(oldest, now) : 0;
};

const Count: React.FC<{ n: number; label: string }> = ({ n, label }) => (
  <div className="flex items-baseline gap-2">
    <span className="font-mono text-2xl font-medium tabular-nums text-foreground">{nf.format(n)}</span>
    <span className="text-[11px] leading-tight text-muted-foreground">{label}</span>
  </div>
);

const Card: React.FC<{ title: string; subtitle?: string; children: React.ReactNode; aside?: React.ReactNode }> = ({
  title,
  subtitle,
  children,
  aside,
}) => (
  <section className="rounded-xl border border-border bg-card p-4">
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {aside}
    </div>
    {children}
  </section>
);

const PortfolioOverview: React.FC<Props> = ({ onEnter }) => {
  const {
    allMaterials,
    assessments,
    assessmentState,
    openBrief,
    applyBulk,
  } = useRegister();

  const [orderOpen, setOrderOpen] = useState(false);

  /** Entry counts per material. An absent key means nobody has recorded a view. */
  const entryCount = useMemo(() => {
    const map = new Map<string, number>();
    Object.values(assessments).forEach((e) => {
      map.set(e.material_id, (map.get(e.material_id) ?? 0) + 1);
    });
    return map;
  }, [assessments]);

  const rows = allMaterials;
  const total = rows.length;
  const assessed = rows.filter((m) => (entryCount.get(m.material_id) ?? 0) > 0).length;
  const gatesSet = rows.filter((m) => m.journey_status !== "under_evaluation").length;
  const onHold = rows.filter((m) => m.journey_status === "hold").length;
  const spendNoJudgement = rows.filter(
    (m) => m.annual_spend !== null && (entryCount.get(m.material_id) ?? 0) === 0,
  ).length;

  /* ------------------------------------------------------------ VCG coverage
   * Stated as assessed / not assessed. Never a percentage complete, never a
   * target, never a score.
   * ---------------------------------------------------------------------- */
  const vcg = useMemo(() => {
    const sub = rows.filter((m) => m.substitutability_readiness !== "not_assessed").length;
    const sup = rows.filter((m) => m.supplier_availability?.assessed).length;
    const comp = rows.filter((m) => m.competitor_activity !== "not_assessed").length;
    const none = rows.filter(
      (m) =>
        m.substitutability_readiness === "not_assessed" &&
        !m.supplier_availability?.assessed &&
        m.competitor_activity === "not_assessed",
    );
    return {
      lines: [
        { label: "Substitutability", count: sub },
        { label: "Suppliers", count: sup },
        { label: "Competitor activity", count: comp },
      ],
      none,
    };
  }, [rows]);

  /* -------------------------------------------------------- Where to look first
   * Four separate rules. They are never ranked against each other and never
   * merged: one list per rule, each stating the figure it ranks on.
   * ---------------------------------------------------------------------- */
  const bySpend = (a: Material, b: Material) => (b.annual_spend ?? -1) - (a.annual_spend ?? -1);

  const unassessedSpend = useMemo(
    () =>
      rows
        .filter((m) => m.annual_spend !== null && (entryCount.get(m.material_id) ?? 0) === 0)
        .sort(bySpend),
    [rows, entryCount],
  );

  const establishedSpend = useMemo(
    () =>
      rows
        .filter((m) => m.substitutability_readiness === "established" && m.annual_spend !== null)
        .sort(bySpend),
    [rows],
  );

  const overdueGate = useMemo(
    () =>
      rows
        .filter((m) => hasOverdueCondition(m) || holdReviewOverdue(m))
        .sort((a, b) => overdueDays(b) - overdueDays(a)),
    [rows],
  );

  const disagree = useMemo(
    () =>
      rows
        .map((m) => {
          const split = JUDGED_CRITERIA.map((c) => ({
            criterion: c,
            state: assessmentState(m.material_id, c.criterion_id),
          })).filter((x) => x.state.flag === "split");
          return { m, split };
        })
        .filter((x) => x.split.length > 0)
        .sort((a, b) => (b.split[0].state.spread ?? 0) - (a.split[0].state.spread ?? 0)),
    [rows, assessmentState],
  );

  const Row: React.FC<{ m: Material; figure: React.ReactNode }> = ({ m, figure }) => (
    <button
      type="button"
      onClick={() => openBrief(m.material_id)}
      className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left hover:bg-muted/60"
    >
      <span className="min-w-0 flex-1 truncate text-[11px] text-foreground">{m.name}</span>
      <span className="whitespace-nowrap font-mono text-[11px] tabular-nums text-muted-foreground">
        {figure}
      </span>
      <StatusPill status={m.journey_status} />
    </button>
  );

  const List: React.FC<{
    title: string;
    rule: string;
    empty: string;
    seeAll: () => void;
    children: React.ReactNode;
    count: number;
  }> = ({ title, rule, empty, seeAll, children, count }) => (
    <div className="rounded-lg border border-border bg-background p-3">
      <h3 className="text-[11px] font-semibold text-foreground">{title}</h3>
      <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">{rule}</p>
      <div className="mt-2 space-y-0.5">
        {count === 0 ? <p className="px-1.5 py-1 text-[11px] text-muted-foreground">{empty}</p> : children}
      </div>
      {count > 0 && (
        <button
          type="button"
          onClick={seeAll}
          className="mt-2 text-[10px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
        >
          See all {count}
        </button>
      )}
    </div>
  );

  /* ------------------------------------------------------------ product lines
   * Rows double-count materials used in several lines. Stated below, and there
   * is deliberately no total row.
   * ---------------------------------------------------------------------- */
  const lineRows = useMemo(() => {
    const build = (label: string, value: Scope, members: Material[]) => ({
      label,
      value,
      count: members.length,
      assessed: members.filter((m) => (entryCount.get(m.material_id) ?? 0) > 0).length,
      gates: members.filter((m) => m.journey_status !== "under_evaluation").length,
      spend: members.reduce((sum, m) => sum + (m.annual_spend ?? 0), 0),
    });
    const list = PRODUCT_LINES.map((line) =>
      build(line, line, rows.filter((m) => productLinesOf(m).includes(line))),
    );
    const untagged = rows.filter((m) => productLinesOf(m).length === 0);
    if (untagged.length > 0) list.push(build("Untagged", SCOPE_UNTAGGED, untagged));
    return list;
  }, [rows, entryCount]);

  return (
    <div className="space-y-4">
      {/* The overview never obeys the scope selector — it is what you read to
          decide which scope to enter. */}
      <p className="text-xs text-muted-foreground">
        All <span className="font-mono tabular-nums text-foreground">{total}</span> materials, every
        product line.
      </p>

      <Card title="Where the portfolio stands">
        <div className="flex flex-wrap items-baseline gap-x-10 gap-y-3">
          <Count n={total} label="materials" />
          <Count n={assessed} label="assessed by at least one team" />
          <Count n={gatesSet} label="gates set" />
          <Count n={onHold} label="on hold" />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {spendNoJudgement > 0
            ? `${spendNoJudgement} materials carry spend but no team judgement yet.`
            : "Every material carrying spend has at least one team judgement recorded."}
        </p>
      </Card>

      <Card title="VCG data coverage" subtitle="Stated as assessed or not assessed. No target, no score.">
        <div className="space-y-2">
          {vcg.lines.map((l) => (
            <div key={l.label} className="flex items-center gap-3">
              <span className="w-40 shrink-0 text-[11px] text-muted-foreground">{l.label}</span>
              <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-provenance-vcg"
                  style={{ width: total === 0 ? "0%" : `${(l.count / total) * 100}%` }}
                />
              </div>
              <span className="w-28 shrink-0 text-right font-mono text-[11px] tabular-nums text-foreground">
                {l.count} of {total}
                <span className="text-muted-foreground"> assessed</span>
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-xs text-muted-foreground">
            {vcg.none.length === 0
              ? "Every material carries at least one VCG signal."
              : `${vcg.none.length} materials have no VCG signals. Ordering intelligence fills them.`}
          </p>
          {vcg.none.length > 0 && (
            <button
              type="button"
              onClick={() => setOrderOpen(true)}
              className="rounded-md border border-provenance-vcg/40 bg-provenance-vcg/10 px-2 py-1 text-[11px] font-medium text-provenance-vcg hover:bg-provenance-vcg/15"
            >
              Order intelligence for {vcg.none.length} materials
            </button>
          )}
        </div>
      </Card>

      <Card
        title="Where to look first"
        subtitle="Four rules, kept apart. Nothing here is combined into one ordering."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <List
            title="Highest spend, nobody has assessed"
            rule="Ranked by annual spend, among materials with zero assessment entries."
            empty="Every material with spend has been assessed."
            count={unassessedSpend.length}
            seeAll={() =>
              onEnter("register", { filters: { notAssessed: true }, extras: undefined })
            }
          >
            {unassessedSpend.slice(0, 3).map((m) => (
              <Row key={m.material_id} m={m} figure={eur(m.annual_spend ?? 0)} />
            ))}
          </List>

          <List
            title="Highest spend with an established path"
            rule="Ranked by annual spend, among materials where VCG substitutability is Established."
            empty="No material carries an established path yet."
            count={establishedSpend.length}
            seeAll={() => onEnter("register", { filters: { vcgSubstitutability: ["established"] } })}
          >
            {establishedSpend.slice(0, 3).map((m) => (
              <Row key={m.material_id} m={m} figure={eur(m.annual_spend ?? 0)} />
            ))}
          </List>

          <List
            title="Gate work overdue"
            rule="Materials with an overdue condition or an overdue hold review. Ranked by how long overdue."
            empty="No overdue gate work."
            count={overdueGate.length}
            seeAll={() => onEnter("register", { filters: { gateOverdue: true } })}
          >
            {overdueGate.slice(0, 3).map((m) => (
              <Row key={m.material_id} m={m} figure={`${overdueDays(m)}d overdue`} />
            ))}
          </List>

          <List
            title="Teams disagree"
            rule="Materials carrying the divergence flag on a judged criterion."
            empty="No criterion is split."
            count={disagree.length}
            seeAll={() => onEnter("assessment", { filters: { teamsDisagree: true } })}
          >
            {disagree.slice(0, 3).map(({ m, split }) => (
              <Row
                key={m.material_id}
                m={m}
                figure={
                  <span className="font-sans text-[10px]">
                    {split[0].criterion.label} · {split[0].state.low}–{split[0].state.high}
                  </span>
                }
              />
            ))}
          </List>
        </div>
      </Card>

      <Card title="By product line" subtitle="Pick a line to work through it in the register.">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="py-1.5 text-left font-medium">Product line</th>
              <th className="py-1.5 text-right font-medium">Materials</th>
              <th className="py-1.5 text-right font-medium">Assessed</th>
              <th className="py-1.5 text-right font-medium">Gates set</th>
              <th className="py-1.5 text-right font-medium">Spend</th>
            </tr>
          </thead>
          <tbody>
            {lineRows.map((r) => (
              <tr
                key={String(r.value)}
                onClick={() => onEnter("register", { scope: r.value })}
                className={cn(
                  "cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/60",
                  r.value === SCOPE_UNTAGGED && "text-muted-foreground",
                )}
              >
                <td className="py-1.5 text-foreground">{r.label}</td>
                <td className="py-1.5 text-right font-mono tabular-nums">{r.count}</td>
                <td className="py-1.5 text-right font-mono tabular-nums">{r.assessed}</td>
                <td className="py-1.5 text-right font-mono tabular-nums">{r.gates}</td>
                <td className="py-1.5 text-right font-mono tabular-nums">{eur(r.spend)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Materials used in several product lines count in each. Figures do not sum to portfolio totals.
        </p>
      </Card>

      {/* Same order flow as the per-material one, pre-filled with the materials
          carrying no VCG signals. */}
      <BulkActionDialog
        kind={orderOpen ? ("intelligence" as BulkKind) : null}
        materials={vcg.none}
        hiddenCount={0}
        ownerOptions={[]}
        productSuggestions={[]}
        applicationSuggestions={[]}
        tagSuggestions={[]}
        periodSuggestions={[]}
        onCancel={() => setOrderOpen(false)}
        onApply={(payload) => {
          applyBulk(payload, new Set(vcg.none.map((m) => m.material_id)));
          setOrderOpen(false);
        }}
      />
    </div>
  );
};

export default PortfolioOverview;
export { EMPTY_FILTERS };
export const datePassedRef = datePassed;
