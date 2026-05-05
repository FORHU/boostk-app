import { useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  Box,
  Copy,
  Download,
  ExternalLink,
  LayoutGrid,
  Loader2,
  Mail,
  MoreVertical,
  Plus,
  RotateCcw,
  Settings,
  ShieldAlert,
  Ticket,
  UserCog,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Reusing the mock data
const getMockDetails = (_orgId: string) => ({
  members: [
    { id: "1", name: "Alice Admin", email: "alice@org.com", role: "Admin", status: "Active" },
    { id: "2", name: "Bob Builder", email: "bob@org.com", role: "Member", status: "Active" },
    { id: "3", name: "Charlie Support", email: "charlie@org.com", role: "Agent", status: "Active" },
    { id: "4", name: "David Developer", email: "david@org.com", role: "Member", status: "Active" },
  ],
  projects: [
    { id: "p1", name: "Alpha", tickets: 24, status: "Active" },
    { id: "p2", name: "Beta", tickets: 12, status: "Active" },
    { id: "p3", name: "Gamma", tickets: 8, status: "Inactive" },
    { id: "p4", name: "Delta", tickets: 5, status: "Active" },
  ],
});

type TabType = "general" | "team" | "projects" | "danger";

export function OrganizationDetailsPage({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // In a real scenario, this would come from a query or loader
  const [orgName, setOrgName] = useState("Acme Corporation");
  const [tempOrgName, setTempOrgName] = useState("Acme Corporation");

  const mockOrgData = {
    id: organizationId,
    name: orgName,
    slug: "acme-corp",
    status: "ACTIVE",
    createdAt: "2026-05-05T03:00:00Z",
  };

  const details = getMockDetails(organizationId);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast("Organization ID copied to clipboard");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setOrgName(tempOrgName);
      toast.success("Organization details updated.");
      setIsSaving(false);
      setIsEditing(false);
    }, 800);
  };

  return (
    <div className="w-full">
      <div className="flex-1 space-y-8 p-8 pt-6 max-w-7xl mx-auto">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => router.history.back()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeft size={16} />
            Back to Organizations
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-600 rounded-[5px] flex items-center justify-center text-white font-bold text-xl">
                {orgName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-bold tracking-tight text-foreground">{orgName}</h2>
                  <span className="bg-green-50 text-green-700 border border-green-200 font-bold px-2 py-0.5 rounded-full text-xs">
                    {mockOrgData.status}
                  </span>
                </div>
                <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                  Organization ID: <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">{organizationId}</code>
                  <button
                    type="button"
                    onClick={() => handleCopyId(organizationId)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Copy size={12} />
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-gray-200/50 rounded-[5px] w-fit">
          {[
            { id: "general", label: "General", icon: Settings },
            { id: "team", label: "Team & Members", icon: Users },
            { id: "projects", label: "Projects", icon: LayoutGrid },
            { id: "danger", label: "Danger Zone", icon: ShieldAlert },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-[5px] transition-all flex items-center gap-2 ${
                activeTab === tab.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon size={12} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === "general" && (
            <div className="space-y-4">
              <h2 className="text-xl font-normal">General Information</h2>
              <Card className="rounded-[5px] border-border overflow-hidden shadow-none">
                <form onSubmit={handleSave}>
                  <CardContent className="p-0">
                    {/* Name Row */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 border-b border-border">
                      <div className="space-y-1">
                        <p className="text-base font-medium">Organization name</p>
                        <p className="text-sm text-muted-foreground">The public name of the workspace.</p>
                      </div>
                      <div className="md:max-w-[400px] w-full">
                        {isEditing ? (
                          <Input
                            value={tempOrgName}
                            onChange={(e) => setTempOrgName(e.target.value)}
                            className="rounded-[5px]"
                          />
                        ) : (
                          <p className="text-base font-medium text-gray-900">{orgName}</p>
                        )}
                      </div>
                    </div>

                    {/* Slug Row */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 border-b border-border">
                      <div className="space-y-1">
                        <p className="text-base font-medium">Identifier slug</p>
                        <p className="text-sm text-muted-foreground">
                          The unique URL identifier for this organization.
                        </p>
                      </div>
                      <div className="md:max-w-[400px] w-full">
                        <code className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {mockOrgData.slug}
                        </code>
                      </div>
                    </div>

                    {/* Created Row */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 border-b border-border">
                      <div className="space-y-1">
                        <p className="text-base font-medium">Creation Date</p>
                        <p className="text-sm text-muted-foreground">When this organization was first registered.</p>
                      </div>
                      <div className="md:max-w-[400px] w-full text-base font-medium text-gray-900">
                        {formatDate(mockOrgData.createdAt)}
                      </div>
                    </div>

                    {/* System Logo Row */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 p-6">
                      <div className="space-y-1">
                        <p className="text-base font-medium">System Logo</p>
                        <p className="text-sm text-muted-foreground">Branding used across the platform.</p>
                      </div>
                      <div className="md:max-w-[400px] w-full">
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 bg-muted rounded-[5px] flex items-center justify-center">
                            <Box size={24} className="text-muted-foreground" />
                          </div>
                          {isEditing && (
                            <Button variant="outline" size="sm" className="rounded-[5px] h-8 text-xs font-medium">
                              Change Logo
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="justify-end py-4 px-6 bg-muted/10 border-t border-border gap-3">
                    {isEditing ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditing(false)}
                          className="rounded-[5px] font-medium text-xs h-9 px-6"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={isSaving}
                          className="bg-[#1549e6] text-white hover:bg-[#2563eb] rounded-[5px] font-normal h-9 px-6 shadow-none"
                        >
                          {isSaving ? <Loader2 size={16} className="animate-spin" /> : "Save changes"}
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="rounded-[5px] font-medium text-xs h-9 px-6 border-border"
                      >
                        Edit details
                      </Button>
                    )}
                  </CardFooter>
                </form>
              </Card>
            </div>
          )}

          {activeTab === "team" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-normal">Team & Members</h2>
                <Button size="sm" className="bg-[#1549e6] text-white hover:bg-[#2563eb] rounded-[5px] text-xs h-8">
                  <Plus size={14} className="mr-1.5" /> Invite Member
                </Button>
              </div>
              <Card className="rounded-[5px] border-border overflow-hidden shadow-none">
                <CardContent className="p-0 divide-y divide-border">
                  {details.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-muted rounded-full flex items-center justify-center font-bold text-xs">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200">
                          {member.role}
                        </span>
                        <button type="button" className="text-muted-foreground hover:text-foreground">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "projects" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-normal">Active Projects</h2>
                <Button size="sm" className="bg-[#1549e6] text-white hover:bg-[#2563eb] rounded-[5px] text-xs h-8">
                  <Plus size={14} className="mr-1.5" /> New Project
                </Button>
              </div>
              <Card className="rounded-[5px] border-border overflow-hidden shadow-none">
                <CardContent className="p-0 divide-y divide-border">
                  {details.projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-[5px]">
                          <Box size={20} />
                        </div>
                        <div>
                          <p className="text-base font-semibold">{project.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`text-[9px] font-bold uppercase tracking-tight px-2 py-0.5 rounded-full border ${project.status === "Active" ? "text-green-600 bg-green-50 border-green-100" : "text-gray-400 bg-gray-50 border-gray-100"}`}
                            >
                              {project.status}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Ticket size={12} /> {project.tickets} tickets
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs h-8 rounded-[5px]">
                        Manage <ExternalLink size={14} className="ml-1.5" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "danger" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-normal text-red-600">Danger Zone</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Irreversible and destructive actions for this organization.
                </p>
              </div>

              <Card className="rounded-[5px] border-red-100 overflow-hidden shadow-none bg-red-50/10">
                <CardContent className="p-0 divide-y divide-red-100">
                  <div className="flex items-center justify-between p-6">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Suspend Organization</p>
                      <p className="text-xs text-muted-foreground">Temporarily block all access for all members.</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50 rounded-[5px] h-9 px-6 text-xs font-bold"
                    >
                      Suspend
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-6">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Reset Data</p>
                      <p className="text-xs text-muted-foreground">Permanently delete all tickets and interactions.</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50 rounded-[5px] h-9 px-6 text-xs font-bold"
                    >
                      Reset Platform
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-6 bg-red-50/30">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-red-700">Delete Organization</p>
                      <p className="text-xs text-red-600/70">
                        Permanently remove this workspace and all associated data.
                      </p>
                    </div>
                    <Button className="bg-red-600 text-white hover:bg-red-700 rounded-[5px] h-9 px-6 text-xs font-bold shadow-none">
                      Delete Forever
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
