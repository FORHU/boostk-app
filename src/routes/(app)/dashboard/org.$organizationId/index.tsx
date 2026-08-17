import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search, Ticket, Users } from "lucide-react";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { EntityAvatar } from "@/components/ui/entity-avatar";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InviteModal } from "@/components/ui/invite-modals";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useDebounce } from "@/hooks/use-debounce";
import { getFieldInvalid } from "@/lib/form-utils";
import { createProjectFn } from "@/modules/project/project.functions";
import { projectQueries } from "@/modules/project/project.queries";
import { type CreateProjectInput, createProjectSchema } from "@/modules/project/project.schema";

export const Route = createFileRoute("/(app)/dashboard/org/$organizationId/")({
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(projectQueries.allByOrgId(params.organizationId));
  },
  component: OrganizationPage,
});

function OrganizationPage() {
  const { organizationId } = Route.useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <PageHeader title="Projects" description="Manage and monitor projects for this organization.">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => setIsInviteModalOpen(true)}>
          Invite Members
        </Button>
      </PageHeader>

      <div className="grid gap-8 lg:grid-cols-6">
        <ProjectForm organizationId={organizationId} />

        <Suspense fallback={<OrgProjectsSkeleton />}>
          <OrgProjects organizationId={organizationId} searchQuery={debouncedSearchQuery} />
        </Suspense>
      </div>
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        organizationId={organizationId}
      />
    </div>
  );
}

const ProjectForm = ({ organizationId }: { organizationId: string }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createProjectMutation = useMutation({
    mutationKey: ["create", "project"],
    mutationFn: createProjectFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectQueries.all });
      toast("Project created successfully!", "success");
    },
    onError: (error) => {
      console.error(error);
      toast(error.message || "Failed to create project. Please try again.", "error");
    },
  });

  const createProjectForm = useForm({
    defaultValues: {
      name: "",
      organizationId,
      logo: "",
    } as CreateProjectInput,
    validators: {
      onBlur: createProjectSchema,
      onSubmit: createProjectSchema,
    },
    onSubmit: async ({ value }) => {
      await createProjectMutation.mutateAsync({ data: value });
    },
  });

  return (
    <form
      className="space-y-6 lg:col-span-2"
      onSubmit={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await createProjectForm.handleSubmit();
      }}
    >
      <FieldGroup>
        <createProjectForm.Field name="name">
          {(field) => {
            const isInvalid = getFieldInvalid(field, createProjectForm);
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Project Name</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Enter your project name"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </createProjectForm.Field>
      </FieldGroup>

      <Button
        type="submit"
        disabled={createProjectMutation.isPending}
        className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold group"
      >
        <span className="truncate">{createProjectMutation.isPending ? "Creating..." : "Create Project"}</span>
        <Plus className="ml-1.5 size-4 shrink-0 group-hover:translate-x-1 transition-transform" />
      </Button>
    </form>
  );
};

const OrgProjectsSkeleton = () => {
  return (
    <div className="lg:col-span-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list, index is a stable key
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  );
};

const OrgProjects = ({ organizationId, searchQuery }: { organizationId: string; searchQuery: string }) => {
  const { data: projects } = useSuspenseQuery(projectQueries.allByOrgId(organizationId));

  const filteredProjects = projects.filter((project) => project.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="lg:col-span-4 space-y-4">
      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to start managing support conversations."
          size="sm"
        />
      ) : filteredProjects.length === 0 ? (
        <EmptyState title={`No projects match "${searchQuery}"`} size="sm" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredProjects.map((project) => (
            <Link
              to="/dashboard/project/$projectId"
              params={{ projectId: project.id }}
              key={project.id}
              className="group block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
            >
              <div className="flex items-center gap-3">
                <EntityAvatar
                  name={project.name}
                  logo={project.logo}
                  className="size-10"
                  fallbackClassName="bg-primary/10 text-primary"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium">{project.name}</h3>
                  {project.description && (
                    <p className="truncate text-sm text-muted-foreground">{project.description}</p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Ticket className="size-3.5" />
                  {project._count.tickets} open
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-3.5" />
                  {project._count.customers} {project._count.customers === 1 ? "customer" : "customers"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
