import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DocumentAttachControl, mockSeedByIndex, useItemDocuments } from "@/components/materialRegister/itemDocuments";
import { ItemNotesControl } from "@/components/materialRegister/itemNotes";

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
    <col style={{ width: "44px" }} />
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
                  <ItemNotesControl
                    itemLabel={`Patent · ${patent.title}`}
                    title={patent.title}
                    teamNotes={patent.teamNotes}
                    currentUser={currentUser}
                    onPost={onPostNote}
                  />
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

    </>
  );
}

export default PatentShortlistTable;
