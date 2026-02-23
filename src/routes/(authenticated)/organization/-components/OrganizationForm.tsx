import { useForm } from "@tanstack/react-form";
import { useRouter } from "@tanstack/react-router";
import { elysiaClient } from "@/lib/elysia-client";
import { CreateOrganizationSchema } from "@/modules/organization/organization.schema";

export function CreateOrganizationForm() {
  const router = useRouter();

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
        if (error.status === 422) {
          const errBody = error.value;
          if (errBody.property) {
            formApi.setFieldMeta(errBody.property as any, (prev) => ({
              ...prev,
              errorMap: {
                ...prev.errorMap,
                onSubmit: errBody.message,
              },
            }));
          } else if (errBody.message) {
            alert(`Validation Error: ${errBody.message}`);
          }
        } else {
          console.error("Server Error:", error.value);
          alert("Something went wrong on the server.");
        }
        return;
      }

      formApi.reset();
      router.navigate({ to: `/organization/${data.id}` });
    },
  });

  return (
    <div className="bg-white border text-left border-gray-200 rounded-xl overflow-hidden shadow-sm w-full h-max mt-16 max-w-2xl">
      <div className="pt-6 px-10 pb-5">
        <h1 className="text-[17px] font-medium text-gray-900 mb-1">Create a new organization</h1>
        <p className="text-[13px] text-gray-500 max-w-[420px] leading-relaxed">
          Organizations are a way to group your projects. Each organization can be configured with different team
          members and billing settings.
        </p>
      </div>

      <form
        className="flex flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div className="px-10 pb-6 pt-3 space-y-6">
          {/* Name Field */}
          <form.Field name="name">
            {(field) => (
              <div className="flex">
                <div className="w-[180px] shrink-0 pt-2 text-[13px] font-medium text-gray-700">Name</div>
                <div className="flex-1">
                  <input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className={`block w-full px-3 py-1.5 border rounded-md text-[13px] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow ${
                      field.state.meta.errors.length
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-200"
                    }`}
                    placeholder="Organization name"
                  />
                  <p className="mt-2 text-[12px] text-gray-500 tracking-tight">
                    What's the name of your company or team? You can change this later.
                  </p>
                  {field.state.meta.errors.length > 0 ? (
                    <p className="text-red-500 text-xs mt-1">
                      {field.state.meta.errors
                        .map((error: any) => (typeof error === "object" ? error.message : error))
                        .join(", ")}
                    </p>
                  ) : null}
                </div>
              </div>
            )}
          </form.Field>

          <div className="border-t border-gray-100" />

          {/* Type Field (Mock) */}
          <div className="flex">
            <div className="w-[180px] shrink-0 pt-2 text-[13px] font-medium text-gray-700">Type</div>
            <div className="flex-1">
              <select className="block w-full px-3 py-1.5 border border-gray-200 rounded-md text-[13px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white transition-shadow appearance-none cursor-pointer">
                <option>Personal</option>
                <option>Company</option>
              </select>
              <p className="mt-2 text-[12px] text-gray-500 tracking-tight">What best describes your organization?</p>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Plan Field (Mock) */}
          <div className="flex">
            <div className="w-[180px] shrink-0 pt-2 text-[13px] font-medium text-gray-700">Plan</div>
            <div className="flex-1">
              <select className="block w-full px-3 py-1.5 border border-gray-200 rounded-md text-[13px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white transition-shadow appearance-none cursor-pointer">
                <option>Free - $0/month</option>
                <option>Pro - $20/month</option>
              </select>
              <p className="mt-2 text-[12px] text-gray-500 tracking-tight">
                Which plan fits your organization's needs best?{" "}
                <a href="/pricing" className="underline hover:text-gray-700">
                  Learn more.
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 px-10 border-t border-gray-200 bg-[#fbfbfb] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              router.history.back();
            }}
            className="px-3 py-1 text-[13px] shadow-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>

          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <button
                type="submit"
                disabled={!canSubmit}
                className="px-3 py-1 text-[13px] shadow-sm font-medium text-emerald-950 bg-[#6be3a3] hover:bg-[#5cd493] rounded-md disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "..." : "Create organization"}
              </button>
            )}
          </form.Subscribe>
        </div>
      </form>
    </div>
  );
}
