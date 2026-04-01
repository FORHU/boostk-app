import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { authQueries } from "@/modules/auth/auth.queries";
import { getActiveOrganizationFn, listOrganizationsFn } from "@/modules/organizations/organizations.functions";

export const Route = createFileRoute("/(app)/dashboard/organizations")({
  loader: async () => {
    const [organizations, activeOrg] = await Promise.all([listOrganizationsFn(), getActiveOrganizationFn()]);
    return { organizations, activeOrg };
  },
  component: OrganizationsPage,
});

function OrganizationsPage() {
  const { organizations, activeOrg } = Route.useLoaderData();
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const createOrg = async () => {
    if (!orgName || !orgSlug) return;
    setIsCreating(true);
    try {
      await authClient.organization.create({
        name: orgName,
        slug: orgSlug,
      });
      setOrgName("");
      setOrgSlug("");
      router.invalidate();
    } catch (error) {
      console.error("Failed to create organization", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSetActive = async (organizationId: string) => {
    if (organizationId === activeOrg?.id) return;
    setSwitchingId(organizationId);
    try {
      await authClient.organization.setActive({ organizationId });
      await queryClient.invalidateQueries({ queryKey: authQueries.all });
      await router.invalidate();
    } catch (error) {
      console.error("Failed to set active organization", error);
      alert("Failed to switch organization. Did you run 'npx prisma db push'?");
    } finally {
      setSwitchingId(null);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
        <p className="text-muted-foreground text-sm">Manage your organizations and switch between them.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="text-lg font-semibold leading-none tracking-tight">Create Organization</h3>
              <p className="text-sm text-muted-foreground">Add a new organization to your account.</p>
            </div>
            <div className="p-6 pt-0 space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="org-name"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Name
                </label>
                <input
                  id="org-name"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Acme Inc."
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="org-slug"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Slug
                </label>
                <input
                  id="org-slug"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="acme-inc"
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full disabled:bg-gray-500"
                onClick={createOrg}
                disabled={isCreating || !orgName || !orgSlug}
              >
                {isCreating ? "Creating..." : "Create Organization"}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="text-lg font-semibold leading-none tracking-tight">Your Organizations</h3>
              <p className="text-sm text-muted-foreground">List of organizations you are a member of.</p>
            </div>
            <div className="p-6 pt-0">
              <div className="space-y-4">
                {!organizations || organizations.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground text-sm">No organizations found.</p>
                  </div>
                ) : (
                  organizations.map((org) => (
                    <div
                      key={org.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-background hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{org.name}</span>
                          {org.id === activeOrg?.id && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full border border-primary/20 font-medium">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">/{org.slug}</span>
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 py-2"
                        onClick={() => handleSetActive(org.id)}
                        disabled={switchingId === org.id || org.id === activeOrg?.id}
                      >
                        {switchingId === org.id ? "Switching..." : org.id === activeOrg?.id ? "Current" : "Switch"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
