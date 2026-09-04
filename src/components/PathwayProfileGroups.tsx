// Group membership row for the Pathway Profile header.
//
// A profile shows exactly one pathway, so chips are always the filled state —
// the outlined partial-membership state belongs to collapsed rows only.

import React, { useMemo, useState } from 'react';
import { Plus, PlusSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  usePathwayGroups,
  GroupChips,
  GroupColorDot,
  isSystemGroup,
  groupChipLabel,
  ANNEX_IX_A_GROUP_ID,
  type PathwayGroup,
} from '@/components/pathwayGroups';
import { annexIxInfo } from '@/data/annexIx';
import { PREDEFINED_PATHWAYS } from '@/pages/ValueChainPathways';

interface Props {
  pathwayIndex: number;
  /** Feedstock shown on the page, used when the pathway is not in the dataset. */
  feedstock?: string;
}

const PathwayProfileGroups: React.FC<Props> = ({ pathwayIndex, feedstock }) => {
  const feedstockName = PREDEFINED_PATHWAYS[pathwayIndex]?.feedstock ?? feedstock ?? '';
  const annex = annexIxInfo(feedstockName);

  // Only this pathway's system membership matters here.
  const systemResolve = React.useCallback(
    (groupId: string): number[] =>
      groupId === ANNEX_IX_A_GROUP_ID && annex.annexIxPartA ? [pathwayIndex] : [],
    [annex.annexIxPartA, pathwayIndex],
  );

  const { groups, groupsOf, addToGroup, removeFromGroup, createGroup } = usePathwayGroups(systemResolve);

  const mine = useMemo(() => {
    const list = groupsOf(pathwayIndex);
    const sortBlock = (a: PathwayGroup, b: PathwayGroup) =>
      groupChipLabel(a).localeCompare(groupChipLabel(b), undefined, { sensitivity: 'base' });
    return [
      ...list.filter(isSystemGroup).sort(sortBlock),
      ...list.filter((g) => !isSystemGroup(g)).sort(sortBlock),
    ];
  }, [groupsOf, pathwayIndex, groups]);

  const tooltips: Record<string, string> = {};
  if (annex.annexIxPartA && annex.annexIxPoint) {
    tooltips[ANNEX_IX_A_GROUP_ID] =
      `Feedstock listed in RED II Annex IX Part A, point (${annex.annexIxPoint}). Feedstock eligibility only. Does not imply the pathway is compliant.`;
  }
  mine.forEach((g) => {
    if (!isSystemGroup(g) && g.shortLabel && g.shortLabel !== g.name) tooltips[g.id] = g.name;
  });

  const userGroups = groups.filter((g) => !isSystemGroup(g));
  const memberIdsHere = new Set(mine.map((g) => g.id));

  const [pickerOpen, setPickerOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleRemove = (groupId: string) => {
    const group = mine.find((g) => g.id === groupId);
    if (!group || isSystemGroup(group)) return;
    removeFromGroup(groupId, [pathwayIndex]);
    toast.success(`Removed from ${group.name}`, {
      action: { label: 'Undo', onClick: () => addToGroup(groupId, [pathwayIndex]) },
    });
  };

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    const group = createGroup(name, [pathwayIndex]);
    setNewName('');
    setCreating(false);
    setPickerOpen(false);
    toast.success(`Added to ${group?.name ?? name}`);
  };

  const systemMine = mine.filter(isSystemGroup);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Groups</span>
        {mine.length > 0 && (
          <GroupChips groups={mine} tooltips={tooltips} onRemove={handleRemove} maxVisible={Infinity} />
        )}
        <Popover open={pickerOpen} onOpenChange={(o) => { setPickerOpen(o); if (!o) { setCreating(false); setNewName(''); } }}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-0.5 rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground">
              <Plus className="w-2.5 h-2.5" />
              Add to group
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-1">
            {userGroups.length === 0 && !creating && (
              <div className="px-2 py-1.5 text-[11px] text-muted-foreground">No groups yet</div>
            )}
            {userGroups.map((g) => {
              const already = memberIdsHere.has(g.id);
              return (
                <button
                  key={g.id}
                  disabled={already}
                  onClick={() => {
                    addToGroup(g.id, [pathwayIndex]);
                    setPickerOpen(false);
                    toast.success(`Added to ${g.name}`);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                  <GroupColorDot color={g.color} />
                  <span className="truncate">{g.name}</span>
                  {already && <span className="ml-auto text-[10px] text-muted-foreground">In group</span>}
                </button>
              );
            })}
            <div className="my-1 h-px bg-border" />
            {creating ? (
              <div className="flex items-center gap-1 p-1">
                <Input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                  placeholder="Group name"
                  className="h-7 text-[11px]"
                />
                <Button size="sm" className="h-7 text-[10px]" onClick={handleCreate} disabled={!newName.trim()}>Create</Button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <PlusSquare className="w-3 h-3" />
                New Group
              </button>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Rule provenance — system groups only, they are the only rule-derived ones. */}
      {systemMine.map((g) => (
        <p key={g.id} className="text-[10px] text-muted-foreground">
          {groupChipLabel(g)} — feedstock {feedstockName} qualifies under {g.name}
          {annex.annexIxPoint ? `, point (${annex.annexIxPoint})` : ''}
        </p>
      ))}
    </div>
  );
};

export default PathwayProfileGroups;
