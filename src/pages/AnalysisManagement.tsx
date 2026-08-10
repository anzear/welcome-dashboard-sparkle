import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, Play, Pause, Clock, CheckCircle, AlertCircle, Eye, Trash2, Plus, Bell, Check, X, User, Search, Filter, RefreshCw, Building, Users, FolderOpen, Database } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AnalysisManagement = () => {
  const navigate = useNavigate();

  const databaseRepertoire = [
    { id: 1, name: "Wheat Straw Database", category: "Feedstock", records: 1245, lastUpdated: "2 days ago", status: "active" },
    { id: 2, name: "Biochar Database", category: "Product", records: 892, lastUpdated: "1 week ago", status: "active" },
    { id: 3, name: "Lignin Database", category: "Product", records: 567, lastUpdated: "3 days ago", status: "active" },
    { id: 4, name: "Sugar Beet Database", category: "Feedstock", records: 334, lastUpdated: "5 days ago", status: "active" },
    { id: 5, name: "Cellulose Database", category: "Product", records: 2156, lastUpdated: "1 day ago", status: "active" },
    { id: 6, name: "Xylose Database", category: "Product", records: 4521, lastUpdated: "4 hours ago", status: "syncing" },
    { id: 7, name: "Hemicellulose Database", category: "Product", records: 8934, lastUpdated: "6 hours ago", status: "active" },
    { id: 8, name: "Corn Stover Database", category: "Feedstock", records: 156, lastUpdated: "2 weeks ago", status: "active" },
  ];
  const organizations = [
    {
      id: 1,
      name: "Smart Cities and Communities",
      registrationTime: "29/08/2025, 10:48:25",
      lastLoginTime: "Not available",
      totalAnalyses: 23,
      description: "A collaborative initiative focused on developing sustainable urban solutions through innovative technology and community engagement.",
      website: "https://smartcities-communities.org",
      location: "Berlin, Germany",
      registrationDate: "29/08/2025",
      numberOfUsers: 156,
      hasPendingRequests: true,
      pendingRequestsCount: 3
    },
    {
      id: 2,
      name: "Regio Augsburg Wirtschaft GmbH",
      registrationTime: "29/08/2025, 10:48:25", 
      lastLoginTime: "Not available",
      totalAnalyses: 15,
      description: "Regional economic development agency promoting business growth and innovation in the Augsburg metropolitan area.",
      website: "https://regio-augsburg.de",
      location: "Augsburg, Germany",
      registrationDate: "29/08/2025",
      numberOfUsers: 87
    },
    {
      id: 3,
      name: "Invite test 06",
      registrationTime: "03/09/2025, 07:11:09",
      lastLoginTime: "03/09/2025, 07:11:13",
      totalAnalyses: 8,
      description: "Test organization for invitation and collaboration features development and quality assurance.",
      website: "https://test.example.com",
      location: "Munich, Germany",
      registrationDate: "03/09/2025",
      numberOfUsers: 12
    },
    {
      id: 4,
      name: "Packaging Excellence Region Stuttgart e.V.",
      registrationTime: "29/08/2025, 10:48:25",
      lastLoginTime: "Not available", 
      totalAnalyses: 31,
      description: "Leading association for packaging innovation and sustainability in the Stuttgart region, connecting industry leaders and research institutions.",
      website: "https://packaging-stuttgart.org",
      location: "Stuttgart, Germany",
      registrationDate: "29/08/2025",
      numberOfUsers: 203
    },
    {
      id: 5,
      name: "BioCampus Straubing GmbH",
      registrationTime: "29/08/2025, 10:48:25",
      lastLoginTime: "Not available",
      totalAnalyses: 42,
      description: "Biotechnology research and development center specializing in renewable resources and bioeconomy solutions.",
      website: "https://biocampus-straubing.de",
      location: "Straubing, Germany",
      registrationDate: "29/08/2025",
      numberOfUsers: 298,
      hasPendingRequests: true,
      pendingRequestsCount: 2
    },
    {
      id: 6,
      name: "Invite Test 08",
      registrationTime: "03/09/2025, 12:15:20",
      lastLoginTime: "04/09/2025, 11:05:29",
      totalAnalyses: 12,
      description: "Advanced testing organization for system integration and user experience validation processes.",
      website: "https://test08.example.com",
      location: "Frankfurt, Germany",
      registrationDate: "03/09/2025",
      numberOfUsers: 24
    },
    {
      id: 7,
      name: "Vegepolys Valley",
      registrationTime: "29/08/2025, 10:48:25",
      lastLoginTime: "Not available",
      totalAnalyses: 19,
      description: "French competitiveness cluster dedicated to vegetable production, processing, and plant-based innovations.",
      website: "https://vegepolys-valley.eu",
      location: "Angers, France",
      registrationDate: "29/08/2025",
      numberOfUsers: 134
    },
    {
      id: 8,
      name: "Plastics Cluster",
      registrationTime: "29/08/2025, 10:48:25",
      lastLoginTime: "Not available",
      totalAnalyses: 27,
      description: "Industrial cluster promoting sustainable plastic technologies and circular economy solutions in manufacturing.",
      website: "https://plastics-cluster.org",
      location: "Vienna, Austria",
      registrationDate: "29/08/2025",
      numberOfUsers: 178
    },
    {
      id: 9,
      name: "VCG",
      registrationTime: "29/08/2025, 10:48:25",
      lastLoginTime: "Not available",
      totalAnalyses: 156
    },
    {
      id: 10,
      name: "david6",
      registrationTime: "Not available",
      lastLoginTime: "Not available",
      totalAnalyses: 3
    }
  ];

  const notifications = [
    {
      id: 1,
      type: "approval_request",
      title: "New Analysis Request",
      message: "John Smith has requested analysis for 'Wheat Straw Biorefinery' in Feedstock category",
      requestedBy: "John Smith",
      email: "john.smith@company.com",
      category: "Feedstock",
      itemName: "Wheat Straw Biorefinery",
      industry: "Agriculture & Food",
      description: "Comprehensive analysis of wheat straw as a feedstock for biorefinery applications, including technical feasibility and economic assessment.",
      requestedAt: "2 hours ago",
      estimatedCost: "$2,500",
      estimatedDuration: "14-16 hours"
    },
    {
      id: 2,
      type: "approval_request", 
      title: "Analysis Cost Approval",
      message: "Sarah Johnson has requested analysis for 'Lignin Extraction Process' in Technology category",
      requestedBy: "Sarah Johnson",
      email: "sarah.j@company.com", 
      category: "Process",
      itemName: "Lignin Extraction Process",
      industry: "Chemicals & Materials",
      description: "Analysis of advanced lignin extraction technologies and their integration into existing biorefinery processes.",
      requestedAt: "4 hours ago",
      estimatedCost: "$3,200",
      estimatedDuration: "18-20 hours"
    }
  ];

  const activeAnalyses = [
    {
      id: 1,
      name: "Cellulose Biorefinery Analysis",
      category: "Feedstock",
      status: "running",
      progress: 65,
      startedAt: "2 hours ago",
      estimatedCompletion: "4 hours remaining",
      industry: "Agriculture & Food"
    },
    {
      id: 2,
      name: "Enzymatic Processing Study",
      category: "Process", 
      status: "running",
      progress: 30,
      startedAt: "1 day ago",
      estimatedCompletion: "8 hours remaining",
      industry: "Chemicals & Materials"
    }
  ];

  const completedAnalyses = [
    {
      id: 3,
      name: "Sugar Beet Value Chain",
      category: "Feedstock",
      status: "completed",
      completedAt: "3 days ago",
      duration: "12 hours",
      industry: "Agriculture & Food"
    },
    {
      id: 4,
      name: "Biochemical Processing Routes",
      category: "Process",
      status: "completed", 
      completedAt: "1 week ago",
      duration: "18 hours",
      industry: "Chemicals & Materials"
    }
  ];

  const pendingAnalyses = [
    {
      id: 5,
      name: "Xylose Market Analysis",
      category: "Products",
      status: "pending",
      requestedAt: "2 days ago",
      industry: "Industrial Chemicals"
    }
  ];

  const handleApprove = (notificationId: number) => {
    console.log("Approved notification:", notificationId);
  };

  const handleDecline = (notificationId: number) => {
    console.log("Declined notification:", notificationId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Play className="w-4 h-4 text-blue-500" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-orange-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      running: "bg-blue-100 text-blue-800 border-blue-200",
      completed: "bg-green-100 text-green-800 border-green-200", 
      pending: "bg-orange-100 text-orange-800 border-orange-200"
    };
    
    return (
      <Badge className={`${variants[status as keyof typeof variants]} text-xs`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Feedstock":
        return "text-success";
      case "Process":
        return "text-product-blue";
      case "Products":
        return "text-application-purple";
      case "Applications":
        return "text-market-orange";
      case "Sustainability":
        return "text-green-600";
      case "Economics":
        return "text-blue-600";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="p-3 space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">VCG Admin</h1>
          <p className="text-sm text-gray-600 mt-2">Monitor and manage your organisations and their value chain analyses</p>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="organisations" className="w-full">
        <TabsList className="mb-4 w-full bg-card border border-border/40 shadow-lg backdrop-blur-sm p-0.5 h-auto">
          <TabsTrigger value="organisations" className="flex-1 flex items-center justify-center gap-2 py-2">
            <FolderOpen className="w-4 h-4" />
            My Organisations
          </TabsTrigger>
          <TabsTrigger value="repertoire" className="flex-1 flex items-center justify-center gap-2 py-2">
            <Database className="w-4 h-4" />
            Database Repertoire
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organisations">
          {/* My Organisations Section */}
          <Card className="bg-gradient-to-br from-card to-card/90 border border-border/40 shadow-lg backdrop-blur-sm">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 max-w-[600px]">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-muted-foreground border-border/40 bg-gradient-to-r from-background to-background/80 hover:from-muted/20 hover:to-muted/10 transition-all duration-300 shadow-sm"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white shadow-sm border-0">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Organization
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-muted/40 to-muted/60 border-b border-border/30">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-foreground text-sm tracking-tight">
                        Name
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-foreground text-sm tracking-tight">
                        New Requests
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {organizations.map((org, index) => (
                      <tr 
                        key={org.id} 
                        className={`
                          border-b border-border/20 hover:bg-muted/30 transition-all duration-200 cursor-pointer
                          ${index === organizations.length - 1 ? 'border-b-0' : ''}
                        `}
                        onClick={() => {
                          navigate(`/organization/${org.id}`);
                        }}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <FolderOpen className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-foreground text-sm tracking-tight">{org.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2 pr-2">
                            {org.hasPendingRequests && (
                              <div className="flex items-center gap-1">
                                <Bell className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
                                <span className="text-xs text-red-500 font-medium">{org.pendingRequestsCount} new</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="repertoire">
          {/* Database Repertoire Section */}
          <Card className="bg-gradient-to-br from-card to-card/90 border border-border/40 shadow-lg backdrop-blur-sm">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 max-w-[600px]">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-muted-foreground border-border/40 bg-gradient-to-r from-background to-background/80 hover:from-muted/20 hover:to-muted/10 transition-all duration-300 shadow-sm"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search databases
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="border-border/40">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync All
                  </Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white shadow-sm border-0">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Database
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-muted/40 to-muted/60 border-b border-border/30">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-foreground text-sm tracking-tight">
                        Database Name
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-foreground text-sm tracking-tight">
                        Records
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-foreground text-sm tracking-tight">
                        Last Updated
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-foreground text-sm tracking-tight">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {databaseRepertoire.map((db, index) => (
                      <tr 
                        key={db.id} 
                        className={`
                          border-b border-border/20 hover:bg-muted/30 transition-all duration-200 cursor-pointer
                          ${index === databaseRepertoire.length - 1 ? 'border-b-0' : ''}
                        `}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Database className="w-4 h-4 text-muted-foreground" />
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground text-sm tracking-tight">{db.name}</span>
                              <span className="text-xs text-muted-foreground">{db.category}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm text-muted-foreground">{db.records.toLocaleString()}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm text-muted-foreground">{db.lastUpdated}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Badge 
                            variant="outline" 
                            className={db.status === 'syncing' 
                              ? 'bg-blue-100 text-blue-700 border-blue-200' 
                              : 'bg-green-100 text-green-700 border-green-200'
                            }
                          >
                            {db.status === 'syncing' ? 'Syncing...' : 'Active'}
                          </Badge>
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
  );
};

export default AnalysisManagement;