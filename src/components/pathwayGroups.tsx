// Pathway groups.
//
// Two kinds of group live side by side:
//  - USER groups: created on this screen, membership stored per pathway.
//  - SYSTEM groups: seeded from reference data, permanent, membership derived at
//    render time from a rule (never a saved selection). They are never written
//    to local storage, so stored state can never remove them.
//
// Membership is stored per pathway only — a collapsed spine is never a member of
// anything, its chips are always derived from the pathways beneath it.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Lock, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface PathwayGroup {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  /** 'system' groups are permanent and read-only. Absent means user group. */
  type?: 'system' | 'user';
  /** Compact chip label, e.g. "9A". Falls back to the name. */
  shortLabel?: string;
  /** Free-text description of what the group is for. */
  description?: string;
  source?: string;
  version?: string;
  membershipRule?: string;
}

/** pathway_group_member — unique on (pathway_id, group_id). */
export interface PathwayGroupMember {
  pathway_id: number;
  group_id: string;
}

export const ANNEX_IX_A_GROUP_ID = 'sys-annex-ix-a';

/** Seed data — merged in on every load, never persisted. */
export const SYSTEM_GROUPS: PathwayGroup[] = [
  {
    id: ANNEX_IX_A_GROUP_ID,
    name: 'Annex IX Part A',
    shortLabel: '9A',
    type: 'system',
    source: 'RED II Directive (EU) 2018/2001, Annex IX Part A',
    version: '2018 consolidated list, points (a) to (q)',
    membershipRule: 'feedstock.annexIxPartA === true',
    description:
      'Feedstocks listed in RED II Annex IX Part A. Feedstock eligibility only — it does not imply the pathway is compliant.',
    created_by: 'System',
    created_at: '2018-12-11T00:00:00.000Z',
  },
];

const SYSTEM_IDS = new Set(SYSTEM_GROUPS.map((g) => g.id));
const SYSTEM_NAMES = new Set(SYSTEM_GROUPS.flatMap((g) => [g.name.toLowerCase(), (g.shortLabel ?? '').toLowerCase()]));

export const isSystemGroup = (g: PathwayGroup) => g.type === 'system' || SYSTEM_IDS.has(g.id);

const GROUPS_KEY = 'pathwayGroups';
const MEMBERS_KEY = 'pathwayGroupMembers';
const HIDDEN_KEY = 'pathwayGroupsHidden';

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

let userGroups: PathwayGroup[] = read<PathwayGroup[]>(GROUPS_KEY, []);
let members: PathwayGroupMember[] = read<PathwayGroupMember[]>(MEMBERS_KEY, []);
let hidden: string[] = read<string[]>(HIDDEN_KEY, []);

// Migration: drop any stored copy of a system group (including the legacy hand-made
// "9A" groups), merge legacy user groups that share a name, then drop duplicates.
(() => {
  const dropped = new Set<string>();
  userGroups = userGroups.filter((g) => {
    const isSys = SYSTEM_IDS.has(g.id) || SYSTEM_NAMES.has(g.name.trim().toLowerCase());
    if (isSys) dropped.add(g.id);
    return !isSys;
  });

  const canonical = new Map<string, PathwayGroup>();
  const remap = new Map<string, string>();
  userGroups.forEach((g) => {
    const key = g.name.trim().toLowerCase();
    const first = canonical.get(key);
    if (first) remap.set(g.id, first.id);
    else canonical.set(key, g);
  });
  userGroups = [...canonical.values()];

  const seen = new Set<string>();
  members = members
    .filter((m) => !dropped.has(m.group_id))
    .map((m) => ({ ...m, group_id: remap.get(m.group_id) ?? m.group_id }))
    .filter((m) => {
      if (!userGroups.some((g) => g.id === m.group_id)) return false;
      const key = `${m.group_id}::${m.pathway_id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
})();

const listeners = new Set<() => void>();
const emit = () => {
  // Only user groups are persisted. System groups always come from seed data.
  localStorage.setItem(GROUPS_KEY, JSON.stringify(userGroups));
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
  localStorage.setItem(HIDDEN_KEY, JSON.stringify(hidden));
  listeners.forEach((l) => l());
};

const newId = () => `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

/**
 * @param systemResolve maps a system group id to the pathway ids that satisfy its
 * rule. Called at render time — system membership is never stored.
 */
export function usePathwayGroups(systemResolve?: (groupId: string) => number[]) {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const resolveRef = useRef(systemResolve);
  resolveRef.current = systemResolve;

  const memberIds = useCallback((groupId: string): number[] => {
    if (SYSTEM_IDS.has(groupId)) return resolveRef.current?.(groupId) ?? [];
    return members.filter((m) => m.group_id === groupId).map((m) => m.pathway_id);
  }, []);

  const allGroups: PathwayGroup[] = [...SYSTEM_GROUPS, ...userGroups];
  const groups = allGroups.filter((g) => !hidden.includes(g.id));

  const groupsOf = useCallback((pathwayId: number): PathwayGroup[] => {
    const out: PathwayGroup[] = [];
    SYSTEM_GROUPS.forEach((g) => {
      if (hidden.includes(g.id)) return;
      if ((resolveRef.current?.(g.id) ?? []).includes(pathwayId)) out.push(g);
    });
    const ids = new Set(members.filter((m) => m.pathway_id === pathwayId).map((m) => m.group_id));
    userGroups.forEach((g) => { if (ids.has(g.id) && !hidden.includes(g.id)) out.push(g); });
    return out;
  }, []);

  /** Adding a pathway already in the group is a no-op, never a duplicate. */
  const addToGroup = useCallback((groupId: string, pathwayIds: number[]) => {
    if (SYSTEM_IDS.has(groupId)) return 0;
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
    if (SYSTEM_IDS.has(groupId)) return;
    const drop = new Set(pathwayIds);
    members = members.filter((m) => !(m.group_id === groupId && drop.has(m.pathway_id)));
    emit();
  }, []);

  /**
   * Creates a group. A name that already exists (case-insensitive) reuses that
   * group instead of creating a second one, and pathways are never duplicated.
   * System group names are reserved.
   */
  const createGroup = useCallback((name: string, pathwayIds: number[], description?: string) => {
    const clean = name.trim();
    const unique = [...new Set(pathwayIds)];
    const reserved = SYSTEM_NAMES.has(clean.toLowerCase());
    const finalName = reserved ? `${clean} (copy)` : clean;
    const existing = userGroups.find((g) => g.name.toLowerCase() === finalName.toLowerCase());
    const group: PathwayGroup = existing ?? {
      id: newId(),
      name: finalName,
      description: description?.trim() || undefined,
      type: 'user',
      created_by: 'You',
      created_at: new Date().toISOString(),
    };
    if (!existing) userGroups = [...userGroups, group];
    else if (description?.trim()) {
      userGroups = userGroups.map((g) => (g.id === group.id ? { ...g, description: description.trim() } : g));
    }
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

  /** Renames a user group and/or edits its description. System groups are read-only. */
  const updateGroup = useCallback((groupId: string, patch: { name?: string; description?: string }) => {
    if (SYSTEM_IDS.has(groupId)) return;
    const nextName = patch.name?.trim();
    if (nextName && SYSTEM_NAMES.has(nextName.toLowerCase())) return;
    userGroups = userGroups.map((g) =>
      g.id === groupId
        ? {
            ...g,
            name: nextName || g.name,
            description: patch.description === undefined ? g.description : patch.description.trim() || undefined,
          }
        : g,
    );
    emit();
  }, []);

  /** Deletes a user group and all of its memberships. System groups cannot be deleted. */
  const deleteGroup = useCallback((groupId: string) => {
    if (SYSTEM_IDS.has(groupId)) return;
    userGroups = userGroups.filter((g) => g.id !== groupId);
    members = members.filter((m) => m.group_id !== groupId);
    emit();
  }, []);

  /** Re-creates a previously deleted group with its memberships (used for undo). */
  const restoreGroup = useCallback((group: PathwayGroup, pathwayIds: number[]) => {
    if (isSystemGroup(group) || userGroups.some((g) => g.id === group.id)) return;
    userGroups = [...userGroups, group];
    members = [
      ...members,
      ...[...new Set(pathwayIds)].map((pid) => ({ group_id: group.id, pathway_id: pid })),
    ];
    emit();
  }, []);

  /** Hiding is a view preference only — it never affects membership. */
  const setGroupHidden = useCallback((groupId: string, isHidden: boolean) => {
    hidden = isHidden ? [...new Set([...hidden, groupId])] : hidden.filter((id) => id !== groupId);
    emit();
  }, []);

  return {
    groups,
    allGroups,
    hiddenGroupIds: hidden,
    groupsOf,
    memberIds,
    addToGroup,
    removeFromGroup,
    createGroup,
    updateGroup,
    deleteGroup,
    restoreGroup,
    setGroupHidden,
  };
}

const CHIP = 'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium max-w-[86px]';
const USER_CHIP = 'bg-muted text-foreground/70';
/** System chips read differently from user chips without reading the label. */
const SYSTEM_CHIP = 'bg-background text-foreground/80 border border-foreground/40 border-dashed uppercase tracking-wide';

export const groupChipLabel = (g: PathwayGroup) => g.shortLabel ?? g.name;
const chipLabel = groupChipLabel;

/** Per-pathway chips: de-duplicated, max 2, then a +N overflow chip. */
export const GroupChips: React.FC<{
  groups: PathwayGroup[];
  onRemove?: (groupId: string) => void;
  /** groupId → tooltip text. */
  tooltips?: Record<string, string>;
}> = ({ groups: gs, onRemove, tooltips }) => {
  const seen = new Set<string>();
  const unique = gs.filter((g) => {
    if (seen.has(g.id)) return false;
    seen.add(g.id);
    return true;
  });
  if (unique.length === 0) return <span />;
  const shown = unique.slice(0, 2);
  const rest = unique.slice(2);
  return (
    <div className="flex items-center justify-center gap-1 flex-wrap">
      {shown.map((g) => {
        const system = isSystemGroup(g);
        const tip = tooltips?.[g.id];
        const chip = (
          <span className={`${CHIP} group/chip ${system ? SYSTEM_CHIP : USER_CHIP}`}>
            <span className="truncate">{chipLabel(g)}</span>
            {!system && onRemove && (
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
        );
        if (!tip) return <React.Fragment key={g.id}>{chip}</React.Fragment>;
        return (
          <Tooltip key={g.id}>
            <TooltipTrigger asChild>{chip}</TooltipTrigger>
            <TooltipContent side="top" className="max-w-[240px] text-[10px]">{tip}</TooltipContent>
          </Tooltip>
        );
      })}
      {rest.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`${CHIP} ${USER_CHIP} tabular-nums cursor-default`}>+{rest.length}</span>
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
  label?: string;
  system?: boolean;
  count: number;
  total: number;
}

/**
 * Collapsed rows: derived from the pathways beneath.
 * All beneath → filled chip. Some → outlined chip with "count/total". None → not shown.
 */
export const DerivedGroupChips: React.FC<{ items: DerivedGroupChip[] }> = ({ items }) => {
  const seen = new Set<string>();
  const unique = items.filter((it) => {
    if (seen.has(it.id)) return false;
    seen.add(it.id);
    return true;
  });
  if (unique.length === 0) return <span />;
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {unique.map((it) => {
        const all = it.count === it.total;
        const base = it.system
          ? 'bg-background text-foreground/80 border border-dashed border-foreground/40 uppercase tracking-wide'
          : all
            ? 'bg-muted-foreground/25 text-foreground/80 border border-transparent'
            : 'bg-transparent text-muted-foreground border border-dashed border-muted-foreground/50';
        return (
          <span
            key={it.id}
            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium ${base}`}
            title={all ? `Every pathway in this row is in ${it.name}` : `${it.count} of ${it.total} pathways in this row are in ${it.name}`}
          >
            <span className="truncate max-w-[100px]">{it.label ?? it.name}</span>
            {!all && <span className="tabular-nums opacity-80">{it.count}/{it.total}</span>}
          </span>
        );
      })}
    </div>
  );
};

export { Lock as GroupLockIcon };
