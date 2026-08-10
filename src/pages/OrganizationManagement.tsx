import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Globe, MapPin, Calendar, UserCheck, Plus, Users, Key, Mail, Phone, User, BarChart3, Activity, ExternalLink, Edit, Settings, ChevronRight, FolderOpen, Clock, Grid3X3, RefreshCw, RotateCcw, ChevronDown, Archive, Check, Shield, Crown, CheckCircle, XCircle, Bell, FileSearch } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const OrganizationManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("analyses");
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [openRoleDropdown, setOpenRoleDropdown] = useState<number | null>(null);
  const [openProjectDropdown, setOpenProjectDropdown] = useState<number | null>(null);
  const [openStatusDropdown, setOpenStatusDropdown] = useState<number | null>(null);
  const [approvalDialog, setApprovalDialog] = useState<{ topicId: number; topicName: string; description: string } | null>(null);
  const [selectedDatabase, setSelectedDatabase] = useState<string>("");
  const { toast } = useToast();
  
  // Sample analysis topics data - using state so we can update it
  const [analysisTopics, setAnalysisTopics] = useState([
    {
      id: 1,
      name: "Bioethanol Production Analysis",
      database: "Bioethanol",
      category: "Product",
      users: 15,
      lastUpdated: "2 days ago",
      addedDate: "2024-08-26",
      status: "Active",
      approvalStatus: "approved",
      description: "Analysis of bioethanol production pathways, market trends, and optimization strategies for sustainable fuel production."
    },
    {
      id: 2,
      name: "Apple Pomace Valorization",
      database: "Apple_pomace",
      category: "Feedstock",
      users: 8,
      lastUpdated: "1 week ago",
      addedDate: "2024-08-16",
      status: "Active",
      approvalStatus: "approved",
      description: "Comprehensive study on apple pomace utilization for biorefinery applications and waste valorization strategies."
    },
    {
      id: 3,
      name: "Digestate Treatment Technologies",
      database: "Digestate",
      category: "Process",
      users: 12,
      lastUpdated: "3 days ago",
      addedDate: "2024-09-02",
      status: "Active",
      approvalStatus: "approved",
      description: "Advanced treatment technologies for anaerobic digestion digestate and circular economy applications."
    },
    {
      id: 4,
      name: "Chitin Extraction from Marine Waste",
      database: "Marine_waste",
      category: "Feedstock",
      users: 6,
      lastUpdated: "5 days ago",
      addedDate: "2024-03-16",
      status: "Archived",
      approvalStatus: "approved",
      description: "Marine waste-derived chitin and chitosan applications in biorefinery and material science."
    },
    {
      id: 5,
      name: "Advanced Bioreactor Design",
      database: "Bioreactors",
      category: "Process",
      users: 10,
      lastUpdated: "1 day ago",
      addedDate: "2024-07-16",
      status: "Active",
      approvalStatus: "approved",
      description: "Advanced bioreactor technologies for bioprocessing and fermentation applications with efficiency optimization."
    },
    {
      id: 6,
      name: "Algae-Based Biofuels Research",
      database: null,
      category: "Product",
      users: 18,
      lastUpdated: "6 hours ago",
      addedDate: "2025-09-15",
      status: "Active",
      approvalStatus: "pending",
      description: "Comprehensive research on algae-based biofuel production, including cultivation methods and extraction technologies."
    },
    {
      id: 7,
      name: "Waste-to-Energy Conversion Systems",
      database: null,
      category: "Biochemical",
      users: 14,
      lastUpdated: "2 hours ago",
      addedDate: "2025-09-16",
      status: "Active",
      approvalStatus: "pending",
      description: "Comprehensive analysis of innovative waste-to-energy conversion systems encompassing advanced thermochemical processes including pyrolysis, gasification, and combustion technologies. This study evaluates the efficiency, environmental impact, and economic viability of various waste streams such as municipal solid waste, agricultural residues, and industrial byproducts. The research focuses on optimization strategies for energy recovery, emission reduction, and circular economy integration while examining emerging technologies like plasma gasification and anaerobic digestion for sustainable energy production and comprehensive waste management solutions."
    },
    {
      id: 8,
      name: "Hemp Fiber Processing",
      database: null,
      category: "Feedstock",
      users: 9,
      lastUpdated: "4 hours ago",
      addedDate: "2025-09-14",
      status: "Active",
      approvalStatus: "pending",
      description: "Hemp fiber processing technologies for textile and composite material applications in sustainable manufacturing."
    }
  ]);

  // Function to get category color classes
  const getCategoryColorClasses = (category: string) => {
    switch (category.toLowerCase()) {
      case 'feedstock':
        return 'bg-green-600 text-white border-green-600';
      case 'technology':
        return 'bg-blue-600 text-white border-blue-600';
      case 'biochemical':
        return 'bg-teal-600 text-white border-teal-600';
      case 'product':
        return 'bg-purple-600 text-white border-purple-600';
      case 'applications':
        return 'bg-orange-600 text-white border-orange-600';
      default:
        return 'bg-gray-600 text-white border-gray-600';
    }
  };

  // Function to change analysis status
  const handleChangeAnalysisStatus = (analysisId: number, newStatus: string) => {
    console.log('Status change called:', { analysisId, newStatus });
    setAnalysisTopics(prevTopics => {
      const updated = prevTopics.map(topic => 
        topic.id === analysisId 
          ? { ...topic, status: newStatus }
          : topic
      );
      console.log('Updated topics:', updated);
      return updated;
    });
  };

  // Function to change user role
  const handleChangeUserRole = (userId: number, newRole: string) => {
    console.log('Role change called:', { userId, newRole });
    setUsers(prevUsers => {
      const updated = prevUsers.map(user => 
        user.id === userId 
          ? { ...user, role: newRole }
          : user
      );
      console.log('Updated users:', updated);
      return updated;
    });
  };

  // Function to deactivate user
  const handleDeactivateUser = (userId: number) => {
    console.log('Deactivating user:', userId);
    const user = users.find(u => u.id === userId);
    if (!user) return;

    setUsers(prevUsers => {
      const updated = prevUsers.map(u => 
        u.id === userId 
          ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' }
          : u
      );
      console.log('Updated users:', updated);
      return updated;
    });

    toast({
      title: user.status === 'Active' ? "User Deactivated" : "User Activated",
      description: `${user.name} has been ${user.status === 'Active' ? 'deactivated' : 'activated'} successfully.`,
    });
  };

  // Function to delete user
  const handleDeleteUser = (userId: number) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      console.log('Deleting user:', userId);
      setUsers(prevUsers => {
        const updated = prevUsers.filter(user => user.id !== userId);
        console.log('Updated users:', updated);
        return updated;
      });
    }
  };

  // Helper function to check if a topic is new (within last 30 days)
  const isNewTopic = (addedDate: string) => {
    const topicDate = new Date(addedDate);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return topicDate >= thirtyDaysAgo;
  };

  // Available databases
  const availableDatabases = [
    "Apple_pomace",
    "Aquafeed",
    "Bagasse",
    "Beans",
    "Beta_glucan",
    "Biobased_solvents",
    "Bioethanol",
    "Bioreactors",
    "Bread",
    "Calcite",
    "Calcium_silicate",
    "Chitin",
    "Chitosan",
    "Coffee",
    "Concrete",
    "Corn_cob",
    "Cottonseed_meal",
    "Dammar",
    "Dextrose",
    "Digestate",
    "Endosperm_dust",
    "Ethylene_glycol",
    "Ettringite",
    "Feathers",
    "Fire_protection",
    "Flour_dust",
    "Food_waste",
    "Fructose",
    "Germ",
    "Grape_pomace",
    "Humin",
    "Hemp_fiber",
    "Marine_waste",
    "Algae_biomass",
    "Waste_energy"
  ];

  // Function to approve a topic
  const handleApproveTopic = (topicId: number, topicName: string, description: string) => {
    console.log('Opening approval dialog for topic:', topicId);
    setApprovalDialog({ topicId, topicName, description });
    setSelectedDatabase("");
  };

  // Function to confirm approval with selected database
  const confirmApproval = () => {
    if (!approvalDialog || !selectedDatabase) return;
    
    console.log('Approving topic with database:', { topicId: approvalDialog.topicId, database: selectedDatabase });
    
    setAnalysisTopics(prevTopics =>
      prevTopics.map(topic =>
        topic.id === approvalDialog.topicId
          ? { 
              ...topic, 
              approvalStatus: "approved",
              database: selectedDatabase
            }
          : topic
      )
    );
    
    setApprovalDialog(null);
    setSelectedDatabase("");
  };

  // Function to deny a topic
  const handleDenyTopic = (topicId: number) => {
    console.log('Denying topic:', topicId);
    setAnalysisTopics(prevTopics =>
      prevTopics.map(topic =>
        topic.id === topicId
          ? { ...topic, approvalStatus: "denied", status: "Denied" }
          : topic
      )
    );
  };

  // Sort analysis topics by date (newest first)
  const sortedAnalysisTopics = [...analysisTopics].sort((a, b) => {
    return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
  });

  // Count pending topics for notification
  const pendingTopicsCount = analysisTopics.filter(topic => topic.approvalStatus === 'pending').length;

  // Sample organization data - in real app, this would come from API/props
  const organizations = [
    {
      id: 1,
      name: "Smart Cities and Communities",
      description: "A collaborative initiative focused on developing sustainable urban solutions through innovative technology and community engagement. We work with local governments, research institutions, and private sector partners to create smart infrastructure that improves quality of life for citizens. Our projects span renewable energy systems, intelligent transportation networks, and data-driven governance solutions. Through cutting-edge IoT sensors and AI-powered analytics, we help cities reduce their environmental footprint while enhancing operational efficiency.",
      website: "https://smartcities-communities.org",
      location: "Berlin, Brandenburg, Germany",
      category: "Public Sector Initiative",
      registrationDate: "29/08/2025",
      numberOfUsers: 156,
      totalAnalyses: 23,
      organizationContact: "Dr. Maria Schmidt",
      organizationContactEmails: ["info@smartcities-communities.org", "partnerships@smartcities-communities.org"],
      organizationPersonalContactEmail: "maria.schmidt@smartcities-communities.org",
      contactEmail: "info@smartcities-communities.org",
      contactPhone: "+49 30 1234 5678",
      personalContactEmail: "maria.schmidt@smartcities-communities.org"
    },
    {
      id: 2,
      name: "Regio Augsburg Wirtschaft GmbH",
      description: "Regional economic development agency promoting business growth and innovation in the Augsburg metropolitan area.",
      website: "https://regio-augsburg.de",
      location: "Augsburg, Bavaria, Germany",
      category: "Economic Development",
      registrationDate: "29/08/2025",
      numberOfUsers: 87,
      totalAnalyses: 15,
      organizationContact: "Hans Mueller",
      organizationContactEmails: ["contact@regio-augsburg.de", "business@regio-augsburg.de"],
      organizationPersonalContactEmail: "hans.mueller@regio-augsburg.de",
      contactEmail: "contact@regio-augsburg.de",
      contactPhone: "+49 821 9876 543",
      personalContactEmail: "hans.mueller@regio-augsburg.de"
    },
    {
      id: 3,
      name: "Invite test 06",
      description: "Test organization for invitation and collaboration features development and quality assurance.",
      website: "https://test.example.com",
      location: "Munich, Bavaria, Germany",
      category: "Technology & Testing",
      registrationDate: "03/09/2025",
      numberOfUsers: 12,
      totalAnalyses: 8,
      organizationContact: "Test Administrator",
      organizationContactEmails: ["test@example.com"],
      organizationPersonalContactEmail: "admin@test.example.com",
      contactEmail: "test@example.com",
      contactPhone: "+49 89 5555 1234",
      personalContactEmail: "admin@test.example.com"
    },
    {
      id: 4,
      name: "Packaging Excellence Region Stuttgart e.V.",
      description: "Leading association for packaging innovation and sustainability in the Stuttgart region, connecting industry leaders and research institutions.",
      website: "https://packaging-stuttgart.org",
      location: "Stuttgart, Baden-Württemberg, Germany",
      category: "Manufacturing & Industry",
      registrationDate: "29/08/2025",
      numberOfUsers: 203,
      totalAnalyses: 31,
      organizationContact: "Prof. Dr. Andreas Weber",
      organizationContactEmails: ["info@packaging-stuttgart.org", "research@packaging-stuttgart.org", "events@packaging-stuttgart.org"],
      organizationPersonalContactEmail: "andreas.weber@packaging-stuttgart.org",
      contactEmail: "info@packaging-stuttgart.org",
      contactPhone: "+49 711 4567 890",
      personalContactEmail: "andreas.weber@packaging-stuttgart.org"
    },
    {
      id: 5,
      name: "BioCampus Straubing GmbH",
      description: "Biotechnology research and development center specializing in renewable resources and bioeconomy solutions.",
      website: "https://biocampus-straubing.de",
      location: "Straubing, Bavaria, Germany",
      category: "Research & Development",
      registrationDate: "29/08/2025",
      numberOfUsers: 298,
      totalAnalyses: 42,
      organizationContact: "Dr. Elena Hoffmann",
      organizationContactEmails: ["info@biocampus-straubing.de", "research@biocampus-straubing.de"],
      organizationPersonalContactEmail: "elena.hoffmann@biocampus-straubing.de",
      contactEmail: "info@biocampus-straubing.de",
      contactPhone: "+49 9421 7890 123",
      personalContactEmail: "elena.hoffmann@biocampus-straubing.de"
    }
  ];

  const organization = organizations.find(org => org.id === parseInt(id || ""));

  // Sample users data
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "filip turk",
      email: "filip.t.turk@gmail.com",
      role: "User",
      lastLogin: "Never",
      status: "Active",
      analyses: 5,
      topics: ["Bioethanol", "Apple Pomace", "Digestate"]
    },
    {
      id: 2,
      name: "Archana A",
      email: "archana+vcg@vcg.ai",
      role: "User",
      lastLogin: "Never",
      status: "Active",
      analyses: 3,
      topics: ["Chitin & Chitosan", "Bioreactors"]
    },
    {
      id: 3,
      name: "John Doe",
      email: "john.doe@example.com",
      role: "Admin",
      lastLogin: "2 hours ago",
      status: "Active",
      analyses: 8,
      topics: ["Bioethanol", "Biobased Solvents", "Cottonseed Meal", "Digestate"]
    },
    {
      id: 4,
      name: "Sarah Wilson",
      email: "sarah.wilson@example.com",
      role: "Super Admin",
      lastLogin: "1 day ago",
      status: "Active",
      analyses: 4,
      topics: ["Apple Pomace", "Bioreactors", "Chitin & Chitosan"]
    },
    {
      id: 5,
      name: "Mike Johnson",
      email: "mike.johnson@example.com",
      role: "User",
      lastLogin: "3 days ago",
      status: "Inactive",
      analyses: 3,
      topics: ["Digestate", "Bioethanol"]
    }
  ]);

  // Sample active projects data
  const [activeProjects, setActiveProjects] = useState([
    {
      id: 1,
      name: "EU Green Deal Implementation",
      description: "Strategic analysis for implementing EU Green Deal policies",
      keyTopics: ["Feedstock", "Fructose"],
      owners: ["Filip Turk"],
      dateCreated: "Sep 16, 2025",
      lastModified: "3h ago",
      status: "Active"
    },
    {
      id: 2,
      name: "Circular Economy Assessment", 
      description: "Comprehensive assessment of circular economy opportunities",
      keyTopics: ["Feedstock", "Beans"],
      owners: ["Gregor Gabrovšek", "Jan Mitrovic"],
      dateCreated: "Sep 11, 2025",
      lastModified: "4h ago",
      status: "Active"
    },
    {
      id: 3,
      name: "Biorefinery Feasibility Study",
      description: "Technical and economic feasibility analysis for new biorefinery",
      keyTopics: ["Application", "Bio-based-greens"],
      owners: ["Jan Mitrovic", "Filip Turk", "Gregor Gabrovšek"],
      dateCreated: "Sep 11, 2025",
      lastModified: "6h ago",
      status: "Archived"
     }
  ]);

  // Function to change project status
  const handleChangeProjectStatus = (projectId: number, newStatus: string) => {
    console.log('Project status change called:', { projectId, newStatus });
    setActiveProjects(prevProjects => {
      const updated = prevProjects.map(project => 
        project.id === projectId 
          ? { ...project, status: newStatus }
          : project
      );
      console.log('Updated projects:', updated);
      return updated;
    });
  };

  if (!organization) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/analysis-management")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Organizations
          </Button>
        </div>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-muted-foreground">Organization not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 pb-8">
      <div className="p-4 space-y-4 animate-fade-in max-w-full">
        {/* Header with Back Button and Action Buttons */}
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="outline" 
            onClick={() => navigate("/analysis-management")}
            className="hover-scale"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Organizations
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="hover:bg-muted">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        {/* Single Organization Card */}
        <Card className="shadow-sm border-border/40">
          <CardContent className="p-4">

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Organization Title and Description */}
              <div>
                <div className="mb-3">
                  <h1 className="text-base font-bold text-foreground">
                    {organization.name}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs px-3 py-1.5 rounded-sm h-auto">
                      Registered Date: 29/08/2025
                    </Badge>
                    <Badge variant="default" className="text-xs px-3 py-1.5 rounded-sm h-auto bg-green-600 hover:bg-green-700">
                      Active
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {organization.description}
                </p>
              </div>

              {/* Right Column - Company and Contact Information */}
              <div className="space-y-3">
                {/* Company Information */}
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="mb-3">
                    <h3 className="text-base font-semibold text-foreground">Company Information</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide min-w-[80px]">Category</span>
                      <Badge variant="secondary" className="ml-4 rounded-sm text-xs">{organization.category}</Badge>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide min-w-[80px]">Location</span>
                      <span className="text-xs text-foreground text-right ml-4">{organization.location}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide min-w-[80px]">Website</span>
                      <Button variant="link" className="p-0 h-auto text-primary hover:text-primary/80 ml-4 text-xs" asChild>
                        <a href={organization.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                          Visit Website <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="mb-3">
                    <h3 className="text-base font-semibold text-foreground">Contact Information</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide min-w-[100px]">Contact Email</span>
                      <Button variant="link" className="p-0 h-auto text-primary hover:text-primary/80 ml-4 text-xs" asChild>
                        <a href={`mailto:${organization.contactEmail}`} className="text-right">
                          {organization.contactEmail}
                        </a>
                      </Button>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide min-w-[100px]">Contact Phone</span>
                      <Button variant="link" className="p-0 h-auto text-foreground hover:text-primary font-mono ml-4 text-xs" asChild>
                        <a href={`tel:${organization.contactPhone}`}>
                          {organization.contactPhone}
                        </a>
                      </Button>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide min-w-[100px]">Personal Contact</span>
                      <Button variant="link" className="p-0 h-auto text-primary hover:text-primary/80 ml-4 text-xs" asChild>
                        <a href={`mailto:${organization.personalContactEmail}`} className="text-right">
                          {organization.personalContactEmail}
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-fade-in">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="analyses" className="flex items-center gap-2 text-sm relative">
              <BarChart3 className="w-4 h-4" />
              Analysis Topics
              <Badge variant="secondary" className="ml-2 text-xs px-2 py-1 rounded-full">
                {organization.totalAnalyses}
              </Badge>
              {pendingTopicsCount > 0 && (
                <Bell className="absolute -top-1 -right-1 w-7 h-7 text-red-500 fill-red-500 animate-pulse drop-shadow-sm" />
              )}
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4" />
              Analyses
              <Badge variant="secondary" className="ml-2 text-xs">
                {activeProjects.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4" />
              User Management
              <Badge variant="secondary" className="ml-2 text-xs">
                {organization.numberOfUsers}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users">
            <Card className="animate-fade-in shadow-sm">
              <CardHeader className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Organization Users</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Manage users, roles, and permissions
                      </p>
                    </div>
                  </div>
                  <Button size="sm" className="hover-scale flex items-center gap-2 bg-primary hover:bg-primary/90">
                    <Plus className="w-3 h-3" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/30 border-b">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
                          Name
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
                          Email
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
                          Role
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
                          Last Login
                        </th>
                         <th className="text-left py-3 px-4 font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
                           Actions
                         </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user, index) => (
                        <tr 
                          key={user.id} 
                          className={`
                            border-b border-border/20 hover:bg-muted/20 transition-all duration-200
                            ${index === users.length - 1 ? 'border-b-0' : ''}
                          `}
                        >
                           <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div>
                                  <p className="font-medium text-sm text-foreground">{user.name}</p>
                               </div>
                             </div>
                          </td>
                          <td className="py-3 px-4">
                            <a 
                              href={`mailto:${user.email}`}
                              className="text-primary hover:underline text-xs story-link"
                            >
                              {user.email}
                            </a>
                          </td>
                           <td className="py-3 px-4 relative">
                             <div className="relative">
                               <Badge 
                                 variant={
                                   user.role === 'Admin' ? 'default' : 
                                   user.role === 'Super Admin' ? 'default' : 
                                   'outline'
                                 }
                                 className="text-xs font-medium rounded-md cursor-pointer hover:shadow-md transition-all duration-200 inline-flex items-center gap-1.5 px-3 py-1.5"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   console.log('Role badge clicked for user:', user.id);
                                   setOpenRoleDropdown(openRoleDropdown === user.id ? null : user.id);
                                 }}
                               >
                                 {user.role}
                                 <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${openRoleDropdown === user.id ? 'rotate-180' : ''}`} />
                               </Badge>
                               
                               {openRoleDropdown === user.id && (
                                 <>
                                   {/* Backdrop */}
                                   <div 
                                     className="fixed inset-0 z-40" 
                                     onClick={() => setOpenRoleDropdown(null)}
                                   />
                                   
                                   {/* Dropdown */}
                                   <div className="absolute top-full left-0 mt-2 w-40 bg-background border border-border rounded-lg shadow-xl z-[9999] py-1 animate-scale-in">
                                     <div className="px-1" onClick={(e) => e.stopPropagation()}>
                                       <div
                                         className={`w-full px-3 py-2 text-left text-xs rounded-md hover:bg-muted/80 transition-all duration-150 flex items-center justify-between group cursor-pointer ${
                                           user.role === 'User' ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                                         }`}
                                         onMouseDown={(e) => {
                                           e.preventDefault();
                                           e.stopPropagation();
                                           console.log('User role clicked for user:', user.id);
                                           handleChangeUserRole(user.id, 'User');
                                           setOpenRoleDropdown(null);
                                         }}
                                       >
                                         <span className="flex items-center gap-2">
                                           <User className="w-3 h-3 text-blue-500" />
                                           User
                                         </span>
                                         {user.role === 'User' && (
                                           <Check className="w-3.5 h-3.5 text-primary animate-scale-in" />
                                         )}
                                       </div>
                                       <div
                                         className={`w-full px-3 py-2 text-left text-xs rounded-md hover:bg-muted/80 transition-all duration-150 flex items-center justify-between group cursor-pointer ${
                                           user.role === 'Admin' ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                                         }`}
                                         onMouseDown={(e) => {
                                           e.preventDefault();
                                           e.stopPropagation();
                                           console.log('Admin role clicked for user:', user.id);
                                           handleChangeUserRole(user.id, 'Admin');
                                           setOpenRoleDropdown(null);
                                         }}
                                       >
                                         <span className="flex items-center gap-2">
                                           <Shield className="w-3 h-3 text-orange-500" />
                                           Admin
                                         </span>
                                         {user.role === 'Admin' && (
                                           <Check className="w-3.5 h-3.5 text-primary animate-scale-in" />
                                         )}
                                       </div>
                                       <div
                                         className={`w-full px-3 py-2 text-left text-xs rounded-md hover:bg-muted/80 transition-all duration-150 flex items-center justify-between group cursor-pointer ${
                                           user.role === 'Super Admin' ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                                         }`}
                                         onMouseDown={(e) => {
                                           e.preventDefault();
                                           e.stopPropagation();
                                           console.log('Super Admin role clicked for user:', user.id);
                                           handleChangeUserRole(user.id, 'Super Admin');
                                           setOpenRoleDropdown(null);
                                         }}
                                       >
                                         <span className="flex items-center gap-2">
                                           <Crown className="w-3 h-3 text-purple-500" />
                                           Super Admin
                                         </span>
                                         {user.role === 'Super Admin' && (
                                           <Check className="w-3.5 h-3.5 text-primary animate-scale-in" />
                                         )}
                                       </div>
                                     </div>
                                   </div>
                                 </>
                               )}
                             </div>
                            </td>
                             <td className="py-3 px-4 relative">
                               <div className="relative">
                                  <Badge 
                                    variant={user.status === 'Active' ? 'default' : 'secondary'}
                                    className={`text-xs font-medium rounded-md cursor-pointer transition-all duration-200 inline-flex items-center gap-1.5 px-3 py-1.5 w-24 justify-center ${
                                      user.status === 'Active' 
                                        ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md' 
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 hover:shadow-md'
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      console.log('Status badge clicked for user:', user.id);
                                      setOpenStatusDropdown(openStatusDropdown === user.id ? null : user.id);
                                    }}
                                  >
                                    {user.status}
                                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${openStatusDropdown === user.id ? 'rotate-180' : ''}`} />
                                  </Badge>
                                 
                                 {openStatusDropdown === user.id && (
                                   <>
                                     {/* Backdrop */}
                                     <div 
                                       className="fixed inset-0 z-40" 
                                       onClick={() => setOpenStatusDropdown(null)}
                                     />
                                     
                                     {/* Dropdown */}
                                     <div className="absolute top-full left-0 mt-2 w-36 bg-background border border-border rounded-lg shadow-xl z-[9999] py-1 animate-scale-in">
                                       <div className="px-1" onClick={(e) => e.stopPropagation()}>
                                         <AlertDialog>
                                           <AlertDialogTrigger asChild>
                                             <div
                                               className={`w-full px-3 py-2 text-left text-xs rounded-md hover:bg-muted/80 transition-all duration-150 flex items-center justify-between group cursor-pointer ${
                                                 user.status === 'Active' ? 'bg-green-50 text-green-700 font-medium dark:bg-green-950/20 dark:text-green-400' : 'text-foreground'
                                               }`}
                                             >
                                               <span className="flex items-center gap-2">
                                                 <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-green-500' : 'bg-muted'}`} />
                                                 Active
                                               </span>
                                               {user.status === 'Active' && (
                                                 <Check className="w-3.5 h-3.5 text-green-600 animate-scale-in" />
                                               )}
                                             </div>
                                           </AlertDialogTrigger>
                                           <AlertDialogContent>
                                             <AlertDialogHeader>
                                               <AlertDialogTitle>
                                                 {user.status === 'Active' ? 'Deactivate User' : 'Activate User'}
                                               </AlertDialogTitle>
                                               <AlertDialogDescription>
                                                  {user.status === 'Active' 
                                                    ? `Are you sure you want to deactivate ${user.name}? They will lose access to the organization and all associated analyses.`
                                                    : `Are you sure you want to activate ${user.name}? They will regain access to the organization.`
                                                  }
                                               </AlertDialogDescription>
                                             </AlertDialogHeader>
                                             <AlertDialogFooter>
                                               <AlertDialogCancel onClick={() => setOpenStatusDropdown(null)}>Cancel</AlertDialogCancel>
                                               <AlertDialogAction
                                                 onClick={() => {
                                                   handleDeactivateUser(user.id);
                                                   setOpenStatusDropdown(null);
                                                 }}
                                                 className={user.status === 'Active' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                                               >
                                                 {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                                               </AlertDialogAction>
                                             </AlertDialogFooter>
                                           </AlertDialogContent>
                                         </AlertDialog>
                                         
                                         <AlertDialog>
                                           <AlertDialogTrigger asChild>
                                             <div
                                               className={`w-full px-3 py-2 text-left text-xs rounded-md hover:bg-muted/80 transition-all duration-150 flex items-center justify-between group cursor-pointer ${
                                                 user.status === 'Inactive' ? 'bg-red-50 text-red-700 font-medium dark:bg-red-950/20 dark:text-red-400' : 'text-foreground'
                                               }`}
                                             >
                                               <span className="flex items-center gap-2">
                                                 <div className={`w-2 h-2 rounded-full ${user.status === 'Inactive' ? 'bg-red-500' : 'bg-muted'}`} />
                                                 Inactive
                                               </span>
                                               {user.status === 'Inactive' && (
                                                 <Check className="w-3.5 h-3.5 text-red-600 animate-scale-in" />
                                               )}
                                             </div>
                                           </AlertDialogTrigger>
                                           <AlertDialogContent>
                                             <AlertDialogHeader>
                                               <AlertDialogTitle>
                                                 {user.status === 'Inactive' ? 'Activate User' : 'Deactivate User'}
                                               </AlertDialogTitle>
                                               <AlertDialogDescription>
                                                  {user.status === 'Inactive' 
                                                    ? `Are you sure you want to activate ${user.name}? They will regain access to the organization.`
                                                    : `Are you sure you want to deactivate ${user.name}? They will lose access to the organization and all associated analyses.`
                                                  }
                                               </AlertDialogDescription>
                                             </AlertDialogHeader>
                                             <AlertDialogFooter>
                                               <AlertDialogCancel onClick={() => setOpenStatusDropdown(null)}>Cancel</AlertDialogCancel>
                                               <AlertDialogAction
                                                 onClick={() => {
                                                   handleDeactivateUser(user.id);
                                                   setOpenStatusDropdown(null);
                                                 }}
                                                 className={user.status === 'Inactive' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                                               >
                                                 {user.status === 'Inactive' ? 'Activate' : 'Deactivate'}
                                               </AlertDialogAction>
                                             </AlertDialogFooter>
                                           </AlertDialogContent>
                                         </AlertDialog>
                                       </div>
                                     </div>
                                   </>
                                 )}
                               </div>
                             </td>
                           <td className="py-3 px-4">
                             <div className="flex items-center gap-2">
                               <div className={`w-1.5 h-1.5 rounded-full ${
                                 user.status === 'Inactive' ? 'bg-red-500' :
                                 user.lastLogin === 'Never' ? 'bg-gray-400' : 
                                 user.lastLogin.includes('hour') ? 'bg-green-500' : 
                                 user.lastLogin.includes('day') ? 'bg-yellow-500' : 
                                 'bg-red-500'
                               }`} />
                               <span className={`text-xs ${
                                 user.status === 'Inactive' ? 'text-red-600 font-medium' : 'text-muted-foreground'
                               }`}>
                                 {user.status === 'Inactive' ? 'Inactive' : user.lastLogin}
                               </span>
                             </div>
                           </td>
                            <td className="py-3 px-4">
                               <Button variant="outline" size="sm" className="hover-scale px-3 py-2 flex items-center justify-center gap-2">
                                 <Key className="w-3 h-3" />
                                 <span>Reset</span>
                               </Button>
                            </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysis Topics Tab */}
          <TabsContent value="analyses">
            <Card className="animate-fade-in">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Analysis Topics</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        All analysis topics and research areas being worked on by users in this organization.
                      </p>
                    </div>
                  </div>
                  <Button size="sm" className="hover-scale flex items-center gap-2 bg-primary hover:bg-primary/90">
                    <Plus className="w-3 h-3" />
                    New Topic
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                      <thead className="bg-muted/30 border-b">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
                            Category
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
                            Topic
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
                            Status
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
                            Date Added
                          </th>
                          <th className="text-right py-3 px-4 font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
                            Actions
                          </th>
                        </tr>
                     </thead>
                     <tbody>
                       {sortedAnalysisTopics.map((topic, index) => (
                          <tr 
                            key={topic.id} 
                             className={`
                               border-b border-border/20 hover:bg-muted/20 transition-all duration-200
                               ${index === sortedAnalysisTopics.length - 1 ? 'border-b-0' : ''}
                               ${topic.status === 'Archived' ? 'opacity-60' : ''}
                               ${isNewTopic(topic.addedDate) && topic.approvalStatus === 'pending' ? 'bg-gradient-to-r from-gray-50/60 to-gray-50/60 dark:from-gray-900/20 dark:to-gray-900/20 border-l-2 border-l-gray-300' : ''}
                             `}
                          >
                            <td className="py-3 px-4">
                              <Badge className={`text-xs rounded-sm px-2 py-0 font-medium ${getCategoryColorClasses(topic.category)}`}>
                                {topic.category}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-start gap-3">
                                <div className="min-w-0 flex-1">
                                   <div className="flex items-center gap-2 mb-1">
                                     <p className="font-medium text-sm text-foreground">{topic.name}</p>
                                      {isNewTopic(topic.addedDate) && topic.approvalStatus === 'pending' && (
                                        <Badge className="text-xs px-2 py-0.5 bg-red-500 hover:bg-red-600 text-white border-0 shadow-sm animate-pulse rounded-full font-semibold">
                                          New
                                        </Badge>
                                      )}
                                   </div>
                                   <p className="text-xs text-muted-foreground mt-1">
                                     {topic.approvalStatus === 'pending' 
                                       ? 'Database: To be assigned upon approval' 
                                       : `Database used: ${topic.database}`
                                     }
                                   </p>
                                </div>
                              </div>
                            </td>
                             <td className="py-3 px-4 relative">
                                {topic.approvalStatus === 'pending' ? (
                                  <Badge 
                                    variant="secondary"
                                    className="text-xs font-medium rounded-md px-3 py-1.5 bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 w-20 justify-center"
                                  >
                                    Pending
                                  </Badge>
                                ) : topic.approvalStatus === 'denied' ? (
                                  <Badge 
                                    variant="secondary"
                                    className="text-xs font-medium rounded-md px-3 py-1.5 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300 w-20 justify-center"
                                  >
                                    Denied
                                  </Badge>
                                ) : (
                                  <div className="relative">
                                    <Badge 
                                      variant={topic.status === 'Active' ? 'default' : 'secondary'}
                                      className="text-xs font-medium rounded-md cursor-pointer hover:shadow-md transition-all duration-200 inline-flex items-center gap-1.5 px-3 py-1.5 w-20 justify-center"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('Badge clicked for topic:', topic.id);
                                        setOpenDropdown(openDropdown === topic.id ? null : topic.id);
                                      }}
                                    >
                                      {topic.status}
                                      <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${openDropdown === topic.id ? 'rotate-180' : ''}`} />
                                    </Badge>
                                   
                                   {openDropdown === topic.id && (
                                     <>
                                       {/* Backdrop */}
                                       <div 
                                         className="fixed inset-0 z-40" 
                                         onClick={() => setOpenDropdown(null)}
                                       />
                                       
                                       {/* Dropdown */}
                                       <div className="absolute top-full left-0 mt-2 w-36 bg-background border border-border rounded-lg shadow-xl z-[9999] py-1 animate-scale-in">
                                         <div className="px-1" onClick={(e) => e.stopPropagation()}>
                                           <div
                                             className={`w-full px-3 py-2 text-left text-xs rounded-md hover:bg-muted/80 transition-all duration-150 flex items-center justify-between group cursor-pointer ${
                                               topic.status === 'Active' ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                                             }`}
                                             onMouseDown={(e) => {
                                               e.preventDefault();
                                               e.stopPropagation();
                                               console.log('Active clicked for topic:', topic.id);
                                               handleChangeAnalysisStatus(topic.id, 'Active');
                                               setOpenDropdown(null);
                                             }}
                                           >
                                             <span className="flex items-center gap-2">
                                               <div className={`w-2 h-2 rounded-full ${topic.status === 'Active' ? 'bg-green-500' : 'bg-muted'}`} />
                                               Active
                                             </span>
                                             {topic.status === 'Active' && (
                                               <Check className="w-3.5 h-3.5 text-primary animate-scale-in" />
                                             )}
                                           </div>
                                           <div
                                             className={`w-full px-3 py-2 text-left text-xs rounded-md hover:bg-muted/80 transition-all duration-150 flex items-center justify-between group cursor-pointer ${
                                               topic.status === 'Archived' ? 'bg-muted/50 text-muted-foreground font-medium' : 'text-foreground'
                                             }`}
                                             onMouseDown={(e) => {
                                               e.preventDefault();
                                               e.stopPropagation();
                                               console.log('Archived clicked for topic:', topic.id);
                                               handleChangeAnalysisStatus(topic.id, 'Archived');
                                               setOpenDropdown(null);
                                             }}
                                           >
                                             <span className="flex items-center gap-2">
                                               <div className={`w-2 h-2 rounded-full ${topic.status === 'Archived' ? 'bg-gray-400' : 'bg-muted'}`} />
                                               Archived
                                             </span>
                                             {topic.status === 'Archived' && (
                                               <Check className="w-3.5 h-3.5 text-muted-foreground animate-scale-in" />
                                             )}
                                           </div>
                                         </div>
                                       </div>
                                     </>
                                   )}
                                 </div>
                               )}
                             </td>
                           <td className="py-3 px-4">
                             <span className="text-muted-foreground text-xs">{topic.addedDate}</span>
                           </td>
                             <td className="py-3 px-4 text-right">
                               {isNewTopic(topic.addedDate) && topic.approvalStatus === 'pending' ? (
                                 <Button 
                                   variant="outline" 
                                   size="sm" 
                                   className="hover-scale text-xs px-2 py-1.5 border-muted text-muted-foreground hover:bg-muted/50"
                                   onClick={() => handleApproveTopic(topic.id, topic.name, topic.description)}
                                 >
                                   <FileSearch className="w-3 h-3" />
                                 </Button>
                              ) : topic.approvalStatus === 'denied' ? (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="hover-scale text-xs px-2 py-1 opacity-50 cursor-not-allowed"
                                  disabled
                                >
                                  <XCircle className="w-3 h-3" />
                                </Button>
                              ) : topic.status === 'Archived' ? (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="hover-scale text-xs px-2 py-1"
                                  onClick={() => handleChangeAnalysisStatus(topic.id, 'Active')}
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </Button>
                              ) : (
                                 <Button variant="outline" size="sm" className="hover-scale px-2 py-1">
                                   <RefreshCw className="w-3 h-3" />
                                 </Button>
                              )}
                            </td>
                         </tr>
                      ))}
                     </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Projects Tab */}
          <TabsContent value="projects">
            <Card className="animate-fade-in">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Activity className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Analyses</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Current analyses with ongoing progress and their status.
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/30 border-b">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
                          Analysis Name
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
                          Analysis Owner
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
                          Date Created
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
                          Last Modified
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
                          Status
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeProjects.map((project, index) => (
                        <tr 
                          key={project.id} 
                          className={`
                            border-b border-border/20 hover:bg-muted/20 transition-all duration-200
                            ${index === activeProjects.length - 1 ? 'border-b-0' : ''}
                          `}
                        >
                          <td className="py-3 px-4">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm text-foreground mb-2">{project.name}</p>
                                <div className="flex flex-wrap gap-2">
                                  {project.keyTopics.map((topic, idx) => {
                                      if (topic === 'Feedstock') {
                                        return (
                                          <span 
                                            key={idx} 
                                            className="inline-block px-2 py-0 text-xs font-medium rounded-sm bg-success text-success-foreground text-center"
                                          >
                                            {topic}
                                          </span>
                                        );
                                      } else if (topic === 'Fructose' || topic === 'Beans') {
                                        return (
                                          <span 
                                            key={idx} 
                                            className="inline-block px-2 py-0 text-xs font-medium rounded-sm bg-success/10 text-success border border-success/30 text-center"
                                          >
                                            {topic}
                                          </span>
                                        );
                                      } else if (topic === 'Bio-based-greens') {
                                        return (
                                          <span 
                                            key={idx} 
                                            className="inline-block px-2 py-0 text-xs font-medium rounded-sm bg-orange-100 text-orange-700 border border-orange-300 text-center"
                                          >
                                            {topic}
                                          </span>
                                        );
                                      } else if (topic === 'Application') {
                                        return (
                                          <span 
                                            key={idx} 
                                            className="inline-block px-2 py-0 text-xs font-medium rounded-sm bg-orange-500 text-white text-center"
                                          >
                                            {topic}
                                          </span>
                                        );
                                      } else {
                                        return (
                                          <span 
                                            key={idx} 
                                            className="inline-block px-2 py-0 text-xs font-medium rounded-sm bg-product-blue text-product-blue-foreground text-center"
                                          >
                                            {topic}
                                          </span>
                                        );
                                    }
                                  })}
                                </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              {project.owners.map((owner, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <span className="text-sm text-foreground">{owner}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-foreground">{project.dateCreated}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full bg-green-500`} />
                              <span className="text-sm text-muted-foreground">{project.lastModified}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle">
                            <div className="relative">
                              <Badge 
                                variant={project.status === 'Active' ? 'default' : 'secondary'}
                                className={`text-xs font-medium rounded-md cursor-pointer hover:shadow-md transition-all duration-200 inline-flex items-center gap-1.5 px-3 py-1.5 w-20 justify-center ${
                                  project.status === 'Active' ? 'bg-green-600 text-white hover:bg-green-700' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('Project badge clicked for project:', project.id);
                                  setOpenProjectDropdown(openProjectDropdown === project.id ? null : project.id);
                                }}
                              >
                                {project.status}
                                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${openProjectDropdown === project.id ? 'rotate-180' : ''}`} />
                              </Badge>
                              
                              {openProjectDropdown === project.id && (
                                <>
                                  {/* Backdrop */}
                                  <div 
                                    className="fixed inset-0 z-40" 
                                    onClick={() => setOpenProjectDropdown(null)}
                                  />
                                  
                                  {/* Dropdown */}
                                  <div className="absolute top-full left-0 mt-2 w-36 bg-background border border-border rounded-lg shadow-xl z-[9999] py-1 animate-scale-in">
                                    <div className="px-1" onClick={(e) => e.stopPropagation()}>
                                      <div
                                        className={`w-full px-3 py-2 text-left text-xs rounded-md hover:bg-muted/80 transition-all duration-150 flex items-center justify-between group cursor-pointer ${
                                          project.status === 'Active' ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                                        }`}
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          console.log('Active clicked for project:', project.id);
                                          handleChangeProjectStatus(project.id, 'Active');
                                          setOpenProjectDropdown(null);
                                        }}
                                      >
                                        <span className="flex items-center gap-2">
                                          <div className={`w-2 h-2 rounded-full ${project.status === 'Active' ? 'bg-green-500' : 'bg-muted'}`} />
                                          Active
                                        </span>
                                        {project.status === 'Active' && (
                                          <Check className="w-3.5 h-3.5 text-primary animate-scale-in" />
                                        )}
                                      </div>
                                      <div
                                        className={`w-full px-3 py-2 text-left text-xs rounded-md hover:bg-muted/80 transition-all duration-150 flex items-center justify-between group cursor-pointer ${
                                          project.status === 'Archived' ? 'bg-muted/50 text-muted-foreground font-medium' : 'text-foreground'
                                        }`}
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          console.log('Archived clicked for project:', project.id);
                                          handleChangeProjectStatus(project.id, 'Archived');
                                          setOpenProjectDropdown(null);
                                        }}
                                      >
                                        <span className="flex items-center gap-2">
                                          <div className={`w-2 h-2 rounded-full ${project.status === 'Archived' ? 'bg-gray-400' : 'bg-muted'}`} />
                                          Archived
                                        </span>
                                        {project.status === 'Archived' && (
                                          <Check className="w-3.5 h-3.5 text-muted-foreground animate-scale-in" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right align-middle">
                             <Button variant="outline" size="sm" className="hover-scale px-2 py-1">
                               <ChevronRight className="w-3 h-3 mr-1" />
                               Open
                             </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Approval Dialog */}
      <Dialog open={!!approvalDialog} onOpenChange={(open) => !open && setApprovalDialog(null)}>
        <DialogContent className="sm:max-w-xl max-w-3xl w-full">
          <DialogHeader>
            <DialogTitle className="text-lg">Review Technology Request</DialogTitle>
          </DialogHeader>
           <div className="space-y-2">
             {/* Name Section */}
             <div className="bg-muted/60 rounded-lg p-2.5 border">
               <label className="text-xs font-bold text-muted-foreground block mb-1">Name</label>
               <p className="text-xs font-medium text-foreground">{approvalDialog?.topicName}</p>
             </div>
             
             {/* Category Section */}
             <div className="bg-muted/60 rounded-lg p-2.5 border">
               <label className="text-xs font-bold text-muted-foreground block mb-1">Subcategory</label>
               <p className="text-xs font-medium text-foreground">
                 {analysisTopics.find(topic => topic.id === approvalDialog?.topicId)?.category}
               </p>
             </div>
             
             {/* Description Section */}
             <div className="bg-muted/60 rounded-lg p-2.5 border">
               <label className="text-xs font-bold text-muted-foreground block mb-1">Description</label>
               <p className="text-xs text-foreground leading-relaxed min-h-[2.5rem] break-words">{approvalDialog?.description}</p>
             </div>
             
             {/* Database Selection Section */}
             <div className="bg-muted/60 rounded-lg p-2.5 border">
               <label className="text-xs font-bold text-muted-foreground block mb-1">Database Selection</label>
               <p className="text-xs text-muted-foreground mb-2">
                 Please select which database this analysis should use:
               </p>
               <Select value={selectedDatabase} onValueChange={setSelectedDatabase}>
                 <SelectTrigger className="bg-muted/40 border-muted-foreground/20 hover:bg-muted/60 focus:bg-muted/60 text-xs">
                   <SelectValue placeholder="Choose a database..." />
                 </SelectTrigger>
                 <SelectContent 
                   position="popper" 
                   side="bottom" 
                   align="start" 
                   sideOffset={4}
                   className="max-h-60 overflow-y-auto bg-background/95 backdrop-blur-sm border border-muted-foreground/20 text-xs"
                   avoidCollisions={false}
                 >
                   {availableDatabases.map((db) => (
                     <SelectItem 
                       key={db} 
                       value={db}
                       className="hover:bg-muted/60 focus:bg-muted/60 text-xs py-1"
                     >
                       {db}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           </div>
            
              <div className="flex gap-3 justify-end">
                <Button 
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-md font-medium"
                  onClick={() => {
                    if (approvalDialog) {
                      handleDenyTopic(approvalDialog.topicId);
                    }
                    setApprovalDialog(null);
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Decline
                </Button>
                <Button 
                  onClick={confirmApproval}
                  disabled={!selectedDatabase}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium disabled:bg-green-300"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
               </div>
         </DialogContent>
       </Dialog>
     </div>
   );
 };
 
 export default OrganizationManagement;