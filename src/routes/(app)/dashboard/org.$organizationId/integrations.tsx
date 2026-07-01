import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/(app)/dashboard/org/$organizationId/integrations")({
  component: OrganizationIntegrationsPage,
});

// Mock data structured around the 3 core integration pillars
const INTEGRATION_DATA = [
  {
    id: "openai",
    name: "OpenAI",
    category: "AI & Productivity",
    description: "Enable real-time AI translation and advanced chat summarization features.",
    status: "connected",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    category: "Communication Channels",
    description: "Route messages from WhatsApp directly into your Boostk unified inbox.",
    status: "disconnected",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    id: "slack",
    name: "Slack Notifications",
    category: "Operational Tools",
    description: "Receive instant notifications in your workspace when a high-priority chat arrives.",
    status: "disconnected",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
      </svg>
    ),
  },
  {
    id: "webhooks",
    name: "Custom Webhooks",
    category: "Operational Tools",
    description: "Send raw event data from internal systems into Boostk for custom workflows.",
    status: "connected",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  }
];

function OrganizationIntegrationsPage() {
  const [filter, setFilter] = useState("All");
  const categories = ["All", ...Array.from(new Set(INTEGRATION_DATA.map(item => item.category)))];

  const filteredIntegrations = filter === "All" 
    ? INTEGRATION_DATA 
    : INTEGRATION_DATA.filter(item => item.category === filter);

  return (
    <div className="h-screen overflow-y-auto">
    <div className=" max-w-7xl mx-auto p-6 md:p-10 space-y-8 bg-background text-foreground pb-20">

      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect Boostk with your favorite tools to streamline your support workflow.
          </p>
        </div>
      </div>
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
              filter === cat 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.map((integration) => (
          <div 
            key={integration.id} 
            className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-muted rounded-lg text-primary">
                  {integration.icon}
                </div>
                
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                  integration.status === 'connected' 
                    ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                    : 'bg-muted text-muted-foreground border-transparent'}`}>

                  <span className={`w-1.5 h-1.5 rounded-full ${
                    integration.status === 'connected' ? 'bg-green-600' : 'bg-muted-foreground'
                  }`}></span>
                  {integration.status === 'connected' ? 'Live' : 'Disconnected'}
                </div>
              </div>

              <h3 className="font-semibold text-lg mb-1">{integration.name}</h3>
              <p className="text-sm text-muted-foreground mb-6 line-clamp-3">
                {integration.description}
              </p>
            </div>

            <button className={`w-full py-2 rounded-md text-sm font-medium transition-colors ${
              integration.status === 'connected'
                ? 'bg-muted text-foreground hover:bg-muted/80 border border-border'
                : 'bg-primary text-primary-foreground hover:opacity-90'}`}>

              {integration.status === 'connected' ? 'Manage' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
    </div>
);}