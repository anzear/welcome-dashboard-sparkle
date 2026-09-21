import { useEffect, useState } from "react";
import { MessageSquare, MessageSquarePlus, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * SHARED ROW NOTES CONTROL
 * One note pattern across every box: an icon with a count that opens a popover
 * holding the existing notes and a composer. Posting publishes the note to the
 * Notes section, tagged with the item it came from.
 * Prototype persistence is localStorage.
 */

export type ItemNote = { id: string; author: string; timestamp: string; text: string };

const STORE_KEY = "vcg.workspace.itemNotes";
const CHANGED_EVENT = "vcg-item-notes-changed";

type Store = Record<string, ItemNote[]>;

const readStore = (): Store => {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
};

const writeStore = (store: Store) => {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {}
  window.dispatchEvent(new Event(CHANGED_EVENT));
};

function useOwnNotes(itemLabel: string) {
  const [notes, setNotes] = useState<ItemNote[]>(() => readStore()[itemLabel] ?? []);

  useEffect(() => {
    const sync = () => setNotes(readStore()[itemLabel] ?? []);
    sync();
    window.addEventListener(CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [itemLabel]);

  const add = (text: string, author: string) => {
    const store = readStore();
    const note: ItemNote = {
      id: crypto.randomUUID(),
      author,
      timestamp: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      text,
    };
    writeStore({ ...store, [itemLabel]: [...(store[itemLabel] ?? []), note] });
  };

  return { notes, add };
}

export function ItemNotesControl({
  itemLabel,
  title,
  teamNotes = [],
  currentUser,
  onPost,
  align = "end",
  storeLocally = true,
}: {
  /** Tag used in the Notes section, e.g. "Company · Corbion". */
  itemLabel: string;
  /** Heading inside the popover; defaults to the item label. */
  title?: string;
  /** Colleagues' notes — read-only. */
  teamNotes?: ItemNote[];
  currentUser: string;
  /** Publishes the note to the Notes section, tagged with the item. */
  onPost?: (itemLabel: string, text: string) => void;
  align?: "start" | "center" | "end";
  /** False when the parent already owns and renders the notes list. */
  storeLocally?: boolean;
}) {
  const { notes: ownNotes, add } = useOwnNotes(itemLabel);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const all = storeLocally ? [...teamNotes, ...ownNotes] : teamNotes;
  const count = all.length;

  const post = () => {
    const text = draft.trim();
    if (!text) return;
    if (storeLocally) add(text, currentUser);
    onPost?.(itemLabel, text);
    setDraft("");
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          data-row-control
          onClick={(event) => event.stopPropagation()}
          title={count ? `${count} note${count === 1 ? "" : "s"}` : "Add note"}
          aria-label={count ? `Notes on ${title ?? itemLabel}` : `Add a note on ${title ?? itemLabel}`}
          className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          {count > 0 ? (
            <>
              <MessageSquare className="h-3.5 w-3.5 fill-current" />
              <span className="text-[10px] font-medium tabular-nums">{count}</span>
            </>
          ) : (
            <MessageSquarePlus className="h-3.5 w-3.5" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-72 p-2" onClick={(event) => event.stopPropagation()}>
        <div className="truncate text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {title ?? itemLabel}
        </div>
        {all.map((note) => (
          <div key={note.id} className="mt-2 rounded border border-border/60 p-2">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{note.author}</span>
              <span>{note.timestamp}</span>
            </div>
            <p className="mt-0.5 whitespace-pre-wrap break-words text-[11px]">{note.text}</p>
          </div>
        ))}
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a note…"
          className="mt-2 min-h-[56px] text-xs"
        />
        <div className="mt-2 flex justify-end">
          <Button size="sm" className="h-7 gap-1 text-[10px]" disabled={!draft.trim()} onClick={post}>
            <Send className="h-3 w-3" /> Post note
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
