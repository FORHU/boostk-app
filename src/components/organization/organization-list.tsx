import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Copy, LayoutGrid, MoreVertical, Search, Settings } from "lucide-react";
import { Suspense, useState } from "react";

import type { GetAuthOrganization } from "@/modules/organization/organization.functions";
import { organizationQueries } from "@/modules/organization/organization.queries";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const OrganizationList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-xl font-semibold text-foreground">Your Workspaces</h3>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workspaces..."
            className="pl-9 h-10 border-foreground/10 focus-visible:ring-primary/20 bg-background/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Suspense fallback={<OrganizationsSkeleton />}>
        <OrganizationListContent searchQuery={searchQuery} />
      </Suspense>
    </div>
  );
};

const OrganizationListContent = ({ searchQuery }: { searchQuery: string }) => {
  const { data: authOrganization } = useSuspenseQuery(organizationQueries.getAuthOrganization());

  const filtered = searchQuery
    ? authOrganization.filter((org) => org.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : authOrganization;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filtered.map((org) => (
        <OrganizationCard key={org.id} organization={org} />
      ))}
    </div>
  );
};

export default OrganizationList;

const OrganizationCard = ({ organization }: { organization: GetAuthOrganization }) => {
  const navigate = useNavigate();
  return (
    <Link to="/dashboard/org/$organizationId" params={{ organizationId: organization.id }}>
      <Card className="border-foreground/10 shadow-none group transition-all">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between w-full">
            <Avatar className="h-12 w-12 rounded-none shrink-0">
              <AvatarImage className="rounded-none" src={organization.logo || "/avatars/laugh-orange-cat.gif"} />
              <AvatarFallback className="rounded-none text-sm font-medium">
                {organization.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigator.clipboard.writeText(organization.id);
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Organization ID
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate({
                      to: "/dashboard/org/$organizationId/settings",
                      params: { organizationId: organization.id },
                    });
                  }}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="mt-4">
            <CardTitle className="text-xl font-semibold leading-tight truncate">{organization.name}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Members
              <OrganizationMembers organization={organization} />
            </CardDescription>
          </div>
        </CardHeader>
        <CardFooter className="py-2 flex justify-between bg-muted/20">
          <span className="flex items-center gap-1.5 font-medium text-foreground/60">
            <LayoutGrid className="h-3 w-3" />
            {organization._count.projects} Projects
          </span>

          <span className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium">
            Open organization <ArrowRight className="h-3 w-3" />
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
};

export const OrganizationsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: <index is safe to use here>
        <Card key={index} className="border-foreground/10 shadow-none">
          <CardHeader className="pb-4">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </CardHeader>
          <CardFooter className="py-2 flex justify-between bg-muted/20">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

const OrganizationMembers = ({ organization }: { organization: GetAuthOrganization }) => {
  const members = organization.members;
  const totalCount = organization._count.members;

  const displayedMembers = members.slice(0, 3);
  const remainingCount = totalCount - 3;

  return (
    <div className="flex items-center -space-x-2">
      {displayedMembers.map((member) => (
        <Tooltip key={member.id}>
          <TooltipTrigger>
            <Avatar className="h-6 w-6 border-2 border-background ring-offset-background transition-transform hover:z-10 hover:scale-110">
              <AvatarImage src={member.user.image || "/avatars/laugh-orange-cat.gif"} />
              <AvatarFallback className="text-[10px] bg-muted">
                {member.user.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[10px] px-2 py-1">
            {member.user.name}
          </TooltipContent>
        </Tooltip>
      ))}

      {totalCount > 3 && (
        <Tooltip>
          <TooltipTrigger>
            <Link
              to="/dashboard/organizations"
              className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium transition-all hover:bg-accent hover:z-10 hover:scale-110 cursor-pointer"
            >
              +{remainingCount}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[10px] px-2 py-1">
            View all members
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};
