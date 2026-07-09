import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InviteModal } from "@/components/ui/invite-modals";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
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
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm">Manage and monitor projects for this organization.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            Invite Members
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-6">
        <ProjectForm organizationId={organizationId} />

        <Suspense fallback={<OrgProjectsSkeleton />}>
          <OrgProjects organizationId={organizationId} searchQuery={searchQuery} />
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
      toast("Failed to create project. Please try again.", "error");
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
      console.log(value);
      await createProjectMutation.mutateAsync({ data: value });
    },
  });

  return (
    <form
      className="space-y-6"
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
                  className="rounded"
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
        className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold text-lg group rounded"
      >
        {createProjectMutation.isPending ? "Creating..." : "Create Project"}
        <Plus className="ml-2 size-5 group-hover:translate-x-1 transition-transform" />
      </Button>
    </form>
  );
};

const OrgProjectsSkeleton = () => {
  return (
    <div className="lg:col-span-4 space-y-4">
      <h2>Projects</h2>

      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: <index is used as a fallback key for skeleton items>
          <div key={index}>
            {/* 2. Using your Skeleton component to draw a pulsing gray bar */}
            <Skeleton className="h-5 w-[200px]" />
          </div>
        ))}
      </div>
    </div>
  );
};

const OrgProjects = ({ organizationId, searchQuery }: { organizationId: string; searchQuery: string }) => {
  // ⏳ 3. Wrapped the Suspense query with the delay helper
  const { data: projects } = useSuspenseQuery(projectQueries.allByOrgId(organizationId));

  const filteredProjects = projects.filter((project) => project.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="lg:col-span-4 space-y-4">
      <h2 className="font-bold">Projects</h2>

      <div>
        {filteredProjects.length === 0 ? (
          <div className="text-center">
            <p className="text-muted-foreground">No projects match "{searchQuery}"</p>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <Link to="/dashboard/project/$projectId" params={{ projectId: project.id }} key={project.id}>
              <h3>{project.name}</h3>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};
