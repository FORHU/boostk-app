import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getFieldInvalid } from "@/lib/form-utils";
import { createProjectFn } from "@/modules/project/project.functions";
import { projectQueries } from "@/modules/project/project.queries";
import { type CreateProjectInput, createProjectSchema } from "@/modules/project/project.schema";

interface Props {
  organizationId: string;
}

export function ProjectCreateForm({ organizationId }: Props) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationKey: ["create", "project"],
    mutationFn: createProjectFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectQueries.all });
    },
    onError: (error) => console.error(error),
  });

  const form = useForm({
    defaultValues: { name: "", organizationId, logo: "" } as CreateProjectInput,
    validators: { onBlur: createProjectSchema, onSubmit: createProjectSchema },
    onSubmit: async ({ value }) => {
      await createMutation.mutateAsync({ data: value });
    },
  });

  return (
    <form
      className="space-y-6 pt-2"
      onSubmit={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await form.handleSubmit();
      }}
    >
      <form.Field name="name">
        {(field) => {
          const isInvalid = getFieldInvalid(field, form);
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
                placeholder="e.g. Acme Support Hub"
                className="rounded-lg h-11"
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      </form.Field>

      <form.Field name="logo">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Logo URL (Optional)</FieldLabel>
            <Input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="rounded-lg h-11"
            />
          </Field>
        )}
      </form.Field>

      <Button
        type="submit"
        disabled={createMutation.isPending}
        className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg"
      >
        {createMutation.isPending ? "Creating..." : "Create Project"}
      </Button>
    </form>
  );
}
