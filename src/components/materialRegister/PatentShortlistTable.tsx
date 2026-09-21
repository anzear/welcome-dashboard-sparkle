import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DocumentAttachControl, mockSeedByIndex, useItemDocuments } from "@/components/materialRegister/itemDocuments";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export type PatentNote = { id: string; author: string; timestamp: string; text: string };

export type ShortlistPatent = {
  id: string;
  title: string;
  applicant: string;
  /** Absent means our data holds no filing date — the cell reads an em dash. */
  filedDate?: string;
  /** Absent means not granted. */
  grantedDate?: string;
  status: "Filed" | "Granted" | "Withdrawn";
  jurisdictions: number;
  savedBy: string;
  /** Colleagues' notes only — read-only for the current user. */
  teamNotes: PatentNote[];
};

const HEAD_CLS = "h-7 py-1 text-left text-[8px] font-semibold uppercase tracking-widest text-muted-foreground";

const Columns = () => (
  <colgroup>
    <col className="min-w-[220px]" />
    <col style={{ width: "100px" }} />
    <col style={{ width: "100px" }} />
    <col style={{ width: "80px" }} />
    <col style={{ width: "88px" }} />
    <col style={{ width: "220px" }} />
    <col style={{ width: "44px" }} />
    <col style={{ width: "100px" }} />
    <col style={{ width: "44px" }} />
  </colgroup>
);

export function PatentShortlistTable({
  patents,
  currentUser,
  onRemove,
  onPostNote,
}: {
  patents: ShortlistPatent[];
  currentUser: string;
  onRemove: (id: string) => void;
  /** Publishes the row note to the pathway notes section, tagged with the item. */
  onPostNote?: (itemLabel: string, text: string) => void;
}) {
  const [myNotes, setMyNotes] = useState<Record<string, string>>({});
  const [teamPanel, setTeamPanel] = useState<ShortlistPatent | null>(null);
  /** Mock example attachments so the layout can be reviewed. */
  const { documents, addDocuments, removeDocument } = useItemDocuments(
    mockSeedByIndex(
      patents.map((patent) => patent.id),
      {
        0: [{ name: "Claim-chart-EP3421.pdf", uploader: "K. Brandt", date: "8 Sept 2026" }],
        1: [
          { name: "FTO-opinion-draft.docx", uploader: "L. Weiss", date: "1 Sept 2026" },
          { name: "Family-members-export.xlsx", uploader: "A. Novak", date: "9 Sept 2026" },
        ],
      },
    ),
    (itemId) => `Patent · ${patents.find((patent) => patent.id === itemId)?.title ?? itemId}`,
  );


  const panelNotes = teamPanel ? [...teamPanel.teamNotes].reverse() : [];

  return (
    <>
      <Table className="table-fixed">
        <Columns />
        <TableHeader className="bg-muted/20">
          <TableRow className="border-b border-border">
            <TableHead className={HEAD_CLS}>Patents</TableHead>
            <TableHead className={HEAD_CLS}>Filed date</TableHead>
            <TableHead className={HEAD_CLS}>Granted date</TableHead>
            <TableHead className={HEAD_CLS}>Status</TableHead>
            <TableHead className={HEAD_CLS}>Jurisdiction</TableHead>
            <TableHead className={HEAD_CLS}>Notes</TableHead>
            <TableHead className={HEAD_CLS}>Docs</TableHead>
            <TableHead className={HEAD_CLS}>Saved by</TableHead>
            <TableHead className={HEAD_CLS} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {patents.map((patent) => {
            const teamNoteCount = patent.teamNotes.length;
            return (
              <TableRow key={patent.id} className="border-b border-border/30 hover:bg-muted/20">
                <TableCell className="py-2">
                  <div title={patent.title} className="text-[10px] font-medium leading-snug text-foreground truncate">
                    {patent.title}
                  </div>
                  <div className="mt-0.5 text-[9px] text-muted-foreground">Applicant: {patent.applicant}</div>
                </TableCell>
                <TableCell className="py-2 text-[10px] text-muted-foreground">{patent.filedDate ?? "—"}</TableCell>
                <TableCell className="py-2 text-[10px] text-muted-foreground">{patent.grantedDate ?? "—"}</TableCell>
                <TableCell className="py-2 text-[10px] text-muted-foreground">{patent.status}</TableCell>
                <TableCell className="py-2 text-[10px] text-muted-foreground">{patent.jurisdictions}</TableCell>
                <TableCell className="py-2">
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={myNotes[patent.id] ?? ""}
                      onChange={(event) => setMyNotes((current) => ({ ...current, [patent.id]: event.target.value }))}
                      placeholder="Add your note…"
                      aria-label={`Your note on ${patent.title}`}
                      className="h-7 bg-background text-[10px]"
                    />
                    {teamNoteCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setTeamPanel(patent)}
                        className="shrink-0 whitespace-nowrap rounded-full border border-border px-2 py-0.5 text-[9px] text-muted-foreground hover:text-foreground"
                      >
                        {teamNoteCount} from team
                      </button>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-2">
                  <DocumentAttachControl
                    itemLabel={patent.title}
                    documents={documents[patent.id] ?? []}
                    onUpload={(names) => addDocuments(patent.id, names, currentUser)}
                    onRemove={(documentId) => removeDocument(patent.id, documentId)}
                  />
                </TableCell>
                <TableCell className="py-2 text-[10px] text-muted-foreground">{patent.savedBy}</TableCell>
                <TableCell className="py-2 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    title="Remove from shortlist"
                    onClick={() => onRemove(patent.id)}
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
          <p className="mt-1 text-[10px] text-muted-foreground">Applicant: {teamPanel?.applicant}</p>
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

export default PatentShortlistTable;
