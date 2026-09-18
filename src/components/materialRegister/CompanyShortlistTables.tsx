import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DocumentAttachControl, mockSeedByIndex, useItemDocuments } from "@/components/materialRegister/itemDocuments";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type CompanyNote = { id: string; author: string; timestamp: string; text: string };

/** One colleague's rating — never averaged, never totalled. */
export type CompanyTeamRating = { author: string; value: number };

export type ShortlistCompany = {
  id: string;
  name: string;
  profileUrl: string;
  country: string;
  /** Absent means unclassified — the cell reads "Not classified". */
  sector?: string;
  /** Node chip tying the company to the pathway. */
  linkedNode: string;
  role: "Producer" | "Supplier" | "Offtaker";
  savedBy: string;
  /** A single 1–5 rating per company — absent means unrated. */
  rating?: number;
  /** Colleagues' ratings, one chip each. Empty means nobody else rated. */
  teamRatings?: CompanyTeamRating[];
  /** Colleagues' notes only — read-only for the current user. */
  teamNotes: CompanyNote[];
};

/** Same role vocabulary and order as the Market Players toggle. */
const ROLE_TABS: { value: string; role: ShortlistCompany["role"]; label: string }[] = [
  { value: "suppliers", role: "Supplier", label: "Feedstock Suppliers" },
  { value: "producers", role: "Producer", label: "Product Producers" },
  { value: "offtakers", role: "Offtaker", label: "Off-takers" },
];

const HEAD_CLS = "h-7 py-1 text-left text-[8px] font-semibold uppercase tracking-widest text-muted-foreground";

/** Column widths — one grid for the whole table, group rows included.
 *  Notes is flexible so the table always fits its card without scrolling. */
const Columns = () => (
  <colgroup>
    <col style={{ width: "170px" }} />
    <col style={{ width: "84px" }} />
    <col style={{ width: "112px" }} />
    <col style={{ width: "120px" }} />
    <col style={{ width: "116px" }} />
    <col />
    <col style={{ width: "88px" }} />
    <col style={{ width: "40px" }} />
    <col style={{ width: "84px" }} />
    <col style={{ width: "40px" }} />
  </colgroup>
);

function StarRating({
  value,
  onChange,
  name,
}: {
  value: number;
  onChange: (next: number) => void;
  name: string;
}) {
  const unrated = value === 0;
  return (
    <div
      className={cn("flex items-center gap-0.5", unrated && "opacity-25")}
      role="group"
      aria-label={`Your rating for ${name}`}
      title={unrated ? "Not rated" : undefined}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          // Clicking the current rating clears it back to unrated.
          onClick={() => onChange(value === star ? 0 : star)}
          aria-label={`Rate ${name} ${star} of 5`}
          className="p-0.5"
        >
          <Star
            className={cn(
              "h-[14px] w-[14px]",
              star <= value ? "fill-primary text-primary" : "fill-none text-muted-foreground",
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function CompanyShortlistTables({
  companies,
  currentUser,
  onRemove,
}: {
  companies: ShortlistCompany[];
  currentUser: string;
  onRemove: (id: string) => void;
}) {
  const [ratings, setRatings] = useState<Record<string, number>>(() =>
    Object.fromEntries(companies.filter((company) => company.rating).map((company) => [company.id, company.rating as number])),
  );
  const [myNotes, setMyNotes] = useState<Record<string, string>>({});
  const [teamPanel, setTeamPanel] = useState<ShortlistCompany | null>(null);
  const [activeTab, setActiveTab] = useState(ROLE_TABS[0].value);
  /** Mock example attachments so the layout can be reviewed. */
  const { documents, addDocuments, removeDocument } = useItemDocuments(
    mockSeedByIndex(
      companies.map((company) => company.id),
      {
        0: [
          { name: "NDA-signed-2026.pdf", uploader: "K. Brandt", date: "5 Sept 2026" },
          { name: "Capacity-and-pricing.xlsx", uploader: "A. Novak", date: "12 Sept 2026" },
        ],
        1: [{ name: "Sample-spec-sheet.pdf", uploader: "M. Feld", date: "7 Sept 2026" }],
        2: [{ name: "Offtake-term-sheet-draft.docx", uploader: "L. Weiss", date: "9 Sept 2026" }],
      },
    ),
    (itemId) => `Company · ${companies.find((company) => company.id === itemId)?.name ?? itemId}`,
  );


  const panelNotes = teamPanel ? [...teamPanel.teamNotes].reverse() : [];
  const activeRole = (ROLE_TABS.find((tab) => tab.value === activeTab) ?? ROLE_TABS[0]).role;
  const visibleRows = companies.filter((company) => company.role === activeRole);

  return (
    <>
      <div className="mb-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="inline-flex h-8 w-auto items-center gap-0 rounded-lg bg-muted p-0.5">
            {ROLE_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex h-7 items-center justify-center gap-1 rounded-md px-3 text-[10px] font-medium transition-all data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm"
              >
                {tab.label} ({companies.filter((company) => company.role === tab.role).length})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="overflow-hidden">
      <Table className="table-fixed">
        <Columns />
        <TableHeader className="bg-muted/20">
          <TableRow className="border-b border-border">
            <TableHead className={HEAD_CLS}>Company</TableHead>
            <TableHead className={HEAD_CLS}>Country</TableHead>
            <TableHead className={HEAD_CLS}>Sector</TableHead>
            <TableHead className={HEAD_CLS}>Linked node</TableHead>
            <TableHead className={HEAD_CLS}>Your rating</TableHead>
            <TableHead className={HEAD_CLS}>Notes</TableHead>
            <TableHead className={HEAD_CLS} />
            <TableHead className={HEAD_CLS}>Docs</TableHead>
            <TableHead className={HEAD_CLS}>Saved by</TableHead>
            <TableHead className={HEAD_CLS} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleRows.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={10} className="h-11 py-0 text-[10px] text-muted-foreground">
                No companies shortlisted in this group yet.
              </TableCell>
            </TableRow>
          )}
          {visibleRows.map((company) => {
                  const rating = ratings[company.id] ?? 0;
                  const teamNoteCount = company.teamNotes.length;
                  return (
                    <TableRow key={company.id} className="border-b border-border/30 hover:bg-muted/20">
                      <TableCell className="h-11 py-0">
                        <a
                          href={company.profileUrl}
                          title={company.name}
                          className="block truncate text-[10px] font-semibold text-foreground underline-offset-2 hover:underline"
                        >
                          {company.name}
                        </a>
                      </TableCell>
                      <TableCell className="h-11 py-0 text-[10px] text-muted-foreground">{company.country}</TableCell>
                      <TableCell
                        className="h-11 truncate py-0 text-[10px] text-muted-foreground"
                        title={company.sector ?? "Not classified"}
                      >
                        {company.sector ?? "Not classified"}
                      </TableCell>
                      <TableCell className="h-11 py-0">
                        <Badge variant="outline" className="max-w-full truncate text-[10px] font-normal">
                          {company.linkedNode}
                        </Badge>
                      </TableCell>
                      <TableCell className="h-11 py-0">
                        <StarRating
                          value={rating}
                          name={company.name}
                          onChange={(next) => setRatings((current) => ({ ...current, [company.id]: next }))}
                        />
                      </TableCell>
                      <TableCell className="h-11 py-0">
                        <Input
                          value={myNotes[company.id] ?? ""}
                          onChange={(event) =>
                            setMyNotes((current) => ({ ...current, [company.id]: event.target.value }))
                          }
                          placeholder="Add your note…"
                          aria-label={`Your note on ${company.name}`}
                          className="h-8 min-w-0 border-transparent bg-transparent px-2 text-[10px] shadow-none placeholder:text-muted-foreground hover:border-input hover:bg-background focus:border-input focus:bg-background"
                        />
                      </TableCell>
                      <TableCell className="h-11 py-0">
                        {teamNoteCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setTeamPanel(company)}
                            className="whitespace-nowrap rounded-full border border-border px-2 py-0.5 text-[9px] text-muted-foreground hover:text-foreground"
                          >
                            {teamNoteCount} from team
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="h-11 py-0">
                        <DocumentAttachControl
                          itemLabel={company.name}
                          documents={documents[company.id] ?? []}
                          onUpload={(names) => addDocuments(company.id, names, currentUser)}
                          onRemove={(documentId) => removeDocument(company.id, documentId)}
                        />
                      </TableCell>
                      <TableCell className="h-11 py-0 text-[10px] text-muted-foreground">{company.savedBy}</TableCell>
                      <TableCell className="h-11 py-0 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          title="Remove from shortlist"
                          aria-label={`Remove ${company.name} from shortlist`}
                          onClick={() => onRemove(company.id)}
                        >
                          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
        </TableBody>
      </Table>
      </div>

      <Sheet open={teamPanel !== null} onOpenChange={(open) => !open && setTeamPanel(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-sm">
              {teamPanel?.name} — {teamPanel?.role}
            </SheetTitle>
          </SheetHeader>
          <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">Team notes · read only</p>
          <div className="mt-3 space-y-2">
            {panelNotes.map((note) => (
              <div key={note.id} className="rounded-md border border-border/60 bg-muted/40 px-3 py-2">
                <div className="flex items-center justify-between text-[9px] uppercase tracking-widest text-muted-foreground">
                  <span>{note.author}</span>
                  <span>{note.timestamp}</span>
                </div>
                <p className="mt-1 text-xs text-foreground/85 leading-relaxed">{note.text}</p>
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
