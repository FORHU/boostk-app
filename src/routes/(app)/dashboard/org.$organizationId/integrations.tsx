import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { CalendarClock, KeyRound, Settings, Wifi } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { REDIRECT_REASON } from "@/enums/enums";
import { hasOrgRole, ORG_ROLE } from "@/modules/auth/roles";
import {
  connectIntegrationFn,
  disconnectIntegrationFn,
  type INTEGRATION_PROVIDERS,
} from "@/modules/integrations/integration-functions";
import { organizationIntegrationQueries } from "@/modules/integrations/integration-queries";

type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];

interface IntegrationCatalogEntry {
  id: IntegrationProvider;
  name: string;
  category: string;
  description: string;
  longDescription: string;
  icon: React.ReactNode;
  settings: { label: string; value: string }[];
}

function formatConnectedDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export const Route = createFileRoute("/(app)/dashboard/org/$organizationId/integrations")({
  beforeLoad: ({ context }) => {
    if (!hasOrgRole(context.role, ORG_ROLE.ADMIN)) {
      throw redirect({ to: "/dashboard/organizations", search: { reason: REDIRECT_REASON.PERMISSION_DENIED } });
    }
  },
  component: OrganizationIntegrationsPage,
});

const AVAILABLE_INTEGRATIONS: IntegrationCatalogEntry[] = [
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    category: "Communication Channels",
    description: "Route messages from WhatsApp directly into your Boostk unified inbox.",
    longDescription:
      "Connect your WhatsApp Business number to let customers reach you where they already chat. Incoming messages land in your Boostk unified inbox alongside email and web conversations.",
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
    settings: [
      { label: "Phone Number", value: "+1 (555) 012-3456" },
      { label: "Webhook URL", value: "https://api.boostk.app/integrations/whatsapp" },
      { label: "Message Mode", value: "Inbox" },
    ],
  },
  {
    id: "slack",
    name: "Slack Notifications",
    category: "Operational Tools",
    description: "Receive instant notifications in your workspace when a high-priority chat arrives.",
    longDescription:
      "Get real-time alerts in Slack the moment a high-priority conversation arrives. Keep your team notified without leaving the tools they already work in every day.",
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
    settings: [
      { label: "Workspace", value: "boostk" },
      { label: "Channel", value: "#support-alerts" },
      { label: "Webhook URL", value: "https://hooks.slack.com/services/…" },
    ],
  },
  {
    id: "webhooks",
    name: "Custom Webhooks",
    category: "Operational Tools",
    description: "Send raw event data from internal systems into Boostk for custom workflows.",
    longDescription:
      "Push raw event payloads from your internal systems straight into Boostk. Ideal for glueing custom workflows, CRMs, and internal tooling to your support pipeline.",
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
    settings: [
      { label: "Endpoint URL", value: "https://api.boostk.app/integrations/webhooks" },
      { label: "Signing Secret", value: "••••••••••••••••" },
    ],
  },
];

function OrganizationIntegrationsPage() {
  const { organizationId } = Route.useParams();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("All");
  const [pendingProvider, setPendingProvider] = useState<IntegrationProvider | null>(null);
  const [detailProvider, setDetailProvider] = useState<IntegrationProvider | null>(null);
  const [disconnectTarget, setDisconnectTarget] = useState<{ provider: IntegrationProvider; name: string } | null>(
    null,
  );
  const [disconnectError, setDisconnectError] = useState<string | null>(null);

  const { data: activeIntegrations } = useSuspenseQuery(organizationIntegrationQueries.all(organizationId));

  const connectedProviders = new Set(activeIntegrations.map((i) => i.provider));

  const detailIntegration =
    detailProvider !== null ? AVAILABLE_INTEGRATIONS.find((i) => i.id === detailProvider) : null;
  const detailRecord = detailProvider !== null ? activeIntegrations.find((i) => i.provider === detailProvider) : null;
  const detailIsConnected = detailRecord != null;

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
                // biome-ignore lint/a11y/useSemanticElements: <card is clickable but nests an action button, so it cannot be a real <button>>
                <div
                  key={integration.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setDetailProvider(integration.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setDetailProvider(integration.id);
                    }
                  }}
                  className="bg-card border border-border rounded-[10px] p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleIntegration(integration.id, isConnected);
                    }}
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

      <Sheet
        open={detailProvider !== null}
        onOpenChange={(open) => {
          if (!open) setDetailProvider(null);
        }}
      >
        <SheetContent>
          {detailIntegration && (
            <>
              <SheetHeader>
                <div className="flex items-start justify-between gap-3 pr-8">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-3 bg-muted rounded-[8px] text-primary shrink-0">{detailIntegration.icon}</div>
                    <div className="min-w-0">
                      <SheetTitle className="text-lg font-semibold truncate">{detailIntegration.name}</SheetTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{detailIntegration.category}</p>
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 ${
                      detailIsConnected
                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                        : "bg-muted text-muted-foreground border-transparent"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        detailIsConnected ? "bg-green-600" : "bg-muted-foreground"
                      }`}
                    ></span>
                    {detailIsConnected ? "Live" : "Disconnected"}
                  </div>
                </div>
                <SheetDescription className="pt-2">{detailIntegration.longDescription}</SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-4 space-y-6">
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground border border-border shrink-0">
                      <Wifi className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase font-bold text-muted-foreground truncate">Status</p>
                      <p className="font-medium text-foreground truncate">
                        {detailIsConnected ? "Live" : "Disconnected"}
                      </p>
                    </div>
                  </li>

                  {detailIsConnected && detailRecord ? (
                    <li className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground border border-border shrink-0">
                        <CalendarClock className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs uppercase font-bold text-muted-foreground truncate">Connected Since</p>
                        <p className="font-medium text-foreground truncate">
                          {formatConnectedDate(detailRecord.createdAt)}
                        </p>
                      </div>
                    </li>
                  ) : null}

                  <li className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground border border-border shrink-0">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase font-bold text-muted-foreground truncate">Provider ID</p>
                      <p className="font-medium text-foreground truncate">{detailIntegration.id}</p>
                    </div>
                  </li>
                </ul>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Settings</h4>
                  </div>
                  <ul className="space-y-4">
                    {detailIntegration.settings.map((setting) => (
                      <li key={setting.label} className="flex items-center gap-3 text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs uppercase font-bold text-muted-foreground truncate">{setting.label}</p>
                          <p className="font-medium text-foreground truncate">{setting.value}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {!detailIsConnected && (
                  <div className="p-3 text-sm text-muted-foreground bg-muted/50 rounded-[8px] border border-border">
                    This integration is not connected yet. Connect it to start using it with Boostk.
                  </div>
                )}
              </div>

              <SheetFooter className="border-t border-border">
                <Button
                  variant={detailIsConnected ? "destructive" : "default"}
                  disabled={pendingProvider === detailProvider}
                  onClick={() => {
                    if (!detailProvider) return;
                    if (detailIsConnected) {
                      setDisconnectTarget({ provider: detailProvider, name: detailIntegration.name });
                      return;
                    }
                    setPendingProvider(detailProvider);
                    connectMutation.mutate({ data: { organizationId, provider: detailProvider } });
                  }}
                >
                  {detailIsConnected ? "Disconnect" : "Connect"}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

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
