import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLoaderData, useRouter } from "@tanstack/react-router";
import {
  Box,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  EllipsisVertical,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getFieldInvalid } from "@/lib/form-utils";
import { createOrganizationFn } from "@/modules/organization/organization.functions";

type TabType = "all" | "admin" | "member" | "agent";

// Mock data generator for organization details
const getMockDetails = (_orgId: string) => ({
  members: [
    { id: "1", name: "Alice Admin", email: "alice@org.com", role: "Admin" },
    { id: "2", name: "Bob Builder", email: "bob@org.com", role: "Member" },
    { id: "3", name: "Charlie Support", email: "charlie@org.com", role: "Agent" },
    { id: "4", name: "David Developer", email: "david@org.com", role: "Member" },
  ],
  projects: [
    { id: "p1", name: "Alpha", tickets: 24 },
    { id: "p2", name: "Beta", tickets: 12 },
    { id: "p3", name: "Charlie", tickets: 8 },
    { id: "p4", name: "Delta", tickets: 5 },
  ],
});

export function OrganizationsPage() {
  const organizations = useLoaderData({ from: "/(app)/dashboard/admin/organizations/" });
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [expandedOrgIds, setExpandedOrgIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const createOrganizationMutation = useMutation({
    mutationFn: createOrganizationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      router.invalidate();
      toast.success("Organization created successfully");
    },
    onError: () => toast.error("Failed to create organization"),
  });

  const createOrganizationForm = useForm({
    defaultValues: { name: "" },
    onSubmit: async ({ value }) => {
      await createOrganizationMutation.mutateAsync({ data: value });
    },
  });

  const filteredOrgs = (organizations || [])
    .filter((org) => org.name.toLowerCase().includes(search.toLowerCase()))
    .filter((_org) => {
      if (activeTab === "all") return true;
      return false;
    });

  // Reset to first page when search or tab changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: search and activeTab are intentional triggers to reset pagination
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeTab]);

  const totalPages = Math.ceil(filteredOrgs.length / pageSize);
  const paginatedOrgs = filteredOrgs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast("Organization ID copied to clipboard");
  };

  const toggleExpand = (id: string) => {
    setExpandedOrgIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
  };

  return (
    <div className="w-full h-[calc(100vh-64px)] overflow-hidden flex flex-col">

      <div className="flex-1 space-y-8 p-8 pt-6 max-w-7xl mx-auto w-full flex flex-col min-h-0">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Organizations</h2>
            <p className="text-muted-foreground">
              Manage all organizations and workspaces from the administrative panel.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger
                render={
                  <button
                    type="button"
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#1549e6] text-white rounded-[5px] shadow-sm transition-all hover:bg-[#2563eb] active:scale-95 whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4" />
                    Add Organization
                  </button>
                }
              />

              <SheetContent side="right" className="sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Create Organization</SheetTitle>
                  <SheetDescription>Set up a new organization to start managing teams and projects.</SheetDescription>
                </SheetHeader>
                <div className="p-4 h-full flex flex-col">
                  <form
                    className="space-y-6 pt-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      await createOrganizationForm.handleSubmit();
                    }}
                  >
                    <createOrganizationForm.Field name="name">
                      {(field) => {
                        const isInvalid = getFieldInvalid(field, createOrganizationForm);
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor={field.name}>Organization Name</FieldLabel>
                            <Input
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              aria-invalid={isInvalid}
                              placeholder="e.g. Acme Corp"
                              className="rounded-[5px]"
                            />
                            <FieldError />
                          </Field>
                        );
                      }}
                    </createOrganizationForm.Field>

                    <div className="flex gap-4 pt-4">
                      <Button
                        type="submit"
                        disabled={createOrganizationMutation.isPending}
                        className="flex-1 bg-[#1549e6] text-white rounded-[5px] hover:bg-[#2563eb]"
                      >
                        {createOrganizationMutation.isPending ? "Creating..." : "Create Organization"}
                      </Button>
                    </div>
                  </form>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="space-y-6 flex-1 flex flex-col min-h-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
            {/* Section Tabs */}
            <div className="flex items-center gap-1 p-1 bg-gray-200/50 rounded-[5px] w-fit">
              {[
                { id: "all", label: "All Organizations" },
                { id: "admin", label: "Admin" },
                { id: "member", label: "Member" },
                { id: "agent", label: "Agent" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-[5px] transition-all ${
                    activeTab === tab.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search organizations..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-[#1549e6]/20 transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center bg-gray-100/50 p-0.5 rounded-[5px]">
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  className={`p-2 rounded-[5px] transition-all ${
                    view === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <LayoutGrid className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className={`p-2 rounded-[5px] transition-all ${
                    view === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
            {view === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start pb-4">
                {paginatedOrgs.map((org) => {
                  const isExpanded = expandedOrgIds.includes(org.id);
                  const details = getMockDetails(org.id);

                  return (
                    <Card
                      key={org.id}
                      className={`relative border border-gray-300/80 shadow-sm overflow-hidden transition-all duration-300 border-l-4 border-l-gray-200/60 hover:border-l-[#1549e6]/60 hover:bg-gray-100/80 hover:shadow-md rounded-[5px] ${
                        isExpanded
                          ? "md:col-span-2 lg:col-span-3 bg-blue-50/30 border-l-[#1549e6]/50 border-gray-400/30 ring-1 ring-[#1549e6]/10"
                          : "bg-white"
                      }`}
                    >
                      <div className={`relative z-10 flex flex-col h-full ${isExpanded ? "flex-row flex-wrap" : ""}`}>
                        <div className={isExpanded ? "w-full lg:w-1/3" : "w-full"}>
                          <CardHeader className="pb-4">
                            <div className="flex items-start justify-between gap-4 mt-2">
                              <div className="min-w-0 flex-1">
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(org.id)}
                                  className="text-[13px] font-bold uppercase tracking-widest leading-tight truncate cursor-pointer hover:text-[#1549e6] transition-colors text-left w-full"
                                >
                                  {org.name}
                                </button>
                                <CardDescription className="text-xs text-muted-foreground mt-1 truncate">
                                  ID: {org.id}
                                </CardDescription>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    render={
                                      <button
                                        type="button"
                                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-[5px] hover:bg-gray-100 transition-colors"
                                      >
                                        <EllipsisVertical size={18} />
                                      </button>
                                    }
                                  />
                                  <DropdownMenuContent align="end" className="w-40 rounded-[5px]">
                                    <DropdownMenuItem className="rounded-[5px]" onClick={() => handleCopyId(org.id)}>
                                      <Copy size={14} className="mr-2" />
                                      Copy ID
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="rounded-[5px]">
                                      <Settings size={14} className="mr-2" />
                                      Settings
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            {isExpanded && (
                              <div className="mt-4 space-y-2 text-xs">
                                <p className="text-gray-500">
                                  <span className="font-bold text-gray-700 uppercase tracking-tighter mr-2">
                                    Created:
                                  </span>
                                  {formatDate(org.createdAt)}
                                </p>
                                <p className="text-gray-500">
                                  <span className="font-bold text-gray-700 uppercase tracking-tighter mr-2">
                                    Status:
                                  </span>
                                  <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold">
                                    {org.status}
                                  </span>
                                </p>
                              </div>
                            )}
                          </CardHeader>
                          <CardFooter className="py-2 mt-auto flex justify-between bg-muted/20 border-t border-foreground/5 gap-4">
                            <span className="flex items-center gap-1.5 font-medium text-foreground/60 text-[10px] uppercase tracking-wider">
                              <Users className="h-3 w-3" />
                              {details.members.length} Members
                            </span>
                            <span className="flex items-center gap-1.5 font-medium text-foreground/60 text-[10px] uppercase tracking-wider">
                              <LayoutGrid className="h-3 w-3" />
                              {details.projects.length} Projects
                            </span>
                          </CardFooter>
                        </div>

                        {isExpanded && (
                          <div className="relative w-full lg:w-2/3 p-6 border-l border-gray-100 bg-gray-50/30 animate-in fade-in slide-in-from-right-2 duration-300">
                            <button
                              type="button"
                              onClick={() => toggleExpand(org.id)}
                              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-all z-30"
                            >
                              <X size={16} />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {/* Members Section */}
                              <div className="space-y-4">
                                <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                  <Users size={14} /> Organization Members
                                </h4>
                                <div className="space-y-3">
                                  {/* (add this comment that displays 3 details) */}
                                  {details.members.slice(0, 3).map((member) => (
                                    <div
                                      key={member.id}
                                      className="flex items-center justify-between p-3 bg-white border border-gray-300/80 rounded-[5px] text-xs shadow-sm"
                                    >
                                      <div>
                                        <p className="font-bold text-gray-900">{member.name}</p>
                                        <p className="text-gray-500 scale-90 origin-left">{member.email}</p>
                                      </div>
                                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-full scale-90">
                                        {member.role}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Projects Section */}
                              <div className="space-y-4">
                                <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                  <Box size={14} /> Active Projects
                                </h4>
                                <div className="space-y-3">
                                  {/* (add this comment that displays 3 details) */}
                                  {details.projects.slice(0, 3).map((project) => (
                                    <div
                                      key={project.id}
                                      className="flex items-center justify-between p-2.5 bg-white border border-gray-300/80 rounded-[5px] text-xs shadow-sm"
                                    >
                                      <span className="font-bold text-gray-700">{project.name}</span>
                                      <span className="flex items-center gap-1 text-[#1549e6] font-bold">
                                        <Ticket size={12} /> {project.tickets} tickets
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-8 pt-6 border-t border-gray-100">
                              <Button
                                className="w-full bg-[#1549e6] text-white hover:bg-[#2563eb] text-xs font-bold h-8 rounded-[5px]"
                                onClick={() =>
                                  router.navigate({ to: `/dashboard/admin/organizations/${org.id}` })
                                }
                              >
                                View More Details
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-[5px] shadow-sm overflow-hidden mb-4">
                {/* Header Row */}
                <div className="grid grid-cols-12 items-center px-6 py-3 bg-gray-50/50 border-b border-gray-100 sticky top-0 z-20">
                  <div className="col-span-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    Organization
                  </div>
                  <div className="col-span-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                    Members
                  </div>
                  <div className="col-span-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                    Projects
                  </div>
                  <div className="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                    Status
                  </div>
                  <div className="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center flex items-center justify-center gap-1">
                    Created <ChevronDown size={10} className="rotate-180 text-gray-300" />
                  </div>
                  <div className="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                    Actions
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {paginatedOrgs.map((org) => {
                    const isExpanded = expandedOrgIds.includes(org.id);
                    const details = getMockDetails(org.id);

                    return (
                      <div
                        key={org.id}
                        className={`relative border border-gray-300/80 shadow-sm overflow-hidden transition-all duration-300 border-l-4 border-l-gray-200/60 hover:border-l-[#1549e6]/60 hover:bg-gray-100/80 hover:shadow-md rounded-[5px] ${
                          isExpanded
                            ? "bg-blue-50/30 border-l-[#1549e6]/50 border-gray-400/30 ring-1 ring-[#1549e6]/10"
                            : "bg-white"
                        }`}
                      >
                        <div className="grid grid-cols-12 items-center px-6 py-5 transition-all group">
                          <div className="col-span-4 flex items-center gap-4">
                            <div className="flex flex-col">
                              <button
                                type="button"
                                onClick={() => toggleExpand(org.id)}
                                className="text-[13px] font-bold uppercase tracking-widest text-foreground cursor-pointer hover:text-[#1549e6] transition-colors text-left"
                              >
                                {org.name}
                              </button>
                              <span className="text-[10px] text-gray-400 font-medium mt-0.5 truncate">{org.id}</span>
                            </div>
                          </div>

                          <div className="col-span-1 text-center text-[11px] font-bold text-gray-500">
                            {details.members.length}
                          </div>

                          <div className="col-span-1 text-center text-[11px] font-bold text-gray-500">
                            {details.projects.length}
                          </div>

                          <div className="col-span-2 flex justify-center">
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-gray-50 border border-gray-100 text-gray-500 shadow-sm">
                              {org.status}
                            </span>
                          </div>

                          <div className="col-span-2 text-center text-[11px] text-gray-500 font-medium">
                            {formatDate(org.createdAt)}
                          </div>

                          <div className="col-span-2 flex justify-end relative">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <button
                                    type="button"
                                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-[5px] hover:bg-white border border-transparent hover:border-gray-200 transition-all"
                                  >
                                    <EllipsisVertical size={18} />
                                  </button>
                                }
                              />
                              <DropdownMenuContent align="end" className="w-40 rounded-[5px]">
                                <DropdownMenuItem className="rounded-[5px]" onClick={() => handleCopyId(org.id)}>
                                  <Copy size={14} className="mr-2" />
                                  Copy ID
                                </DropdownMenuItem>
                                <DropdownMenuItem className="rounded-[5px]">
                                  <Settings size={14} className="mr-2" />
                                  Settings
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="relative bg-gray-50/50 border-t border-gray-100 p-8 animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => toggleExpand(org.id)}
                              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-[#A9A9A9] transition-all z-30"
                            >
                              <X size={18} />
                            </button>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-6xl">
                              {/* Summary Detail */}
                              <div className="space-y-4">
                                <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                                  Organization Summary
                                </h4>
                                <div className="space-y-4 text-xs">
                                  <div>
                                    <p className="text-gray-400 font-bold uppercase tracking-tighter scale-90 origin-left">
                                      Full Name
                                    </p>
                                    <p className="text-sm font-bold text-gray-900">{org.name}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-400 font-bold uppercase tracking-tighter scale-90 origin-left">
                                      Identifier
                                    </p>
                                    <p className="font-mono text-gray-600">{org.slug}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-400 font-bold uppercase tracking-tighter scale-90 origin-left">
                                      Creation Date
                                    </p>
                                    <p className="text-gray-700">{formatDate(org.createdAt)}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Members Detail */}
                              <div className="lg:col-span-1 space-y-4 border-l border-gray-200/50 pl-10">
                                <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                  <Users size={14} /> Organization Members
                                </h4>
                                <div className="space-y-3">
                                  {/* (add this comment that displays 3 details) */}
                                  {details.members.slice(0, 3).map((member) => (
                                    <div
                                      key={member.id}
                                      className="flex items-center justify-between p-3 bg-white border border-gray-300/80 rounded-[5px] text-xs shadow-sm"
                                    >
                                      <div>
                                        <p className="font-bold text-gray-900">{member.name}</p>
                                        <p className="text-gray-500 scale-90 origin-left">{member.email}</p>
                                      </div>
                                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-full scale-90">
                                        {member.role}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Projects & Actions Detail */}
                              <div className="lg:col-span-1 space-y-8 border-l border-gray-200/50 pl-10">
                                <div className="space-y-4">
                                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    <Box size={14} /> Active Projects
                                  </h4>
                                  <div className="space-y-3">
                                    {/* (add this comment that displays 3 details) */}
                                    {details.projects.slice(0, 3).map((project) => (
                                      <div
                                        key={project.id}
                                        className="flex items-center justify-between p-2.5 bg-white border border-gray-300/80 rounded-[5px] text-xs shadow-sm"
                                      >
                                        <span className="font-bold text-gray-700">{project.name}</span>
                                        <span className="flex items-center gap-1 text-[#1549e6] font-bold">
                                          <Ticket size={12} /> {project.tickets} tickets
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-100">
                                  <Button
                                    className="w-full bg-[#1549e6] text-white hover:bg-[#2563eb] text-xs font-bold h-8 rounded-[5px]"
                                    onClick={() =>
                                      router.navigate({ to: `/dashboard/admin/organizations/${org.id}` })
                                    }
                                  >
                                    View More Details
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* TODO: Change to Backend Pagination Bar */}
          {totalPages > 1 && (
            <div className="shrink-0 pt-4 border-t border-gray-100 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  if (totalPages > 5) {
                    if (page !== 1 && page !== totalPages && Math.abs(page - currentPage) > 1) {
                      if (Math.abs(page - currentPage) === 2) {
                        return (
                          <span key={page} className="px-2 text-gray-400">
                            <MoreHorizontal size={14} />
                          </span>
                        );
                      }
                      return null;
                    }
                  }

                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[32px] h-8 px-2 text-xs font-bold rounded-[5px] transition-all ${
                        currentPage === page
                          ? "bg-[#1549e6] text-white shadow-sm"
                          : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
