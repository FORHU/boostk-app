import { useForm } from "@tanstack/react-form";
import { elysiaClient } from "@/lib/elysia-client";
import { CreateOrganizationSchema } from "@/modules/organization/organization.schema";

export function CreateOrganizationForm() {
  const form = useForm({
    defaultValues: {
      name: "",
    },
    validators: {
      onChange: CreateOrganizationSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const { data, error } = await elysiaClient.api.organizations.post(value);

      if (error) {
        // 1. Handle Validation Error (422)
        if (error.status === 422) {
          const errBody = error.value;

          // If Elysia gives us a specific property that failed
          if (errBody.property) {
            formApi.setFieldMeta(errBody.property as any, (prev) => ({
              ...prev,
              errorMap: {
                ...prev.errorMap,
                onSubmit: errBody.message,
              },
            }));
          }

          // Fallback: If there's a general message but no property
          else if (errBody.message) {
            alert(`Validation Error: ${errBody.message}`);
          }
        }
        // 2. Handle other server errors (500, etc.)
        else {
          console.error("Server Error:", error.value);
          alert("Something went wrong on the server.");
        }
        return;
      }

      // 3. Success!
      console.log("Success:", data);
      formApi.reset(); // Clear the form after success
      alert(`Organization "${data.name}" created successfully!`);
    },
  });

  return (
    <div className="p-4 border rounded-lg max-w-md">
      <h2 className="text-xl font-bold mb-4">Create Organization</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        {/* Fixed field children */}
        <form.Field name="name">
          {(field) => (
            <div className="mb-4">
              <label htmlFor={field.name} className="block mb-1 font-medium text-gray-700">
                Organization Name
              </label>
              <input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className={`w-full p-2 border rounded ${
                  field.state.meta.errors.length ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g. Acme Corp"
              />

              {/* FIX: Map the error objects to their message strings */}
              {field.state.meta.errors.length > 0 ? (
                <em className="text-red-500 text-sm mt-1 block">
                  {field.state.meta.errors
                    .map((error: any) => (typeof error === "object" ? error.message : error))
                    .join(", ")}
                </em>
              ) : null}
            </div>
          )}
        </form.Field>

        {/* Fixed subscribe children */}
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <button
              type="submit"
              disabled={!canSubmit}
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
            >
              {isSubmitting ? "Creating..." : "Create Org"}
            </button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
