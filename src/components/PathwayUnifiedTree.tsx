// One tree for every pathway in scope.
//
// Five columns — Feedstock, Process, Material, Application, TRL — each deduplicated
// on its own and paged from its own header. Edges only join nodes that are both on a
// visible page. Hover traces, click pins and filters the other columns.

import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface UnifiedTreeRow {
  originalIndex: number;
  feedstock: string;
  technology: string;
  product: string;
  application: string;
  trl: string;
}

type ColKey = 'feedstock' | 'technology' | 'product' | 'application' | 'trl';

const COLUMNS: { key: ColKey; label: string; green?: boolean }[] = [
  { key: 'feedstock', label: 'Feedstock' },
  { key: 'technology', label: 'Process' },
  { key: 'product', label: 'Material', green: true },
  { key: 'application', label: 'Application' },
  { key: 'trl', label: 'TRL' },
];

const PAGE = 8;

const trlNum = (trl: string) => parseInt(String(trl).replace(/[^0-9]/g, ''), 10) || 0;
const trlBand = (trl: string) => {
  const n = trlNum(trl);
  return n >= 9 ? 'Commercial' : n >= 5 ? 'Pilot to Scale-up' : 'Lab to Pilot';
};
const trlTone = (trl: string) => {
  const n = trlNum(trl);
  return n >= 9
    ? 'border-emerald-500/40 bg-emerald-500/[0.07] text-emerald-700'
    : n >= 5
      ? 'border-blue-500/40 bg-blue-500/[0.07] text-blue-700'
      : 'border-amber-500/40 bg-amber-500/[0.07] text-amber-700';
};

export const PathwayUnifiedTree: React.FC<{
  rows: UnifiedTreeRow[];
  onOpenPathway?: (originalIndex: number) => void;
}> = ({ rows, onOpenPathway }) => {
  const [pins, setPins] = useState<Partial<Record<ColKey, string>>>({});
  const [hover, setHover] = useState<{ col: ColKey; value: string } | null>(null);
  const [page, setPage] = useState<Record<ColKey, number>>({
    feedstock: 0, technology: 0, product: 0, application: 0, trl: 0,
  });

  // Pins narrow the pathway set every column is computed from.
  const scoped = useMemo(
    () => rows.filter((r) => COLUMNS.every(({ key }) => !pins[key] || r[key] === pins[key])),
    [rows, pins],
  );

  const columns = useMemo(() => {
    return COLUMNS.map(({ key }) => {
      const counts = new Map<string, number>();
      scoped.forEach((r) => {
        const v = r[key];
        if (!v) return;
        counts.set(v, (counts.get(v) ?? 0) + 1);
      });
      let values = [...counts.entries()];
      values.sort(key === 'trl'
        ? (a, b) => trlNum(a[0]) - trlNum(b[0])
        : (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
      return { key, values };
    });
  }, [scoped]);

  // Nodes on screen right now, per column.
  const visible = useMemo(() => {
    const map = {} as Record<ColKey, { name: string; count: number }[]>;
    columns.forEach(({ key, values }) => {
      const start = (page[key] ?? 0) * PAGE;
      map[key] = values.slice(start, start + PAGE).map(([name, count]) => ({ name, count }));
    });
    return map;
  }, [columns, page]);

  // Pathways touched by the hovered (or pinned) node — used to trace.
  const traced = useMemo(() => {
    if (!hover) return null;
    return new Set(scoped.filter((r) => r[hover.col] === hover.value).map((r) => r.originalIndex));
  }, [hover, scoped]);

  // --- edge geometry -------------------------------------------------------
  const wrapRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [edges, setEdges] = useState<{ d: string; on: boolean }[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const pairs = useMemo(() => {
    const out: { a: string; b: string; on: boolean }[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < COLUMNS.length - 1; i++) {
      const from = COLUMNS[i].key;
      const to = COLUMNS[i + 1].key;
      const fromSet = new Set(visible[from]?.map((n) => n.name));
      const toSet = new Set(visible[to]?.map((n) => n.name));
      scoped.forEach((r) => {
        if (!fromSet.has(r[from]) || !toSet.has(r[to])) return;
        const a = `${from}:${r[from]}`;
        const b = `${to}:${r[to]}`;
        const k = `${a}|${b}`;
        const on = traced ? traced.has(r.originalIndex) : false;
        if (seen.has(k)) {
          if (on) {
            const found = out.find((e) => `${e.a}|${e.b}` === k);
            if (found) found.on = true;
          }
          return;
        }
        seen.add(k);
        out.push({ a, b, on });
      });
    }
    return out;
  }, [visible, scoped, traced]);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => {
      const base = wrap.getBoundingClientRect();
      setSize({ w: base.width, h: base.height });
      const next: { d: string; on: boolean }[] = [];
      pairs.forEach(({ a, b, on }) => {
        const ea = nodeRefs.current.get(a);
        const eb = nodeRefs.current.get(b);
        if (!ea || !eb) return;
        const ra = ea.getBoundingClientRect();
        const rb = eb.getBoundingClientRect();
        const x1 = ra.right - base.left;
        const y1 = ra.top + ra.height / 2 - base.top;
        const x2 = rb.left - base.left;
        const y2 = rb.top + rb.height / 2 - base.top;
        const mx = (x1 + x2) / 2;
        next.push({ d: `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`, on });
      });
      next.sort((p, q) => Number(p.on) - Number(q.on));
      setEdges(next);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [pairs]);

  const togglePin = (col: ColKey, value: string) => {
    setPins((prev) => {
      const next = { ...prev };
      if (next[col] === value) delete next[col];
      else next[col] = value;
      return next;
    });
    setPage({ feedstock: 0, technology: 0, product: 0, application: 0, trl: 0 });
  };

  const pinCount = Object.keys(pins).length;
  const soloPathway = pinCount > 0 && scoped.length === 1 ? scoped[0] : null;

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <div className="flex items-center justify-between gap-3 px-4 py-2 bg-muted/40 border-b border-border">
        <div className="flex items-center gap-2 flex-wrap">
          {pinCount === 0 ? (
            <span className="text-[10px] text-muted-foreground">
              {scoped.length} pathways · one tree
            </span>
          ) : (
            <>
              <span className="text-[10px] text-muted-foreground">Pinned:</span>
              {(Object.entries(pins) as [ColKey, string][]).map(([col, value]) => (
                <button
                  key={col}
                  onClick={() => togglePin(col, value)}
                  className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                >
                  {value}
                  <X className="w-2.5 h-2.5" />
                </button>
              ))}
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {scoped.length} pathway{scoped.length === 1 ? '' : 's'}
              </span>
              {soloPathway && onOpenPathway && (
                <button
                  onClick={() => onOpenPathway(soloPathway.originalIndex)}
                  className="text-[10px] font-medium text-primary underline underline-offset-2"
                >
                  Open pathway
                </button>
              )}
            </>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          Hover to trace · click to pin and filter the other columns
        </span>
      </div>

      <div className="px-4 py-2 bg-amber-500/[0.07] border-b border-amber-500/20 text-[10px] text-amber-800 leading-relaxed">
        Columns can span multiple pages — page each column from its header. Edges only connect nodes on the
        pages currently shown, so a node can look unconnected when its partner is on another page.
      </div>

      <div ref={wrapRef} className="relative px-4 py-4 overflow-x-auto">
        <svg
          className="absolute inset-0 pointer-events-none"
          width={size.w}
          height={size.h}
        >
          {edges.map((e, i) => (
            <path
              key={i}
              d={e.d}
              fill="none"
              stroke={e.on ? 'hsl(var(--primary))' : 'currentColor'}
              className={e.on ? '' : 'text-border'}
              strokeWidth={e.on ? 1.6 : 1}
              opacity={traced ? (e.on ? 0.9 : 0.25) : 0.5}
            />
          ))}
        </svg>

        <div className="relative grid gap-5 min-w-[900px]" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
          {columns.map(({ key, values }) => {
            const col = COLUMNS.find((c) => c.key === key)!;
            const p = page[key] ?? 0;
            const pages = Math.max(1, Math.ceil(values.length / PAGE));
            const start = p * PAGE;
            return (
              <div key={key} className="min-w-0">
                <div className="mb-2">
                  <div className={`text-[10px] font-semibold uppercase tracking-widest ${col.green ? 'text-emerald-700' : 'text-muted-foreground'}`}>
                    {col.label}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {pages > 1
                        ? `${start + 1}–${Math.min(start + PAGE, values.length)} of ${values.length}`
                        : `${values.length} distinct`}
                    </span>
                    {pages > 1 && (
                      <span className="flex items-center gap-0.5">
                        <button
                          onClick={() => setPage((s) => ({ ...s, [key]: Math.max(0, p - 1) }))}
                          disabled={p === 0}
                          className="h-4 w-4 flex items-center justify-center rounded border border-border text-muted-foreground disabled:opacity-30 hover:text-foreground"
                          aria-label={`Previous ${col.label} page`}
                        >
                          <ChevronLeft className="w-2.5 h-2.5" />
                        </button>
                        <button
                          onClick={() => setPage((s) => ({ ...s, [key]: Math.min(pages - 1, p + 1) }))}
                          disabled={p >= pages - 1}
                          className="h-4 w-4 flex items-center justify-center rounded border border-border text-muted-foreground disabled:opacity-30 hover:text-foreground"
                          aria-label={`Next ${col.label} page`}
                        >
                          <ChevronRight className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {visible[key]?.map(({ name, count }) => {
                    const pinned = pins[key] === name;
                    const isTraced = traced
                      ? scoped.some((r) => r[key] === name && traced.has(r.originalIndex))
                      : false;
                    const dim = traced && !isTraced;
                    const tone = key === 'trl'
                      ? trlTone(name)
                      : key === 'product'
                        ? 'border-emerald-500/40 bg-emerald-500/[0.05] text-emerald-700'
                        : 'border-border bg-background text-foreground';
                    return (
                      <button
                        key={name}
                        ref={(el) => {
                          const id = `${key}:${name}`;
                          if (el) nodeRefs.current.set(id, el);
                          else nodeRefs.current.delete(id);
                        }}
                        onMouseEnter={() => setHover({ col: key, value: name })}
                        onMouseLeave={() => setHover(null)}
                        onClick={() => togglePin(key, name)}
                        className={`w-full text-left rounded-md border px-2.5 py-2 transition-all ${tone} ${
                          pinned ? 'ring-1 ring-primary shadow-sm' : 'hover:shadow-sm'
                        } ${dim ? 'opacity-40' : ''}`}
                      >
                        {key === 'trl' ? (
                          <div className="text-center leading-tight">
                            <div className="text-[10px] font-bold">{name}</div>
                            <div className="text-[9px] opacity-80">{trlBand(name)}</div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] leading-tight flex-1 min-w-0 break-words">{name}</span>
                            <span className="text-[9px] text-muted-foreground tabular-nums shrink-0">{count}</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                  {(!visible[key] || visible[key].length === 0) && (
                    <div className="text-[10px] text-muted-foreground px-1">—</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-2 bg-muted/30 border-t border-border text-[10px] text-muted-foreground leading-relaxed">
        Each column is deduplicated on its own, so a left-to-right line through this diagram shows what is{' '}
        <span className="font-semibold text-foreground">connected</span>, not a single pathway — two edges that meet
        at a node may belong to different pathways. Pin nodes to resolve real, openable pathways.
      </div>
    </div>
  );
};

export default PathwayUnifiedTree;
