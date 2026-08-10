import { useState, useEffect } from "react";
import { Plus, FolderOpen, ChevronRight, MoreHorizontal, Search, Calendar, Beaker, Leaf, Package, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProjectTopic {
  id: string;
  name: string;
  category: "feedstock" | "technology" | "product" | "market";
}

interface Project {
  id: string;
  name: string;
  description: string;
  topics: ProjectTopic[];
  createdAt: string;
  updatedAt: string;
  status: "active" | "completed" | "draft";
}

const mockProjects: Project[] = [
  {
    id: "1",
    name: "Sustainable Aviation Fuel Initiative",
    description: "Exploring pathways for SAF production using various feedstocks and technologies",
    topics: [
      { id: "t1", name: "Lignocellulosic Biomass", category: "feedstock" },
      { id: "t2", name: "Fischer-Tropsch Synthesis", category: "technology" },
      { id: "t3", name: "Sustainable Aviation Fuel", category: "product" },
    ],
    createdAt: "2024-11-15",
    updatedAt: "2024-12-18",
    status: "active",
  },
  {
    id: "2",
    name: "Bio-based Polymers Development",
    description: "Research into novel bio-based polymer production methods",
    topics: [
      { id: "t4", name: "Sugar Beet", category: "feedstock" },
      { id: "t5", name: "Fermentation", category: "technology" },
      { id: "t6", name: "PLA Bioplastic", category: "product" },
      { id: "t7", name: "Packaging Industry", category: "market" },
    ],
    createdAt: "2024-10-20",
    updatedAt: "2024-12-15",
    status: "active",
  },
  {
    id: "3",
    name: "Waste Valorization Study",
    description: "Converting agricultural waste into high-value chemicals",
    topics: [
      { id: "t8", name: "Agricultural Residues", category: "feedstock" },
      { id: "t9", name: "Pyrolysis", category: "technology" },
    ],
    createdAt: "2024-12-01",
    updatedAt: "2024-12-10",
    status: "draft",
  },
  {
    id: "4",
    name: "Green Hydrogen Integration",
    description: "Analyzing green hydrogen applications in chemical production",
    topics: [
      { id: "t10", name: "Electrolysis", category: "technology" },
      { id: "t11", name: "Green Ammonia", category: "product" },
      { id: "t12", name: "Fertilizer Industry", category: "market" },
    ],
    createdAt: "2024-09-10",
    updatedAt: "2024-11-28",
    status: "completed",
  },
  {
    id: "5",
    name: "Circular Plastics Economy",
    description: "Developing closed-loop systems for plastic recycling and upcycling",
    topics: [
      { id: "t13", name: "Mixed Plastic Waste", category: "feedstock" },
      { id: "t14", name: "Chemical Recycling", category: "technology" },
      { id: "t15", name: "Recycled Polymers", category: "product" },
    ],
    createdAt: "2024-08-05",
    updatedAt: "2024-12-17",
    status: "active",
  },
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "feedstock":
      return <Leaf className="w-3 h-3" />;
    case "technology":
      return <Beaker className="w-3 h-3" />;
    case "product":
      return <Package className="w-3 h-3" />;
    case "market":
      return <ShoppingCart className="w-3 h-3" />;
    default:
      return null;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case "feedstock":
      return "bg-green-50 text-green-700 border-green-200";
    case "technology":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "product":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "market":
      return "bg-orange-50 text-orange-700 border-orange-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
    case "Active":
      return "bg-green-600 text-white";
    case "completed":
    case "Completed":
      return "bg-blue-600 text-white";
    case "draft":
    case "Draft":
      return "bg-gray-200 text-gray-700";
    default:
      return "bg-gray-200 text-gray-700";
  }
};

const Projects = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dbProjects, setDbProjects] = useState<Project[]>([]);
  const navigate = useNavigate();

  // Fetch projects from database
  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        const formattedProjects: Project[] = data.map((project: any) => {
          // Extract unique topics from pathways
          const pathways = project.pathways || [];
          const uniqueTopics = new Map<string, ProjectTopic>();
          
          pathways.forEach((pathway: any, idx: number) => {
            // Use the topic field from the pathway (e.g., "Xylose", "Succinic Acid")
            const topicName = pathway.topic || project.topic || 'Unknown';
            if (!uniqueTopics.has(topicName)) {
              uniqueTopics.set(topicName, {
                id: `db-${project.id}-${topicName}`,
                name: topicName,
                category: 'product' as const
              });
            }
          });

          // If no pathways but project has a topic, use that
          if (uniqueTopics.size === 0 && project.topic) {
            uniqueTopics.set(project.topic, {
              id: `db-${project.id}-${project.topic}`,
              name: project.topic,
              category: 'product' as const
            });
          }

          return {
            id: project.id,
            name: project.name,
            description: project.goal,
            topics: Array.from(uniqueTopics.values()),
            createdAt: new Date(project.created_at).toISOString().split('T')[0],
            updatedAt: new Date(project.updated_at).toISOString().split('T')[0],
            status: (project.status?.toLowerCase() || 'active') as "active" | "completed" | "draft"
          };
        });
        setDbProjects(formattedProjects);
      }
    };

    fetchProjects();
  }, []);

  // Combine mock projects with database projects
  const allProjects = [...dbProjects, ...mockProjects];

  const filteredProjects = allProjects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.topics.some((topic) =>
        topic.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
        <p className="text-sm text-muted-foreground">
          Organize and manage your value chain analysis topics into projects
        </p>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <Button className="bg-success hover:bg-success/90 h-10">
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((project) => (
          <Card
            key={project.id}
            className="group hover:shadow-md transition-all duration-200 cursor-pointer border-border/50 hover:border-border"
            onClick={() => {
              // Navigate to first topic's landscape if available
              if (project.topics.length > 0) {
                const firstTopic = project.topics[0];
                navigate(`/landscape/${firstTopic.category}/${firstTopic.name.toLowerCase().replace(/\s+/g, '-')}`, {
                  state: { projectName: project.name, projectDescription: project.description }
                });
              }
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium line-clamp-1">
                      {project.name}
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] px-1.5 py-0 h-4 ${getStatusColor(project.status)}`}
                    >
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit Project</DropdownMenuItem>
                    <DropdownMenuItem>Duplicate</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground line-clamp-2">
                {project.description}
              </p>

              {/* Topics */}
              <div className="space-y-2">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Topics ({project.topics.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {project.topics.map((topic) => (
                    <Badge
                      key={topic.id}
                      variant="outline"
                      className={`text-[10px] px-2 py-0.5 h-5 gap-1 ${getCategoryColor(topic.category)}`}
                    >
                      {getCategoryIcon(topic.category)}
                      <span className="truncate max-w-[100px]">{topic.name}</span>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>Updated {project.updatedAt}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-foreground mb-1">No projects found</h3>
          <p className="text-xs text-muted-foreground mb-4">
            {searchQuery
              ? "Try adjusting your search query"
              : "Create your first project to organize your analysis topics"}
          </p>
          {!searchQuery && (
            <Button className="bg-success hover:bg-success/90">
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Projects;
