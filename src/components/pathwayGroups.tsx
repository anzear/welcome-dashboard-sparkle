// Custom pathway groups.
//
// Membership is stored per pathway only — a collapsed spine is never a member of
// anything, its chips are always derived from the pathways beneath it.
// A pathway may belong to any number of groups.

import React, { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface PathwayGroup {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

/** pathway_group_member — unique on (pathway_id, group_id). */
export interface PathwayGroupMember {
  pathway_id: number;
  group_id: string;
}

const GROUPS_KEY = 'pathwayGroups';
const MEMBERS_KEY = 'pathwayGroupMembers';

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

let groups: PathwayGroup[] = read<PathwayGroup[]>(GROUPS_KEY, []);
let members: PathwayGroupMember[] = read<PathwayGroupMember[]>(MEMBERS_KEY, []);

// Migration: merge legacy groups that share a name, then drop duplicate memberships.
(() => {
  const canonical = new Map<string, PathwayGroup>();
  const remap = new Map<string, string>();
  groups.forEach((g) => {
    const key = g.name.trim().toLowerCase();
    const first = canonical.get(key);
    if (first) remap.set(g.id, first.id);
    else canonical.set(key, g);
  });
  groups = [...canonical.values()];
  const seen = new Set<string>();
  members = members
    .map((m) => ({ ...m, group_id: remap.get(m.group_id) ?? m.group_id }))
    .filter((m) => {
      if (!groups.some((g) => g.id === m.group_id)) return false;
      const key = `${m.group_id}::${m.pathway_id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
})();



const listeners = new Set<() => void>();
const emit = () => {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
  listeners.forEach((l) => l());
};

const newId = () => `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

export function usePathwayGroups() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const groupsOf = useCallback((pathwayId: number): PathwayGroup[] => {
    const ids = new Set(members.filter((m) => m.pathway_id === pathwayId).map((m) => m.group_id));
    return groups.filter((g) => ids.has(g.id));
  }, []);

  const memberIds = useCallback((groupId: string): number[] =>
    members.filter((m) => m.group_id === groupId).map((m) => m.pathway_id), []);

  /** Adding a pathway already in the group is a no-op, never a duplicate. */
  const addToGroup = useCallback((groupId: string, pathwayIds: number[]) => {
    let added = 0;
    pathwayIds.forEach((pid) => {
      if (!members.some((m) => m.group_id === groupId && m.pathway_id === pid)) {
        members = [...members, { group_id: groupId, pathway_id: pid }];
        added += 1;
      }
    });
    emit();
    return added;
  }, []);

  const removeFromGroup = useCallback((groupId: string, pathwayIds: number[]) => {
    const drop = new Set(pathwayIds);
    members = members.filter((m) => !(m.group_id === groupId && drop.has(m.pathway_id)));
    emit();
  }, []);

  /**
   * Creates a group. A name that already exists (case-insensitive) reuses that
   * group instead of creating a second one, and pathways are never duplicated.
   */
  const createGroup = useCallback((name: string, pathwayIds: number[]) => {
    const clean = name.trim();
    const unique = [...new Set(pathwayIds)];
    const existing = groups.find((g) => g.name.toLowerCase() === clean.toLowerCase());
    const group: PathwayGroup = existing ?? {
      id: newId(),
      name: clean,
      created_by: 'You',
      created_at: new Date().toISOString(),
    };
    if (!existing) groups = [...groups, group];
    const fresh = unique.filter(
      (pid) => !members.some((m) => m.group_id === group.id && m.pathway_id === pid),
    );
    members = [...members, ...fresh.map((pid) => ({ group_id: group.id, pathway_id: pid }))];
    emit();
    return { ...group, existed: !!existing, added: fresh.length } as PathwayGroup & {
      existed: boolean;
      added: number;
    };
  }, []);


/** Deletes a group and all of its memberships. */
  const deleteGroup = useCallback((groupId: string) => {
    groups = groups.filter((g) => g.id !== groupId);
    members = members.filter((m) => m.group_id !== groupId);
    emit();
  }, []);

  /** Re-creates a previously deleted group with its memberships (used for undo). */
  const restoreGroup = useCallback((group: PathwayGroup, pathwayIds: number[]) => {
    if (groups.some((g) => g.id === group.id)) return;
    groups = [...groups, group];
    members = [
      ...members,
      ...[...new Set(pathwayIds)].map((pid) => ({ group_id: group.id, pathway_id: pid })),
    ];

    emit();
  }, []);

  return { groups, groupsOf, memberIds, addToGroup, removeFromGroup, createGroup, deleteGroup, restoreGroup };
}

const CHIP = 'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium max-w-[86px]';

/** Per-pathway chips: max 2, then a +N overflow chip listing the rest on hover. */
export const GroupChips: React.FC<{
  groups: PathwayGroup[];
  onRemove?: (groupId: string) => void;
}> = ({ groups: gs, onRemove }) => {
  if (gs.length === 0) return <span />;
  const shown = gs.slice(0, 2);
  const rest = gs.slice(2);
  return (
    <div className="flex items-center justify-center gap-1 flex-wrap">
      {shown.map((g) => (
        <span key={g.id} className={`${CHIP} group/chip bg-muted text-foreground/70`}>
          <span className="truncate">{g.name}</span>
          {onRemove && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(g.id); }}
              title={`Remove from ${g.name}`}
              className="opacity-0 group-hover/chip:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </span>
      ))}
      {rest.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`${CHIP} bg-muted text-foreground/70 tabular-nums cursor-default`}>+{rest.length}</span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[10px]">
            {rest.map((g) => <div key={g.id}>{g.name}</div>)}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

export interface DerivedGroupChip {
  id: string;
  name: string;
  count: number;
  total: number;
}

/**
 * Collapsed rows: derived from the pathways beneath.
 * All beneath → filled chip. Some → outlined chip with "count/total". None → not shown.
 */
export const DerivedGroupChips: React.FC<{ items: DerivedGroupChip[] }> = ({ items }) => {
  if (items.length === 0) return <span />;
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {items.map((it) => {
        const all = it.count === it.total;
        return (
          <span
            key={it.id}
            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium ${
              all
                ? 'bg-muted-foreground/25 text-foreground/80 border border-transparent'
                : 'bg-transparent text-muted-foreground border border-dashed border-muted-foreground/50'
            }`}
            title={all ? `Every pathway in this row is in ${it.name}` : `${it.count} of ${it.total} pathways in this row are in ${it.name}`}
          >
            <span className="truncate max-w-[100px]">{it.name}</span>
            {!all && <span className="tabular-nums opacity-80">{it.count}/{it.total}</span>}
          </span>
        );
      })}
    </div>
  );
};
