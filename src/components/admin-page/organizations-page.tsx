import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLoaderData, useRouter } from "@tanstack/react-router";
import { ChevronDown, Copy, EllipsisVertical, LayoutGrid, List, Plus, Search, Settings } from "lucide-react";
import { useState } from "react";
import { Toaster, toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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

export function OrganizationsPage() {
  const organizations = useLoaderData({ from: "/(app)/dashboard/admin/organizations" });
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

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

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Organization ID copied to clipboard");
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
  };

  return (
    <div className="w-full">
      <Toaster position="top-center" expand={true} richColors />

      <div className="flex-1 space-y-8 p-8 pt-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

        {/* Metrics Bar */}

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

          {view === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrgs.map((org) => (
                <Card
                  key={org.id}
                  className="relative border-foreground/10 shadow-none group/card overflow-hidden transition-all hover:bg-muted/5 rounded-[5px]"
                >
                  <div className="absolute top-4 right-4 z-20">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <button
                            type="button"
                            className="text-gray-300 hover:text-gray-600 p-1.5 rounded-[5px] hover:bg-gray-100 transition-colors opacity-0 group-hover/card:opacity-100"
                          >
                            <EllipsisVertical size={20} />
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

                  <div className="relative z-10 flex flex-col h-full">
                    <CardHeader className="pb-4">
                      <div className="mt-2">
                        <h3 className="text-[13px] font-bold uppercase tracking-widest leading-tight truncate group-hover/card:text-[#1549e6] transition-colors">
                          {org.name}
                        </h3>

                        <CardDescription className="text-xs text-muted-foreground mt-1">{org.id}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardFooter className="py-2 mt-auto flex justify-between bg-muted/20 border-t border-foreground/5">
                      <span className="flex items-center gap-1.5 font-medium text-foreground/60 text-xs">
                        <LayoutGrid className="h-3 w-3" /># Projects
                      </span>
                    </CardFooter>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-[5px] shadow-sm overflow-hidden">
              {/* Header Row */}
              <div className="grid grid-cols-12 items-center px-6 py-3 bg-gray-50/50 border-b border-gray-100">
                <div className="col-span-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  Organization <ChevronDown size={10} className="text-gray-300" />
                </div>
                <div className="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                  Status
                </div>
                <div className="col-span-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                  Slug
                </div>
                <div className="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center flex items-center justify-center gap-1">
                  Created <ChevronDown size={10} className="rotate-180 text-gray-300" />
                </div>
                <div className="col-span-1"></div>
              </div>

              <div className="divide-y divide-gray-100">
                {filteredOrgs.map((org) => (
                  <div
                    key={org.id}
                    className="grid grid-cols-12 items-center px-6 py-5 hover:bg-gray-50/50 transition-all cursor-pointer group"
                  >
                    <div className="col-span-4 flex flex-col">
                      <h3 className="text-[13px] font-bold uppercase tracking-widest text-foreground group-hover:text-[#1549e6] transition-colors">
                        {org.name}
                      </h3>

                      <span className="text-[10px] text-gray-400 font-medium mt-0.5 truncate">{org.id}</span>
                    </div>

                    <div className="col-span-2 flex justify-center">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-gray-50 border border-gray-100 text-gray-500 shadow-sm">
                        {org.status}
                      </span>
                    </div>

                    <div className="col-span-3 text-center text-xs text-gray-500 font-medium truncate px-4">
                      {org.slug}
                    </div>

                    <div className="col-span-2 text-center text-[11px] text-gray-500 font-medium">
                      {formatDate(org.createdAt)}
                    </div>

                    <div className="col-span-1 flex justify-end relative">
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
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
