import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookMarked, Plus, Search, FilePlus2 } from "lucide-react";
import { BRIEF_PALETTE, usePipelineBriefStore } from "@/store/pipelineBriefStore";
import { useCurrentUser } from "@/lib/currentUser";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAttach: (briefId: string) => void;
  countsByBrief?: Record<string, number>;
}

export default function BriefPickerDialog({ open, onOpenChange, onAttach, countsByBrief }: Props) {
  const briefOrder = usePipelineBriefStore((s) => s.order);
  const briefsMap = usePipelineBriefStore((s) => s.briefs);
  const briefs = useMemo(
    () => briefOrder.map((id) => briefsMap[id]).filter(Boolean),
    [briefOrder, briefsMap]
  );
  const create = usePipelineBriefStore((s) => s.create);
  const user = useCurrentUser();
  const [tab, setTab] = useState<"existing" | "new">(briefs.length ? "existing" : "new");
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");

  const filtered = useMemo(
    () => briefs.filter((b) => b.name.toLowerCase().includes(query.toLowerCase())),
    [briefs, query]
  );

  const handleCreate = () => {
    const b = create(newName, user.name);
    setNewName("");
    onAttach(b.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="inline-flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-primary" /> Add a brief
          </DialogTitle>
          <DialogDescription className="text-xs">
            Attach this material to an existing brief — useful when several materials address the same need — or create a new one.
          </DialogDescription>
        </DialogHeader>

        <div className="inline-flex rounded-md border border-border bg-muted/40 p-0.5 self-start">
          <button
            onClick={() => setTab("existing")}
            className={`text-[11px] px-3 py-1 rounded-[5px] ${tab === "existing" ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"}`}
          >
            Select existing
          </button>
          <button
            onClick={() => setTab("new")}
            className={`text-[11px] px-3 py-1 rounded-[5px] ${tab === "new" ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"}`}
          >
            Create new
          </button>
        </div>

        {tab === "existing" ? (
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search briefs…"
                className="pl-8 h-8 text-sm"
              />
            </div>
            <div className="max-h-72 overflow-y-auto rounded-md border border-border divide-y divide-border">
              {filtered.length === 0 ? (
                <div className="px-3 py-8 text-center text-xs text-muted-foreground italic">
                  {briefs.length === 0 ? "No briefs yet. Create one to get started." : "No briefs match your search."}
                </div>
              ) : (
                filtered.map((b) => {
                  const p = BRIEF_PALETTE[b.color] || BRIEF_PALETTE.emerald;
                  const cnt = countsByBrief?.[b.id] ?? 0;
                  return (
                    <button
                      key={b.id}
                      onClick={() => {
                        onAttach(b.id);
                        onOpenChange(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${p.dot} shrink-0`} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{b.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          Last edited by {b.lastEditedBy}
                          {cnt > 0 && ` · attached to ${cnt} material${cnt === 1 ? "" : "s"}`}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-[10px] text-muted-foreground">{briefs.length} brief{briefs.length === 1 ? "" : "s"} total</span>
              <Button variant="ghost" size="sm" onClick={() => setTab("new")} className="h-7 text-xs gap-1">
                <Plus className="w-3 h-3" /> New brief instead
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">Brief name</label>
              <Input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Untitled brief"
                className="h-9 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
              />
              <p className="text-[10px] text-muted-foreground">
                You can fill in description, target properties, goals, and weighted priorities right after creating it.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} className="gap-1">
                <FilePlus2 className="w-3.5 h-3.5" /> Create &amp; attach
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
