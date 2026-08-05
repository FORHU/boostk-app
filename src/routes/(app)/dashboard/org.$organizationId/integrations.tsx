import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { REDIRECT_REASON } from "@/enums/enums";
import { hasOrgRole, ORG_ROLE } from "@/modules/auth/roles";
import {
  connectIntegrationFn,
  disconnectIntegrationFn,
  type INTEGRATION_PROVIDERS,
} from "@/modules/integrations/integration-functions";
import { organizationIntegrationQueries } from "@/modules/integrations/integration-queries";

type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];

export const Route = createFileRoute("/(app)/dashboard/org/$organizationId/integrations")({
  beforeLoad: ({ context }) => {
    if (!hasOrgRole(context.role, ORG_ROLE.ADMIN)) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
    }
  },
  component: OrganizationIntegrationsPage,
});

const AVAILABLE_INTEGRATIONS = [
  {
    id: "whatsapp" as IntegrationProvider,
    name: "WhatsApp Business",
    category: "Communication Channels",
    description: "Route messages from WhatsApp directly into your Boostk unified inbox.",
    icon: (
      <svg
        aria-hidden="true"
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
  },
  {
    id: "slack" as IntegrationProvider,
    name: "Slack Notifications",
    category: "Operational Tools",
    description: "Receive instant notifications in your workspace when a high-priority chat arrives.",
    icon: (
      <svg
        aria-hidden="true"
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
        />
      </svg>
    ),
  },
  {
    id: "webhooks" as IntegrationProvider,
    name: "Custom Webhooks",
    category: "Operational Tools",
    description: "Send raw event data from internal systems into Boostk for custom workflows.",
    icon: (
      <svg
        aria-hidden="true"
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
        />
      </svg>
    ),
  },
];

function OrganizationIntegrationsPage() {
  const { organizationId } = Route.useParams();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("All");
  const [pendingProvider, setPendingProvider] = useState<IntegrationProvider | null>(null);
  const [disconnectTarget, setDisconnectTarget] = useState<{ provider: IntegrationProvider; name: string } | null>(
    null,
  );
  const [disconnectError, setDisconnectError] = useState<string | null>(null);

  const { data: activeIntegrations } = useSuspenseQuery(organizationIntegrationQueries.all(organizationId));

  const connectedProviders = new Set(activeIntegrations.map((i) => i.provider));

  const connectMutation = useMutation({
    mutationFn: connectIntegrationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: organizationIntegrationQueries.all(organizationId).queryKey,
      });
    },
    onSettled: () => setPendingProvider(null),
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectIntegrationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: organizationIntegrationQueries.all(organizationId).queryKey,
      });
      setDisconnectTarget(null);
      setDisconnectError(null);
    },
    onError: (error) => setDisconnectError(error.message),
    onSettled: () => setPendingProvider(null),
  });

  // Filter Catalog
  const categories = ["All", ...Array.from(new Set(AVAILABLE_INTEGRATIONS.map((item) => item.category)))];
  const filteredIntegrations =
    filter === "All" ? AVAILABLE_INTEGRATIONS : AVAILABLE_INTEGRATIONS.filter((item) => item.category === filter);

  const toggleIntegration = (providerId: IntegrationProvider, isCurrentlyConnected: boolean) => {
    if (isCurrentlyConnected) {
      const target = AVAILABLE_INTEGRATIONS.find((i) => i.id === providerId);
      setDisconnectTarget(target ? { provider: target.id, name: target.name } : null);
      return;
    }
    setPendingProvider(providerId);
    connectMutation.mutate({ data: { organizationId, provider: providerId } });
  };

  return (
    <>
      <div className="h-screen overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8 bg-background text-foreground pb-20">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-border pb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Connect Boostk with your favorite tools to streamline your support workflow.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
            <div className="flex items-center space-x-1 bg-muted p-1 rounded-[5px] w-full md:w-auto overflow-x-auto">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-[5px] transition-all whitespace-nowrap uppercase ${
                    filter === cat
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIntegrations.map((integration) => {
              const isConnected = connectedProviders.has(integration.id);
              const isPending = pendingProvider === integration.id;

              return (
                <div
                  key={integration.id}
                  className="bg-card border border-border rounded-[10px] p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-muted rounded-[8px] text-primary">{integration.icon}</div>

                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          isConnected
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : "bg-muted text-muted-foreground border-transparent"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-600" : "bg-muted-foreground"}`}
                        ></span>
                        {isConnected ? "Live" : "Disconnected"}
                      </div>
                    </div>

                    <h3 className="font-semibold text-lg mb-1">{integration.name}</h3>
                    <p className="text-sm text-muted-foreground mb-6 line-clamp-3">{integration.description}</p>
                  </div>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => toggleIntegration(integration.id, isConnected)}
                    className={`w-full py-2 rounded-[4px] text-sm font-medium transition-colors disabled:opacity-50 border ${
                      isConnected
                        ? "bg-muted text-foreground hover:bg-muted/80 border-border"
                        : "bg-primary text-primary-foreground hover:opacity-90 border-transparent"
                    }`}
                  >
                    {isConnected ? "Disconnect" : "Connect"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={disconnectTarget !== null}
        onClose={() => {
          setDisconnectTarget(null);
          setDisconnectError(null);
        }}
        title="Disconnect Integration"
        message={
          <>
            Are you sure you want to disconnect <strong>{disconnectTarget?.name}</strong>? You can reconnect at any
            time.
          </>
        }
        confirmLabel="Disconnect"
        variant="destructive"
        isPending={disconnectMutation.isPending}
        onConfirm={() => {
          if (!disconnectTarget) return;
          setPendingProvider(disconnectTarget.provider);
          disconnectMutation.mutate({
            data: { organizationId, provider: disconnectTarget.provider },
          });
        }}
        error={disconnectError}
      />
    </>
  );
}
