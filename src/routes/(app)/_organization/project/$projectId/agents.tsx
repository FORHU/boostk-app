import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, UserPlus } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/(app)/_organization/project/$projectId/agents")({
  component: AgentsComponent,
});

const inviteSchema = z.object({
  email: z.email("Please enter a valid email address"),
  role: z.enum(["AGENT", "ADMIN"]),
});

function AgentsComponent() {
  const { project } = Route.useRouteContext();

  const form = useForm({
    defaultValues: {
      email: "",
      role: "AGENT" as "AGENT" | "ADMIN",
    },
    validators: {
      onChange: inviteSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      // Simulate API call to invite user
      console.log("Inviting user:", value);
      await new Promise((resolve) => setTimeout(resolve, 500));
      formApi.reset();
      alert(`Invited ${value.email} as ${value.role}!`);
    },
  });

  const inviteLink = `https://boostk.com/invite/${project.id}-xyz123`;

  return (
    <div className="space-y-8">
      {/* Invite Link Section */}
      <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Invite Agents</h2>
        <p className="text-sm text-gray-500 mb-6">
          Share this private secure link to invite agents to join this project.
        </p>

        <div className="flex items-center gap-3">
          <div className="flex-1 max-w-md relative">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 pr-10"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Copy size={16} />
            </button>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserPlus size={16} className="text-gray-500" />
            Send Email Invite
          </h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="flex items-start gap-4"
          >
            <div className="flex-1 max-w-sm">
              <form.Field name="email">
                {(field) => (
                  <div>
                    <input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Email address"
                      className={`w-full p-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${
                        field.state.meta.errors.length ? "border-red-500" : "border-gray-200"
                      }`}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <em className="text-red-500 text-xs mt-1 block">{field.state.meta.errors.join(", ")}</em>
                    )}
                  </div>
                )}
              </form.Field>
            </div>

            <div className="w-32">
              <form.Field name="role">
                {(field) => (
                  <select
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value as "AGENT" | "ADMIN")}
                    className="w-full p-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow bg-white"
                  >
                    <option value="AGENT">Agent</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                )}
              </form.Field>
            </div>

            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="px-4 py-2.5 bg-[#10b981] hover:bg-[#059669] text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
                >
                  {isSubmitting ? "Sending..." : "Send Invite"}
                </button>
              )}
            </form.Subscribe>
          </form>
        </div>
      </div>

      {/* Agents List */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Team Members</h2>
          <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">3 Users</span>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Dummy User 1 */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                    JK
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">James Kim</div>
                    <div className="text-sm text-gray-500">james@boostk.com</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900">OWNER</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Active
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button type="button" className="text-gray-400 hover:text-gray-600">
                  Edit
                </button>
              </td>
            </tr>
            {/* Dummy User 2 */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="shrink-0 h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">
                    SA
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">Sarah Adams</div>
                    <div className="text-sm text-gray-500">sarah@example.com</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900">ADMIN</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Active
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button type="button" className="text-gray-400 hover:text-gray-600">
                  Edit
                </button>
              </td>
            </tr>
            {/* Dummy User 3 */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs">
                    MJ
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">Mike Johnson</div>
                    <div className="text-sm text-gray-500">mike@example.com</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900">AGENT</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  Invited
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button type="button" className="text-red-500 hover:text-red-700">
                  Revoke
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
