import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Search, X, Bookmark, StickyNote, Tag, ChevronLeft, ChevronRight,
  Building2, Edit3, Trash2, Filter
} from "lucide-react";

const TAG_OPTIONS = [
  { value: 'very_interested', label: 'Very Interested', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'interested', label: 'Interested', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'neutral', label: 'Neutral', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'not_interested', label: 'Not Interested', color: 'bg-red-50 text-red-700 border-red-200' },
];

interface SavedCompany {
  id: string;
  company_name: string;
  country: string | null;
  size: string | null;
  feedstock: string | null;
  sector: string | null;
  topic_key: string | null;
  category: string | null;
  tag: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

const SavedCompanies = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<SavedCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCompany, setEditingCompany] = useState<SavedCompany | null>(null);
  const [editTag, setEditTag] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const itemsPerPage = 10;

  const fetchCompanies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("saved_companies")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching saved companies:", error);
      toast.error("Failed to load saved companies");
    } else {
      setCompanies((data as SavedCompany[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleUpdateCompany = async () => {
    if (!editingCompany) return;
    const { error } = await supabase
      .from("saved_companies")
      .update({ tag: editTag, notes: editNotes })
      .eq("id", editingCompany.id);

    if (error) {
      toast.error("Failed to update company");
    } else {
      toast.success("Company updated");
      setEditingCompany(null);
      fetchCompanies();
    }
  };

  const handleDeleteCompany = async (id: string) => {
    const { error } = await supabase
      .from("saved_companies")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to remove company");
    } else {
      toast.success("Company removed from saved list");
      fetchCompanies();
    }
  };

  const handleQuickTag = async (id: string, tag: string) => {
    const { error } = await supabase
      .from("saved_companies")
      .update({ tag })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update tag");
    } else {
      fetchCompanies();
    }
  };

  // Filtering
  const filtered = companies.filter((c) => {
    const matchesSearch =
      !searchTerm ||
      c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.country || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = tagFilter === "all" || c.tag === tagFilter;
    return matchesSearch && matchesTag;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getTagStyle = (tag: string) =>
    TAG_OPTIONS.find((t) => t.value === tag) || TAG_OPTIONS[0];

  // Stats
  const tagCounts = TAG_OPTIONS.map((t) => ({
    ...t,
    count: companies.filter((c) => c.tag === t.value).length,
  }));

  return (
    <div className="h-full bg-background flex flex-col">
      <div className="max-w-[1400px] w-full mx-auto px-6 pt-4 pb-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
            <Bookmark className="w-3 h-3 inline mr-1" />
            Saved Companies
            <span className="text-foreground ml-1">· {companies.length} saved</span>
          </h1>
          <p className="text-[9px] text-muted-foreground">
            Manage your shortlisted companies across all topics. Tag them, add notes, and track their evaluation status.
          </p>
        </div>

        {/* Tag summary cards */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {tagCounts.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setTagFilter(tagFilter === t.value ? "all" : t.value);
                setCurrentPage(1);
              }}
              className={`border rounded-lg px-3 py-2 text-left transition-all ${
                tagFilter === t.value
                  ? "border-primary/50 shadow-sm bg-primary/5"
                  : "border-border/60 bg-card hover:border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">
                  {t.label}
                </span>
                <Badge variant="outline" className={`text-[8px] px-1.5 py-0 ${t.color}`}>
                  {t.count}
                </Badge>
              </div>
            </button>
          ))}
        </div>

        {/* Search & filters */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-7 pr-7 h-7 !text-[10px] border-border"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm("")}
                className="absolute right-0.5 top-1/2 -translate-y-1/2 h-5 w-5 p-0"
              >
                <X className="h-2.5 w-2.5" />
              </Button>
            )}
          </div>
          <Select value={tagFilter} onValueChange={(v) => { setTagFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[130px] h-7 text-[9px] border-border">
              <Filter className="w-3 h-3 mr-1" />
              <SelectValue placeholder="All Tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[9px]">All Tags</SelectItem>
              {TAG_OPTIONS.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-[9px]">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(searchTerm || tagFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearchTerm(""); setTagFilter("all"); }}
              className="h-7 text-[8px] px-2 text-muted-foreground"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Table */}
        <Card className="flex-1 flex flex-col overflow-hidden border-border/60 shadow-sm">
          <CardContent className="p-0 flex-1 flex flex-col">
            <div className="overflow-y-auto flex-1">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                  <TableRow className="border-b border-border">
                    <TableHead className="font-semibold text-[8px] h-7 py-1 text-muted-foreground uppercase tracking-widest text-left">
                      Company
                    </TableHead>
                    <TableHead className="font-semibold text-[8px] h-7 py-1 text-muted-foreground uppercase tracking-widest text-left w-[100px]">
                      Country
                    </TableHead>
                    <TableHead className="font-semibold text-[8px] h-7 py-1 text-muted-foreground uppercase tracking-widest text-left w-[100px]">
                      Topic
                    </TableHead>
                    <TableHead className="font-semibold text-[8px] h-7 py-1 text-muted-foreground uppercase tracking-widest text-center w-[100px]">
                      Tag
                    </TableHead>
                    <TableHead className="font-semibold text-[8px] h-7 py-1 text-muted-foreground uppercase tracking-widest text-left w-[200px]">
                      Notes
                    </TableHead>
                    <TableHead className="font-semibold text-[8px] h-7 py-1 text-muted-foreground uppercase tracking-widest text-center w-[80px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-[10px] text-muted-foreground">
                        Loading saved companies...
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <Bookmark className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-medium text-foreground mb-1">
                              {companies.length === 0
                                ? "No saved companies yet"
                                : "No companies match your filters"}
                            </p>
                            <p className="text-[9px] text-muted-foreground">
                              {companies.length === 0
                                ? "Save companies from the Market Players page to track them here"
                                : "Try adjusting your search or tag filter"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((company) => {
                      const tagStyle = getTagStyle(company.tag);
                      return (
                        <TableRow key={company.id} className="hover:bg-muted/20 transition-colors border-b border-border/30">
                          <TableCell className="py-1.5">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-semibold text-foreground">
                                {company.company_name}
                              </span>
                              {company.sector && (
                                <span className="text-[8px] text-muted-foreground">{company.sector}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-[10px] py-1.5 text-muted-foreground">
                            {company.country || "—"}
                          </TableCell>
                          <TableCell className="py-1.5">
                            {company.topic_key ? (
                              <span className="text-[9px] text-primary font-medium">
                                {decodeURIComponent(company.topic_key.split("-").pop() || "")}
                              </span>
                            ) : (
                              <span className="text-[9px] text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center py-1.5">
                            <Select
                              value={company.tag}
                              onValueChange={(v) => handleQuickTag(company.id, v)}
                            >
                              <SelectTrigger className={`h-5 w-[80px] text-[8px] border mx-auto ${tagStyle.color}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TAG_OPTIONS.map((t) => (
                                  <SelectItem key={t.value} value={t.value} className="text-[9px]">
                                    {t.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="py-1.5">
                            <span className="text-[9px] text-muted-foreground line-clamp-2">
                              {company.notes || (
                                <span className="italic opacity-50">No notes</span>
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="text-center py-1.5">
                            <div className="flex items-center justify-center gap-0.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingCompany(company);
                                  setEditTag(company.tag);
                                  setEditNotes(company.notes || "");
                                }}
                                className="h-5 w-5 p-0 hover:bg-muted"
                                title="Edit notes & tag"
                              >
                                <Edit3 className="h-3 w-3 text-muted-foreground" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCompany(company.id)}
                                className="h-5 w-5 p-0 hover:bg-destructive/10"
                                title="Remove from saved"
                              >
                                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {filtered.length > 0 && (
              <div className="flex items-center justify-between px-3 py-1.5 border-t border-border/60 bg-muted/20 flex-shrink-0">
                <span className="text-[9px] text-muted-foreground font-medium">
                  Showing {(currentPage - 1) * itemsPerPage + 1}–
                  {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-5 w-5 p-0 border-border"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <span className="text-[9px] text-muted-foreground min-w-[70px] text-center font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-5 w-5 p-0 border-border"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingCompany} onOpenChange={(v) => !v && setEditingCompany(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5 text-[11px] font-semibold">
              <StickyNote className="w-3 h-3 text-primary" />
              {editingCompany?.company_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-0.5">
              <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">
                Tag
              </label>
              <Select value={editTag} onValueChange={setEditTag}>
                <SelectTrigger className="text-[11px] h-7">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAG_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-[11px]">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-0.5">
              <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">
                Notes
              </label>
              <Textarea
                placeholder="Add your evaluation notes, observations, follow-up actions..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="text-[11px] min-h-[80px] py-1.5"
              />
            </div>
            <div className="flex justify-end gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] px-2.5"
                onClick={() => setEditingCompany(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-6 text-[10px] px-2.5"
                onClick={handleUpdateCompany}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SavedCompanies;
