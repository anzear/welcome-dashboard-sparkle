import React, { useCallback, useEffect, useMemo, useState } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * User-defined pathway tags. Free text, user judgement — never computed, so the
 * chips stay grey: green/teal is reserved for VCG-computed values.
 * Stored per pathway index in localStorage; no sharing or ownership.
 */

const STORAGE_KEY = "pathwayTags";

export type TagMap = Record<number, string[]>;

const readStore = (): TagMap => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? (parsed as TagMap) : {};
  } catch {
    return {};
  }
};

export function usePathwayTags() {
  const [tagMap, setTagMap] = useState<TagMap>(() => readStore());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tagMap));
  }, [tagMap]);

  const tagsOf = useCallback((index: number): string[] => tagMap[index] ?? [], [tagMap]);

  /** Every tag in the workspace with the number of pathways carrying it. */
  const tagCounts = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    Object.values(tagMap).forEach((tags) => {
      tags.forEach((t) => {
        const key = t.toLowerCase();
        const existing = counts.get(key);
        if (existing) existing.count += 1;
        else counts.set(key, { label: t, count: 1 });
      });
    });
    return Array.from(counts.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [tagMap]);

  const allTags = useMemo(() => tagCounts.map((t) => t.label), [tagCounts]);

  /** Case-insensitive on match, stored as typed on first creation. */
  const addTagToMany = useCallback((indices: number[], raw: string) => {
    const value = raw.trim();
    if (!value) return;
    setTagMap((prev) => {
      const next = { ...prev };
      // Reuse the existing casing when the tag already exists anywhere.
      let canonical = value;
      for (const tags of Object.values(prev)) {
        const hit = tags.find((t) => t.toLowerCase() === value.toLowerCase());
        if (hit) {
          canonical = hit;
          break;
        }
      }
      indices.forEach((i) => {
        const current = next[i] ?? [];
        if (current.some((t) => t.toLowerCase() === canonical.toLowerCase())) return;
        next[i] = [...current, canonical];
      });
      return next;
    });
  }, []);

  const removeTagFromMany = useCallback((indices: number[], raw: string) => {
    const value = raw.trim().toLowerCase();
    setTagMap((prev) => {
      const next = { ...prev };
      indices.forEach((i) => {
        const current = next[i];
        if (!current) return;
        const kept = current.filter((t) => t.toLowerCase() !== value);
        if (kept.length) next[i] = kept;
        else delete next[i];
      });
      return next;
    });
  }, []);

  const tagsOfMany = useCallback(
    (indices: number[]): string[] => {
      const seen = new Map<string, string>();
      indices.forEach((i) => (tagMap[i] ?? []).forEach((t) => seen.set(t.toLowerCase(), t)));
      return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
    },
    [tagMap],
  );

  return { tagMap, tagsOf, tagsOfMany, tagCounts, allTags, addTagToMany, removeTagFromMany };
}

/** Grey chips, up to `max` shown, the rest behind a "+N" that expands on click. */
export const TagChips: React.FC<{
  tags: string[];
  max?: number;
  onRemove?: (tag: string) => void;
}> = ({ tags, max = 2, onRemove }) => {
  const [expanded, setExpanded] = useState(false);
  if (tags.length === 0) return null;
  const shown = expanded ? tags : tags.slice(0, max);
  const hidden = tags.length - shown.length;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((tag) => (
        <span
          key={tag}
          className="group/tag inline-flex max-w-full items-center gap-0.5 rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground"
        >
          <span className="truncate">{tag}</span>
          {onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(tag);
              }}
              title={`Remove "${tag}"`}
              className="opacity-0 transition-opacity group-hover/tag:opacity-100"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          )}
        </span>
      ))}
      {hidden > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(true);
          }}
          className="rounded-md border border-dashed border-border px-1 py-0.5 text-[9px] font-medium text-muted-foreground hover:text-foreground"
        >
          +{hidden}
        </button>
      )}
    </div>
  );
};

/**
 * Single free-text input that filters existing workspace tags; Enter creates a
 * new one. No categories, no colours, no required fields.
 */
export const TagPicker: React.FC<{
  suggestions: string[];
  onPick: (tag: string) => void;
  note?: string;
  placeholder?: string;
}> = ({ suggestions, onPick, note, placeholder = "Tag name" }) => {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const matches = q ? suggestions.filter((t) => t.toLowerCase().includes(q)) : suggestions;
  const exact = suggestions.some((t) => t.toLowerCase() === q);

  return (
    <div className="w-56 space-y-2">
      <Input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && query.trim()) {
            e.preventDefault();
            onPick(query.trim());
            setQuery("");
          }
        }}
        placeholder={placeholder}
        className="h-7 !text-[10px]"
      />
      {note && <p className="text-[9px] leading-snug text-muted-foreground">{note}</p>}
      <div className="max-h-40 overflow-y-auto">
        {q && !exact && (
          <button
            type="button"
            onClick={() => {
              onPick(query.trim());
              setQuery("");
            }}
            className="flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-[10px] text-foreground hover:bg-muted"
          >
            <Plus className="h-2.5 w-2.5" />
            Create "{query.trim()}"
          </button>
        )}
        {matches.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => {
              onPick(tag);
              setQuery("");
            }}
            className="block w-full truncate rounded px-1.5 py-1 text-left text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {tag}
          </button>
        ))}
        {matches.length === 0 && !q && (
          <p className="px-1.5 py-1 text-[9px] text-muted-foreground">No tags yet — type to create one.</p>
        )}
      </div>
    </div>
  );
};
