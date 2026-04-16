import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Copy, LayoutGrid, MessageSquare, MoreVertical, Plus, Search, Settings, Users } from "lucide-react";
import type { Project } from "prisma/generated/client";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { ProjectCreateForm } from "@/components/project/ProjectCreateForm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { projectQueries } from "@/modules/project/project.queries";

export const Route = createFileRoute("/(app)/dashboard/org/$organizationId/")({
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(projectQueries.allByOrgId(params.organizationId));
  },
  component: OrganizationPage,
});

function OrganizationPage() {
  const { organizationId } = Route.useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: projects } = useSuspenseQuery(projectQueries.allByOrgId(organizationId));

  const filteredProjects = projects.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Organization Overview</h2>
          <p className="text-muted-foreground">Manage your projects and monitor real-time support activity.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="hidden md:flex">
            <Users className="mr-2 h-4 w-4" />
            Invite Members
          </Button>
          <Sheet>
            <SheetTrigger
              render={
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" /> New Project
                </Button>
              }
            />
            <SheetContent side="right" className="sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Create New Project</SheetTitle>
                <SheetDescription>
                  Add a new project to your organization to start managing customer support.
                </SheetDescription>
              </SheetHeader>
              <div className="py-6 px-1">
                <ProjectCreateForm organizationId={organizationId} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-xs border-foreground/10 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{projects.length}</div>
            <p className="text-xs text-muted-foreground">Across your organization</p>
          </CardContent>
        </Card>
        <Card className="shadow-xs border-foreground/10 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">24</div>
            <p className="text-xs text-green-600 font-medium">+12% from last week</p>
          </CardContent>
        </Card>
        <Card className="shadow-xs border-foreground/10 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">98.2%</div>
            <p className="text-xs text-muted-foreground">Avg. time &lt; 2 mins</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-foreground">Your Projects</h3>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter projects..."
              className="pl-9 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Suspense fallback={<OrgProjectsSkeleton />}>
            <ProjectsList filteredProjects={filteredProjects} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function ProjectsList({ filteredProjects }: { filteredProjects: Project[] }) {
  if (filteredProjects.length === 0) {
    return (
      <div className="col-span-full h-48 flex flex-col items-center justify-center border-2 border-dashed rounded-xl border-muted text-muted-foreground">
        <LayoutGrid className="h-10 w-10 mb-2 opacity-20" />
        <p>No projects found matching your search.</p>
      </div>
    );
  }

  return (
    <>
      {filteredProjects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate();
  return (
    <Link to="/dashboard/project/$projectId" params={{ projectId: project.id }}>
      <Card className="group transition-all hover:shadow-md hover:border-primary/50 cursor-pointer overflow-hidden border-foreground/10">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Avatar className="h-10 w-10 rounded-lg">
              <AvatarImage src={project.logo || "/avatars/laugh-orange-cat.gif"} />
              <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">
                {project.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  className="text-[11px] py-2 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(project.id);
                    toast.success("Project ID copied to clipboard");
                  }}
                >
                  <Copy className="mr-2 h-3.5 w-3.5" />
                  <span>Copy project ID</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-[11px] py-2 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate({
                      to: "/dashboard/project/$projectId/settings",
                      params: { projectId: project.id },
                    });
                  }}
                >
                  <Settings className="mr-2 h-3.5 w-3.5" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="mt-4">
            <CardTitle className="text-lg group-hover:text-primary transition-colors text-foreground">
              {project.name}
            </CardTitle>
            <CardDescription className="line-clamp-1">Support hub for {project.name}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-0 flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-green-500" />
            Active
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            12 Tickets
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

const OrgProjectsSkeleton = () => {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: <index is the key>
        <Card key={index} className="border-foreground/10 shadow-none">
          <CardHeader className="pb-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 flex justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
          </CardContent>
        </Card>
      ))}
    </>
  );
};
