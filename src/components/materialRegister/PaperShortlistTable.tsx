import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DocumentAttachControl, mockSeedByIndex, useItemDocuments } from "@/components/materialRegister/itemDocuments";
import { ItemNotesControl } from "@/components/materialRegister/itemNotes";

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
    <col style={{ width: "44px" }} />
    <col style={{ width: "44px" }} />
    <col style={{ width: "100px" }} />
    <col style={{ width: "44px" }} />
  </colgroup>
);

export function PaperShortlistTable({
  papers,
  currentUser,
  onRemove,
  onPostNote,
}: {
  papers: ShortlistPaper[];
  currentUser: string;
  onRemove: (id: string) => void;
  /** Publishes the row note to the pathway notes section, tagged with the item. */
  onPostNote?: (itemLabel: string, text: string) => void;
}) {
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
                  <ItemNotesControl
                    itemLabel={`Paper · ${paper.title}`}
                    title={paper.title}
                    teamNotes={paper.teamNotes}
                    currentUser={currentUser}
                    onPost={onPostNote}
                  />
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

    </>
  );
}

export default PaperShortlistTable;
