import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  Search,
  MoreHorizontal,
  ShieldCheck,
  UserX,
  UserCheck,
  Eye,
  Plus,
  ClipboardList,
  Bookmark,
  TrendingUp,
  Clock,
  RefreshCw,
  Building2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Role = "org_admin" | "user" | "external";
type Status = "active" | "inactive";

interface UserRow {
  id: number;
  name: string;
  email: string;
  org: string;
  role: Role;
  status: Status;
  joined: string;
  lastLogin: string;
}

interface TopicRow {
  id: number;
  name: string;
  category: string;
  startingPoint: string;
  lastUpdated: string;
  analyses: number;
  views: number;
  savedBioLinks: number;
}

const initialUsers: UserRow[] = [
  { id: 1, name: "Jon Goriup", email: "jon@vcg.ai", org: "VCG.AI", role: "org_admin", status: "active", joined: "12/03/2024", lastLogin: "2h ago" },
  { id: 2, name: "Alexandra Müller", email: "a.mueller@biocampus.de", org: "BioCampus Straubing GmbH", role: "user", status: "active", joined: "29/08/2025", lastLogin: "1d ago" },
  { id: 3, name: "Lukas Weber", email: "l.weber@packaging-stuttgart.org", org: "Packaging Excellence Stuttgart", role: "user", status: "active", joined: "29/08/2025", lastLogin: "5h ago" },
  { id: 4, name: "Sophia Klein", email: "sophia@smartcities.org", org: "Smart Cities and Communities", role: "external", status: "active", joined: "29/08/2025", lastLogin: "3d ago" },
  { id: 5, name: "Markus Bauer", email: "m.bauer@regio-augsburg.de", org: "Regio Augsburg Wirtschaft GmbH", role: "org_admin", status: "active", joined: "29/08/2025", lastLogin: "1h ago" },
  { id: 6, name: "Elena Fischer", email: "elena@biocampus.de", org: "BioCampus Straubing GmbH", role: "external", status: "inactive", joined: "15/07/2025", lastLogin: "2 weeks ago" },
  { id: 7, name: "Tobias Hoffmann", email: "t.hoffmann@test.example.com", org: "Invite test 06", role: "user", status: "active", joined: "03/09/2025", lastLogin: "Never" },
  { id: 8, name: "Anna Richter", email: "anna@packaging-stuttgart.org", org: "Packaging Excellence Stuttgart", role: "user", status: "active", joined: "10/06/2025", lastLogin: "4h ago" },
  { id: 9, name: "David Wagner", email: "d.wagner@smartcities.org", org: "Smart Cities and Communities", role: "org_admin", status: "active", joined: "20/05/2025", lastLogin: "30m ago" },
  { id: 10, name: "Julia Becker", email: "julia@regio-augsburg.de", org: "Regio Augsburg Wirtschaft GmbH", role: "external", status: "inactive", joined: "01/04/2025", lastLogin: "1 month ago" },
];

const initialTopics: TopicRow[] = [
  { id: 1, name: "Wheat Straw", category: "Feedstock", startingPoint: "Lignocellulosic Biomass", lastUpdated: "2 days ago", analyses: 12, views: 1245, savedBioLinks: 38 },
  { id: 2, name: "Biochar", category: "Product", startingPoint: "Pyrolysis Outputs", lastUpdated: "1 week ago", analyses: 8, views: 892, savedBioLinks: 21 },
  { id: 3, name: "Lignin", category: "Product", startingPoint: "Lignocellulosic Biomass", lastUpdated: "3 days ago", analyses: 15, views: 1567, savedBioLinks: 52 },
  { id: 4, name: "Sugar Beet", category: "Feedstock", startingPoint: "Sugar Crops", lastUpdated: "5 days ago", analyses: 6, views: 334, savedBioLinks: 9 },
  { id: 5, name: "Cellulose", category: "Product", startingPoint: "Lignocellulosic Biomass", lastUpdated: "1 day ago", analyses: 22, views: 2156, savedBioLinks: 71 },
  { id: 6, name: "Xylose", category: "Product", startingPoint: "Hemicellulose Derivatives", lastUpdated: "4 hours ago", analyses: 18, views: 4521, savedBioLinks: 102 },
  { id: 7, name: "Corn Stover", category: "Feedstock", startingPoint: "Agricultural Residues", lastUpdated: "2 weeks ago", analyses: 4, views: 156, savedBioLinks: 5 },
];

const ROLE_LABEL: Record<Role, string> = {
  org_admin: "Organisation Admin",
  user: "User",
  external: "External",
};

const RoleBadge = ({ role }: { role: Role }) => {
  const cls =
    role === "org_admin"
      ? "bg-primary/10 text-primary border-primary/20"
      : role === "user"
        ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
        : "bg-muted text-muted-foreground border-border";
  return <Badge variant="outline" className={`text-[10px] ${cls}`}>{ROLE_LABEL[role]}</Badge>;
};

const StatusBadge = ({ status }: { status: Status }) => (
  <Badge
    variant="outline"
    className={`text-[10px] ${
      status === "active"
        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
        : "bg-muted text-muted-foreground border-border"
    }`}
  >
    {status === "active" ? "Active" : "Inactive"}
  </Badge>
);

const SuperAdmin = () => {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [topics, setTopics] = useState<TopicRow[]>(initialTopics);

  // User filters
  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Dialogs
  const [addTopicOpen, setAddTopicOpen] = useState(false);
  const [newTopic, setNewTopic] = useState({ name: "", category: "Feedstock", startingPoint: "" });

  const orgs = useMemo(() => Array.from(new Set(users.map((u) => u.org))), [users]);

  const filteredUsers = users.filter((u) => {
    if (search && !`${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (orgFilter !== "all" && u.org !== orgFilter) return false;
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    return true;
  });

  const toggleStatus = (id: number) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: u.status === "active" ? "inactive" : "active" } : u,
      ),
    );
    toast({ title: "User status updated" });
  };

  const changeRole = (id: number, role: Role) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    toast({ title: "Role updated", description: `Assigned ${ROLE_LABEL[role]}` });
  };
  const handleAddTopic = () => {
    if (!newTopic.name.trim()) return;
    const id = Math.max(...topics.map((t) => t.id)) + 1;
    setTopics([
      {
        id,
        name: newTopic.name,
        category: newTopic.category,
        startingPoint: newTopic.startingPoint || "—",
        lastUpdated: "Just now",
        analyses: 0,
        views: 0,
        savedBioLinks: 0,
      },
      ...topics,
    ]);
    setAddTopicOpen(false);
    setNewTopic({ name: "", category: "Feedstock", startingPoint: "" });
    toast({ title: "Topic added" });
  };

  // Stats
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.status === "active").length,
    totalOrgs: orgs.length,
    totalTopics: topics.length,
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="px-6 pt-4 pb-6 max-w-[1400px] w-full mx-auto space-y-6">
        {/* Welcome / context banner — matches dashboard hero style */}
        <div className="bg-gradient-to-r from-card via-card to-primary/8 border border-border/40 rounded-xl px-5 py-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-4 h-4 rounded-md bg-primary/20 flex items-center justify-center">
              <ShieldCheck className="w-2.5 h-2.5 text-primary" />
            </div>
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Super Admin</span>
            <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-primary/10 text-primary border-primary/20 ml-1">
              Restricted access
            </Badge>
          </div>
          <h1 className="text-base font-bold text-foreground tracking-tight mb-1">
            Platform <span className="text-primary">control center</span>
          </h1>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Oversee every user, organisation and analysis across VCG.AI from a single workspace.
          </p>
        </div>

        {/* Quick stats — compact inline strip */}
        <Card className="border-border/40 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/60">
            {[
              { label: "Total Users", value: stats.totalUsers, sub: `${stats.activeUsers} active`, icon: Users, accent: "text-primary", bg: "bg-primary/10" },
              { label: "Topics", value: stats.totalTopics, sub: `${topics.reduce((s, t) => s + t.analyses, 0)} analyses`, icon: ClipboardList, accent: "text-warning", bg: "bg-warning/10" },
              { label: "Saved BioLinks", value: topics.reduce((s, t) => s + t.savedBioLinks, 0), sub: "across analyses", icon: Bookmark, accent: "text-info", bg: "bg-info/10" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-8 h-8 rounded-md ${s.bg} flex items-center justify-center shrink-0`}>
                  <s.icon className={`w-4 h-4 ${s.accent}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">{s.label}</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-foreground tracking-tight tabular-nums leading-none">{s.value.toLocaleString()}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{s.sub}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="bg-muted h-9 p-1">
            <TabsTrigger
              value="users"
              className="text-xs h-7 px-3 data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm"
            >
              <Users className="w-3 h-3 mr-1.5" />
              User Management
            </TabsTrigger>
            <TabsTrigger
              value="analyses"
              className="text-xs h-7 px-3 data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm"
            >
              <ClipboardList className="w-3 h-3 mr-1.5" />
              Analysis Management
            </TabsTrigger>
          </TabsList>

          {/* User Management */}
          <TabsContent value="users" className="space-y-4">
            <Card className="border-border/40 shadow-sm overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <CardTitle className="text-sm">All Users</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Manage every account across all organisations.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name or email..."
                        className="h-8 pl-7 w-56 text-[11px] placeholder:text-[11px] md:text-[11px]"
                      />
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="h-8 w-40 text-xs">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All roles</SelectItem>
                        <SelectItem value="org_admin">Organisation Admin</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="external">External</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-8 w-32 text-xs">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border border-border rounded-lg overflow-hidden mx-4 mb-4">
                <Table>
                  <TableHeader className="bg-muted/70">
                    <TableRow>
                      <TableHead className="text-[10px] uppercase tracking-widest py-2 h-auto">User</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest py-2 h-auto">Role</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest py-2 h-auto">Status</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest py-2 h-auto">Joined</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest py-2 h-auto">Last login</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest py-2 h-auto text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-[10px]">
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id} className="hover:bg-muted/30">
                        <TableCell className="py-1.5">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="leading-tight">
                              <div className="text-[11px] font-medium">{u.name}</div>
                              <div className="text-[10px] text-muted-foreground">{u.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-1.5">
                          <Select
                            value={u.role}
                            onValueChange={(v) => changeRole(u.id, v as Role)}
                          >
                            <SelectTrigger className="h-6 w-36 text-[10px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="org_admin">Organisation Admin</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="external">External</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="py-1.5">
                          <StatusBadge status={u.status} />
                        </TableCell>
                        <TableCell className="py-1.5 text-[10px] text-muted-foreground">{u.joined}</TableCell>
                        <TableCell className="py-1.5 text-[10px] text-muted-foreground">{u.lastLogin}</TableCell>
                        <TableCell className="py-1.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStatus(u.id)}
                            className="h-7 px-2 text-[10px] font-medium"
                          >
                            {u.status === "active" ? (
                              <>
                                <UserX className="w-3 h-3 mr-1.5" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3 h-3 mr-1.5" />
                                Activate
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                          No users match the current filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysis Management */}
          <TabsContent value="analyses" className="space-y-4">
            <Card className="border-border/40 shadow-sm overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">All Topics</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Track update timestamps, analyses, views and saved BioLinks per starting point.
                    </p>
                  </div>
                  <Button size="sm" className="h-7 text-[11px] px-2.5 bg-foreground text-background hover:bg-foreground/90" onClick={() => setAddTopicOpen(true)}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add topic
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border border-border rounded-lg overflow-hidden mx-4 mb-4">
                <Table>
                  <TableHeader className="bg-muted/70">
                    <TableRow>
                      <TableHead className="text-[10px] uppercase tracking-widest py-2 h-auto">Topic</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest py-2 h-auto">Category</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest py-2 h-auto">Starting point</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest py-2 h-auto">
                        <Clock className="w-3 h-3 inline -mt-0.5 mr-1" />
                        Last updated
                      </TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest py-2 h-auto text-right">Analyses</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest py-2 h-auto text-right">
                        <TrendingUp className="w-3 h-3 inline -mt-0.5 mr-1" />
                        Views
                      </TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest py-2 h-auto text-right">
                        <Bookmark className="w-3 h-3 inline -mt-0.5 mr-1" />
                        Saved BioLinks
                      </TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest py-2 h-auto text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-[10px]">
                    {topics.map((t) => (
                      <TableRow key={t.id} className="hover:bg-muted/30">
                        <TableCell className="py-1.5 text-[11px] font-medium">{t.name}</TableCell>
                        <TableCell className="py-1.5">
                          <Badge
                            variant="outline"
                            className={`text-xs font-medium px-2.5 py-0 rounded-full ${
                              t.category === "Feedstock"
                                ? "bg-success/10 text-success border-success/30"
                                : "bg-purple-100 text-purple-700 border-purple-200"
                            }`}
                          >
                            {t.category === "Product" ? "Material" : t.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-1.5 text-[10px] text-muted-foreground">{t.startingPoint}</TableCell>
                        <TableCell className="py-1.5 text-[10px] text-muted-foreground">{t.lastUpdated}</TableCell>
                        <TableCell className="py-1.5 text-[10px] text-right tabular-nums">{t.analyses}</TableCell>
                        <TableCell className="py-1.5 text-[10px] text-right tabular-nums">{t.views.toLocaleString()}</TableCell>
                        <TableCell className="py-1.5 text-[10px] text-right tabular-nums">{t.savedBioLinks}</TableCell>
                        <TableCell className="py-1.5 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => toast({ title: "Refresh queued", description: `${t.name} data update scheduled.` })}
                          >
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add topic dialog */}
      <Dialog open={addTopicOpen} onOpenChange={setAddTopicOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add new topic</DialogTitle>
            <DialogDescription>
              Create a new topic and assign it to a starting point. Analyses can be added later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Topic name</Label>
              <Input
                value={newTopic.name}
                onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })}
                placeholder="e.g. Hemicellulose"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <Select
                value={newTopic.category}
                onValueChange={(v) => setNewTopic({ ...newTopic, category: v })}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Feedstock">Feedstock</SelectItem>
                  <SelectItem value="Product">Material</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Starting point</Label>
              <Input
                value={newTopic.startingPoint}
                onChange={(e) => setNewTopic({ ...newTopic, startingPoint: e.target.value })}
                placeholder="e.g. Lignocellulosic Biomass"
                className="h-9 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTopicOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTopic}>Add topic</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdmin;
