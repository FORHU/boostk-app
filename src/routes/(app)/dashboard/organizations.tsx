import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  Copy,
  Globe,
  LayoutGrid,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Settings,
  Users2,
} from "lucide-react";
import { Suspense, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { getFieldInvalid } from "@/lib/form-utils";
import { createOrganizationFn } from "@/modules/organization/organization.functions";
import { organizationQueries } from "@/modules/organization/organization.queries";
import { type CreateOrganizationInput, createOrganizationSchema } from "@/modules/organization/organization.schema";

type OrganizationOmit = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  logo?: string | null;
  // biome-ignore lint/suspicious/noExplicitAny: <metadata is a jsonb field>
  metadata?: any;
};

export const Route = createFileRoute("/(app)/dashboard/organizations")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(organizationQueries.getAuthOrganization());
  },
  component: OrganizationsPage,
});

function OrganizationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { data: organizations } = useSuspenseQuery(organizationQueries.getAuthOrganization());

  const filteredOrgs = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="w-full">
      <div className="flex-1 space-y-8 p-8 pt-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Organizations</h2>
            <p className="text-muted-foreground">Manage your organizations or switch between workspaces.</p>
          </div>
          <div className="flex items-center gap-3">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger
                render={
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                    <Plus className="mr-2 h-4 w-4" /> New Organization
                  </Button>
                }
              />
              <SheetContent side="right" className="sm:max-w-md flex flex-col gap-0 overflow-y-auto">
                <SheetHeader className="mb-6 text-left">
                  <SheetTitle className="text-xl">Create Organization</SheetTitle>
                  <SheetDescription className="text-sm mt-1.5">
                    Set up a new organization to start managing teams and projects.
                  </SheetDescription>
                </SheetHeader>
                <div className="p-4 h-full flex flex-col">
                  <OrganizationFormBase onSuccess={() => setIsSheetOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-foreground/10 bg-card/50 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organizations</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground opacity-70" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{organizations.length}</div>
              <p className="text-xs text-muted-foreground">Active workspaces</p>
            </CardContent>
          </Card>
          <Card className="border-foreground/10 bg-card/50 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <LayoutGrid className="h-4 w-4 text-muted-foreground opacity-70" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">12</div>
              <p className="text-xs text-muted-foreground">Across all entities</p>
            </CardContent>
          </Card>
          <Card className="border-foreground/10 bg-card/50 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Members</CardTitle>
              <Users2 className="h-4 w-4 text-muted-foreground opacity-70" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">48</div>
              <p className="text-xs text-green-600 font-medium flex items-center gap-1">+4 this month</p>
            </CardContent>
          </Card>
        </div>

        <Separator className="bg-foreground/5" />

        {/* List Section */}
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

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Suspense fallback={<OrganizationsSkeleton />}>
              <OrganizationsListItems filteredOrgs={filteredOrgs} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrganizationsListItems({ filteredOrgs }: { filteredOrgs: OrganizationOmit[] }) {
  if (filteredOrgs.length === 0) {
    return (
      <div className="col-span-full h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl border-muted text-muted-foreground bg-muted/10">
        <Building2 className="h-12 w-12 mb-3 opacity-20" />
        <p className="text-sm font-medium">No organizations found matching your search.</p>
        <p className="text-xs opacity-60 mt-1">Try a different name or create a new one.</p>
      </div>
    );
  }

  return (
    <>
      {filteredOrgs.map((org) => (
        <OrganizationCard key={org.id} org={org} />
      ))}
    </>
  );
}

function OrganizationCard({ org }: { org: OrganizationOmit }) {
  const navigate = useNavigate();
  return (
    <Link to="/dashboard/org/$organizationId" params={{ organizationId: org.id }}>
      <Card className="group transition-all hover:shadow-md hover:border-primary/50 cursor-pointer overflow-hidden border-foreground/10 bg-card/30 backdrop-blur-xs">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Avatar className="h-11 w-11 rounded-xl shadow-xs">
              <AvatarImage src={org.logo || "/avatars/laugh-orange-cat.gif"} />
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold">
                {org.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
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
                    navigator.clipboard.writeText(org.id);
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Organization ID
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate({ to: "/dashboard/org/$organizationId/settings", params: { organizationId: org.id } });
                  }}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="mt-4">
            <CardTitle className="text-lg group-hover:text-primary transition-colors text-foreground">
              {org.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-1.5 mt-1">
              <Globe className="h-3 w-3" />/{org.slug}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="flex -space-x-2 *:ring-2 *:ring-background overflow-hidden font-sans">
            {[1, 2, 3].map((i) => (
              <Avatar key={i} className="h-6 w-6">
                <AvatarFallback className="text-[8px] bg-muted">U{i}</AvatarFallback>
              </Avatar>
            ))}
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[8px] font-medium ring-2 ring-background">
              +2
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2 flex justify-between items-center text-xs text-muted-foreground border-t border-foreground/5 bg-muted/20">
          <span className="flex items-center gap-1.5 font-medium text-foreground/60">
            <LayoutGrid className="h-3 w-3" />4 Projects
          </span>
          <span className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium">
            Open workspace <ArrowRight className="h-3 w-3" />
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
// TODO: move the logic of close modal to not affect the rendering of other page content
const OrganizationFormBase = ({ onSuccess }: { onSuccess: () => void }) => {
  const queryClient = useQueryClient();

  const createOrganizationMutation = useMutation({
    mutationKey: ["create", "organization"],
    mutationFn: createOrganizationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationQueries.all });
      createOrganizationForm.reset();
      onSuccess();
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const createOrganizationForm = useForm({
    defaultValues: {
      name: "",
      logo: "",
    } as CreateOrganizationInput,
    validators: {
      onChange: createOrganizationSchema,
      onSubmit: createOrganizationSchema,
    },
    onSubmit: async ({ value }) => {
      await createOrganizationMutation.mutateAsync({ data: value });
    },
  });

  return (
    <form
      className="space-y-5 flex flex-col flex-1"
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
            <Field data-invalid={isInvalid} className="space-y-1.5">
              <FieldLabel htmlFor={field.name} className="text-sm font-medium">
                Organization Name
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="e.g. Acme Corp"
                className="rounded-lg h-11 bg-white dark:bg-slate-950 transition-colors focus-visible:ring-primary/50"
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} className="text-xs text-destructive mt-1" />}
            </Field>
          );
        }}
      </createOrganizationForm.Field>

      <createOrganizationForm.Field name="logo">
        {(field) => (
          <Field className="space-y-1.5">
            <FieldLabel htmlFor={field.name} className="text-sm font-medium">
              Logo URL <span className="text-muted-foreground font-normal">(Optional)</span>
            </FieldLabel>
            <Input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="rounded-lg h-11 bg-white dark:bg-slate-950 transition-colors focus-visible:ring-primary/50"
            />
            <p className="text-[13px] text-muted-foreground mt-1.5">
              Provide a direct link to an image (PNG, JPG, or SVG).
            </p>
          </Field>
        )}
      </createOrganizationForm.Field>

      <div className="pt-4 mt-auto">
        <Button
          type="submit"
          disabled={createOrganizationMutation.isPending}
          className="w-full h-11 font-medium rounded-lg shadow-sm transition-all active:scale-[0.98]"
        >
          {createOrganizationMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Organization"
          )}
        </Button>
      </div>
    </form>
  );
};

const OrganizationsSkeleton = () => {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: <placeholder>
        <Card key={index} className="border-foreground/10 shadow-none">
          <CardHeader className="pb-4">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </CardHeader>
          <CardFooter className="pt-2 flex justify-between bg-muted/20">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </CardFooter>
        </Card>
      ))}
    </>
  );
};
