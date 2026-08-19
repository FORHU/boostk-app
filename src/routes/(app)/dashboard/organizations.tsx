import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FolderKanban, ImagePlus, Plus, Search, Upload, Users, X } from "lucide-react";
import { Suspense, useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { EntityAvatar } from "@/components/ui/entity-avatar";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useDebounce } from "@/hooks/use-debounce";
import { getFieldInvalid } from "@/lib/form-utils";
import { cn } from "@/lib/utils";
import { createOrganizationFn } from "@/modules/organization/organization.functions";
import { organizationQueries } from "@/modules/organization/organization.queries";
import { type CreateOrganizationInput, createOrganizationSchema } from "@/modules/organization/organization.schema";

const LOGO_MAX_BYTES = 10 * 1024 * 1024; // 10MB
const LOGO_ACCEPT = "image/png,image/jpeg,image/gif,image/webp";

export const Route = createFileRoute("/(app)/dashboard/organizations")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(organizationQueries.getAuthOrganization());
  },
  component: OrganizationsPage,
});

const ROLE_STYLES: Record<string, string> = {
  owner: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  admin: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  agent:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  member: "bg-muted text-muted-foreground border-border",
};

function OrganizationsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery);

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <PageHeader title="Organizations" description="Manage your organizations and switch between them.">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          Create Organization
          <Plus className="ml-1.5 size-4" />
        </Button>
      </PageHeader>

      <Suspense fallback={<OrgGridSkeleton />}>
        <OrgGrid searchQuery={debouncedSearchQuery} onEmptyAction={() => setIsCreateOpen(true)} />
      </Suspense>

      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Create Organization</SheetTitle>
            <SheetDescription>Add a new organization to your account.</SheetDescription>
          </SheetHeader>
          <CreateOrganizationForm onSuccess={() => setIsCreateOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

const OrgGridSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list, index is a stable key
      <Skeleton key={i} className="h-40 rounded-xl" />
    ))}
  </div>
);

const OrgGrid = ({ searchQuery, onEmptyAction }: { searchQuery: string; onEmptyAction: () => void }) => {
  const { data: organizations } = useSuspenseQuery(organizationQueries.getAuthOrganization());

  const filtered = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (organizations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-primary/10 p-4 rounded-full mb-4">
          <FolderKanban className="text-primary" size={32} />
        </div>
        <h3 className="text-lg font-semibold text-foreground">No organizations yet</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Create your first organization to start managing projects and team members.
        </p>
        <Button className="mt-5" onClick={onEmptyAction}>
          <Plus className="mr-1.5 size-4" />
          Create Organization
        </Button>
      </div>
    );
  }

  if (filtered.length === 0) {
    return <EmptyState title={`No organizations match "${searchQuery}"`} size="sm" />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map((org, index) => (
        <motion.div
          key={org.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3, ease: "easeOut" }}
        >
          <Link
            to="/dashboard/org/$organizationSlug"
            params={{ organizationSlug: org.slug }}
            className="group block rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5"
          >
            <div className="flex items-start gap-4">
              <EntityAvatar
                name={org.name}
                logo={org.logo}
                className="size-12 shrink-0"
                fallbackClassName="bg-primary/10 text-primary text-lg font-bold"
              />
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
                  {org.name}
                </h3>
                <span className="text-xs text-muted-foreground">/{org.slug}</span>
              </div>
            </div>

            {org.role && (
              <div className="mt-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    ROLE_STYLES[org.role] ?? ROLE_STYLES.member,
                  )}
                >
                  {org.role}
                </span>
              </div>
            )}

            <div className="mt-4 flex items-center gap-4 border-t border-border/60 pt-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <FolderKanban className="size-3.5" />
                {org._count.projects} {org._count.projects === 1 ? "project" : "projects"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-3.5" />
                {org._count.members} {org._count.members === 1 ? "member" : "members"}
              </span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
};

const CreateOrganizationForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const createOrganizationMutation = useMutation({
    mutationKey: ["create", "organization"],
    mutationFn: createOrganizationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationQueries.all });
      toast("Organization created successfully!", "success");
      onSuccess();
    },
    onError: (error) => {
      console.error(error);
      toast(error.message || "Failed to create organization. Please try again.", "error");
    },
  });

  const createOrganizationForm = useForm({
    defaultValues: {
      name: "",
      logo: "",
    } as CreateOrganizationInput,
    validators: {
      onBlur: createOrganizationSchema,
      onSubmit: createOrganizationSchema,
    },
    onSubmit: async ({ value }) => {
      await createOrganizationMutation.mutateAsync({ data: value });
    },
  });

  const processFile = useCallback(
    (file: File) => {
      if (file.size > LOGO_MAX_BYTES) {
        toast("Image must be less than 10MB.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        createOrganizationForm.setFieldValue("logo", ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    [createOrganizationForm, toast],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <form
      className="flex flex-col px-4"
      onSubmit={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await createOrganizationForm.handleSubmit();
      }}
    >
      <FieldGroup className="space-y-5">
        <createOrganizationForm.Field name="name">
          {(field) => {
            const isInvalid = getFieldInvalid(field, createOrganizationForm);
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  Organization Name <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Enter your organization name"
                  required
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </createOrganizationForm.Field>
        <createOrganizationForm.Field name="logo">
          {(field) => (
            <Field>
              <FieldLabel>Logo</FieldLabel>
              {field.state.value ? (
                <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-3">
                  <img
                    src={field.state.value}
                    alt="Logo preview"
                    className="size-16 shrink-0 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Organization logo</p>
                    <p className="text-xs text-muted-foreground">Uploaded</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <ImagePlus className="size-4" />
                      <span className="sr-only">Replace logo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => createOrganizationForm.setFieldValue("logo", "")}
                      className="inline-flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <X className="size-4" />
                      <span className="sr-only">Remove logo</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={cn(
                    "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 transition-colors cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isDragOver
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50",
                  )}
                >
                  <Upload className={cn("size-5", isDragOver ? "text-primary" : "text-muted-foreground")} />
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      {isDragOver ? "Drop image here" : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, GIF or WebP. Max 10MB.</p>
                  </div>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={LOGO_ACCEPT}
                onChange={handleFileChange}
              />
            </Field>
          )}
        </createOrganizationForm.Field>
      </FieldGroup>

      <div className="mt-6">
        <Button type="submit" disabled={createOrganizationMutation.isPending} className="w-full h-10">
          {createOrganizationMutation.isPending ? "Creating..." : "Create Organization"}
          <Plus className="ml-1.5 size-4" />
        </Button>
      </div>
    </form>
  );
};
