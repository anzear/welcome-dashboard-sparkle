import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Mail, Bell, Users as UsersIcon, ShieldCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const teamMembers = [
  { id: 1, name: "Alexandra Müller", email: "a.mueller@vcg.ai", role: "Analyst", initials: "AM" },
  { id: 2, name: "Lukas Weber", email: "l.weber@vcg.ai", role: "Analyst", initials: "LW" },
  { id: 3, name: "Sophia Klein", email: "sophia@vcg.ai", role: "Viewer", initials: "SK" },
  { id: 4, name: "Markus Bauer", email: "m.bauer@vcg.ai", role: "Org Admin", initials: "MB" },
];

const Settings = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    firstName: "Jon",
    lastName: "Goriup",
    email: "jon@vcg.ai",
    phone: "+49 30 1234 5678",
  });
  const [notifications, setNotifications] = useState({
    analysisUpdates: true,
    weeklyDigest: true,
    productAnnouncements: false,
  });

  const userMeta = {
    organisation: "VCG.AI",
    role: "Super Admin",
    joined: "12/03/2024",
    lastUpdated: "2 days ago",
    lastLogin: "2 hours ago",
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
    toast({ title: "Profile photo updated" });
  };

  const handleSaveProfile = () => {
    toast({ title: "Profile saved", description: "Your changes have been applied." });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-xs text-muted-foreground">Manage your profile, notifications, and team.</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="bg-muted">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm"
            >
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="team"
              className="data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm"
            >
              Team
            </TabsTrigger>
          </TabsList>

          {/* Profile */}
          <TabsContent value="profile" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Editable form */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Profile information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-16 w-16">
                        {photo && <AvatarImage src={photo} alt="Profile" />}
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                          {profile.firstName[0]}
                          {profile.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 h-6 w-6 bg-foreground text-background rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
                      >
                        <Camera className="w-3 h-3" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {profile.firstName} {profile.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">{profile.email}</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">First name</Label>
                      <Input
                        value={profile.firstName}
                        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Last name</Label>
                      <Input
                        value={profile.lastName}
                        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Email</Label>
                      <Input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Phone</Label>
                      <Input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button size="sm" onClick={handleSaveProfile}>
                      Save changes
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Account meta */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Account details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Organisation</span>
                    <span className="font-medium">{userMeta.organisation}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Role</span>
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      {userMeta.role}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Joined</span>
                    <span>{userMeta.joined}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Last updated</span>
                    <span>{userMeta.lastUpdated}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Last login</span>
                    <span>{userMeta.lastLogin}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5" />
                  Email notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Analysis updates</div>
                    <div className="text-xs text-muted-foreground">
                      Get notified when an analysis you follow is updated.
                    </div>
                  </div>
                  <Switch
                    checked={notifications.analysisUpdates}
                    onCheckedChange={(v) =>
                      setNotifications({ ...notifications, analysisUpdates: v })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Weekly digest</div>
                    <div className="text-xs text-muted-foreground">
                      Summary of platform activity every Monday morning.
                    </div>
                  </div>
                  <Switch
                    checked={notifications.weeklyDigest}
                    onCheckedChange={(v) =>
                      setNotifications({ ...notifications, weeklyDigest: v })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Product announcements</div>
                    <div className="text-xs text-muted-foreground">
                      New features, releases and tips from the VCG team.
                    </div>
                  </div>
                  <Switch
                    checked={notifications.productAnnouncements}
                    onCheckedChange={(v) =>
                      setNotifications({ ...notifications, productAnnouncements: v })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team */}
          <TabsContent value="team">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <UsersIcon className="w-3.5 h-3.5" />
                      Team members
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Other people in {userMeta.organisation}.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Mail className="w-3.5 h-3.5 mr-1.5" />
                    Invite member
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {teamMembers.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2.5 rounded-md hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {m.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-xs font-medium">{m.name}</div>
                        <div className="text-[11px] text-muted-foreground">{m.email}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {m.role}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
