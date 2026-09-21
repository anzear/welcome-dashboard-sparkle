import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DocumentAttachControl, mockSeedByIndex, useItemDocuments } from "@/components/materialRegister/itemDocuments";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export type PaperNote = { id: string; author: string; timestamp: string; text: string };

export type ShortlistPaper = {
  id: string;
  title: string;
  /** Absent means our data holds no publication date — the cell reads an em dash. */
  date?: string;
  authors: string[];
  savedBy: string;
  /** Colleagues' notes only — read-only for the current user. */
  teamNotes: PaperNote[];
};

const HEAD_CLS = "h-7 py-1 text-left text-[8px] font-semibold uppercase tracking-widest text-muted-foreground";

const Columns = () => (
  <colgroup>
    <col className="min-w-[260px]" />
    <col style={{ width: "100px" }} />
    <col style={{ width: "200px" }} />
    <col style={{ width: "220px" }} />
    <col style={{ width: "44px" }} />
    <col style={{ width: "100px" }} />
    <col style={{ width: "44px" }} />
  </colgroup>
);

export function PaperShortlistTable({
  papers,
  currentUser,
  onRemove,
}: {
  papers: ShortlistPaper[];
  currentUser: string;
  onRemove: (id: string) => void;
}) {
  const [myNotes, setMyNotes] = useState<Record<string, string>>({});
  const [teamPanel, setTeamPanel] = useState<ShortlistPaper | null>(null);
  /** Mock example attachments so the layout can be reviewed. */
  const { documents, addDocuments, removeDocument } = useItemDocuments(
    mockSeedByIndex(
      papers.map((paper) => paper.id),
      {
        0: [
          { name: "Yield-data-annotated.pdf", uploader: "M. Feld", date: "3 Sept 2026" },
          { name: "Internal-review-notes.docx", uploader: "K. Brandt", date: "10 Sept 2026" },
        ],
      },
    ),
    (itemId) => `Paper · ${papers.find((paper) => paper.id === itemId)?.title ?? itemId}`,
  );


  const panelNotes = teamPanel ? [...teamPanel.teamNotes].reverse() : [];

  return (
    <>
      <Table className="table-fixed">
        <Columns />
        <TableHeader className="bg-muted/20">
          <TableRow className="border-b border-border">
            <TableHead className={HEAD_CLS}>Publication</TableHead>
            <TableHead className={HEAD_CLS}>Date</TableHead>
            <TableHead className={HEAD_CLS}>Authors</TableHead>
            <TableHead className={HEAD_CLS}>Notes</TableHead>
            <TableHead className={HEAD_CLS}>Docs</TableHead>
            <TableHead className={HEAD_CLS}>Saved by</TableHead>
            <TableHead className={HEAD_CLS} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {papers.map((paper) => {
            const teamNoteCount = paper.teamNotes.length;
            return (
              <TableRow key={paper.id} className="border-b border-border/30 hover:bg-muted/20">
                <TableCell className="py-2">
                  <div title={paper.title} className="text-[10px] font-medium leading-snug text-foreground truncate">
                    {paper.title}
                  </div>
                </TableCell>
                <TableCell className="py-2 text-[10px] text-muted-foreground">{paper.date ?? "—"}</TableCell>
                <TableCell className="py-2 text-[10px] text-muted-foreground">{paper.authors.join(", ")}</TableCell>
                <TableCell className="py-2">
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={myNotes[paper.id] ?? ""}
                      onChange={(event) => setMyNotes((current) => ({ ...current, [paper.id]: event.target.value }))}
                      placeholder="Add your note…"
                      aria-label={`Your note on ${paper.title}`}
                      className="h-7 bg-background text-[10px]"
                    />
                    {teamNoteCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setTeamPanel(paper)}
                        className="shrink-0 whitespace-nowrap rounded-full border border-border px-2 py-0.5 text-[9px] text-muted-foreground hover:text-foreground"
                      >
                        {teamNoteCount} from team
                      </button>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-2">
                  <DocumentAttachControl
                    itemLabel={paper.title}
                    documents={documents[paper.id] ?? []}
                    onUpload={(names) => addDocuments(paper.id, names, currentUser)}
                    onRemove={(documentId) => removeDocument(paper.id, documentId)}
                  />
                </TableCell>
                <TableCell className="py-2 text-[10px] text-muted-foreground">{paper.savedBy}</TableCell>
                <TableCell className="py-2 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    title="Remove from shortlist"
                    onClick={() => onRemove(paper.id)}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Sheet open={teamPanel !== null} onOpenChange={(open) => !open && setTeamPanel(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-sm">{teamPanel?.title}</SheetTitle>
          </SheetHeader>
          <p className="mt-1 text-[10px] text-muted-foreground">{teamPanel?.authors.join(", ")}</p>
          <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">Team notes · read only</p>
          <div className="mt-3 space-y-2">
            {panelNotes.map((note) => (
              <div key={note.id} className="rounded-md border border-border/60 bg-muted/40 px-3 py-2">
                <div className="flex items-center justify-between text-[9px] uppercase tracking-widest text-muted-foreground">
                  <span>{note.author}</span>
                  <span>{note.timestamp}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-foreground/85">{note.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[10px] text-muted-foreground">
            Signed in as {currentUser}. Your own note stays editable in the row.
          </p>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default PaperShortlistTable;
