import { useMutation, useQueryClient, useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, BarChart2, Globe, Loader2, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authQueries } from "@/modules/auth/auth.queries";
import { organizationQueries } from "@/modules/organization/organization.queries";
import { projectMutations, projectQueries } from "@/modules/project/project.queries";

interface Props {
  projectId: string;
}

export function ProjectUpdateForm({ projectId }: Props) {
  const queryClient = useQueryClient();

  const [{ data: projectData }, { data: authSession }] = useSuspenseQueries({
    queries: [projectQueries.getById(projectId), authQueries.authUser()],
  });
  const project = projectData!;

  const { data: members } = useSuspenseQuery(organizationQueries.getMembers(project.organizationId));

  const [name, setName] = useState(project.name);
  const [saving, setSaving] = useState(false);

  const update = useMutation({
    ...projectMutations.update(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectQueries.all });
      toast.success("Project updated.");
    },
    onError: () => toast.error("Failed to update project."),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await update.mutateAsync({ data: { projectId, name } });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto pb-20">
      {/* General */}
      <div className="space-y-4">
        <h2 className="text-xl font-normal">Project details</h2>
        <Card className="rounded-md border-border overflow-hidden">
          <form onSubmit={handleSubmit}>
            <CardContent className="p-0">
              {/* Name */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 border-b border-border">
                <div className="space-y-1">
                  <p className="text-base font-medium">Project name</p>
                  <p className="text-sm text-muted-foreground">Displayed throughout the dashboard.</p>
                </div>
                <div className="md:max-w-[400px] w-full">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Acme Support Hub"
                    className="rounded-md"
                  />
                </div>
              </div>

              {/* ID */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6">
                <div className="space-y-1">
                  <p className="text-base font-medium">Project ID</p>
                  <p className="text-sm text-muted-foreground">Reference used in APIs and URLs.</p>
                </div>
                <div className="md:max-w-[400px] w-full relative">
                  <Input
                    defaultValue={projectId}
                    readOnly
                    className="font-mono text-sm bg-muted/20 text-muted-foreground rounded-md pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(projectId);
                      toast.success("Copied to clipboard.");
                    }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer rounded px-2 py-1 flex items-center gap-1.5 transition-colors border bg-background text-sm font-medium"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="justify-end py-4 px-6 bg-background border-t border-border">
              <Button
                type="submit"
                size="sm"
                disabled={saving || !name.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded font-normal px-6 shadow-none"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Access */}
      <div className="space-y-4">
        <h2 className="text-xl font-normal">Project access</h2>
        <Card className="rounded-md border-border overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1">
                <h3 className="text-base font-medium">Organization-wide access</h3>
                <p className="text-sm text-muted-foreground">
                  All {members.length} organization members can access this project.
                </p>
              </div>
              <Link
                to="/dashboard/org/$organizationId/teams"
                params={{ organizationId: project.organizationId }}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Manage members
              </Link>
            </div>

            <div className="divide-y">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 rounded-full">
                      <AvatarImage src={member.user.image ?? ""} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {member.user.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium">{member.user.name}</span>
                        {authSession?.user.id === member.userId && (
                          <span className="text-[10px] bg-muted/60 text-muted-foreground font-bold px-1.5 py-0.5 rounded uppercase">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{member.user.email}</span>
                    </div>
                  </div>
                  <span className="text-xs capitalize px-2 py-0.5 rounded bg-muted/50 text-muted-foreground border">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Usage */}
      <div className="space-y-4">
        <h2 className="text-xl font-normal">Project usage</h2>
        <Card className="rounded-md border-border overflow-hidden">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-muted/50">
                <BarChart2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Project usage statistics have been moved</p>
                <p className="text-[13px] text-muted-foreground">
                  You may view your project's usage under your organization's settings
                </p>
              </div>
            </div>
            <Link
              to="/dashboard/org/$organizationId/usage"
              params={{ organizationId: project.organizationId }}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              View project usage
            </Link>
          </div>
        </Card>
      </div>

      {/* Custom Domains */}
      <div className="space-y-4">
        <h2 className="text-xl font-normal">Custom domains</h2>
        <Card className="rounded-md border-border overflow-hidden">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-muted/50">
                <Globe className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center gap-2">
                  Custom domains are a Pro Plan add-on
                  <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase">
                    Pro
                  </span>
                </p>
                <p className="text-[13px] text-muted-foreground">
                  Paid Plans come with free vanity subdomains or Custom Domains for an additional $10/month per domain.
                </p>
              </div>
            </div>
            <Button className="bg-green-600 hover:bg-green-700 text-white">Upgrade to Pro</Button>
          </div>
        </Card>
      </div>

      {/* Transfer */}
      <div className="space-y-4">
        <h2 className="text-xl font-normal">Transfer project</h2>
        <Card className="rounded-md border-border overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-muted/50">
                <RefreshCcw className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Transfer project to another organization</p>
                <p className="text-sm text-muted-foreground">
                  To transfer projects, the owner must be a member of both the source and target organizations.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Transfer project
            </Button>
          </div>
        </Card>
      </div>

      {/* Deactivate */}
      <div className="space-y-4 pb-12">
        <h2 className="text-xl font-semibold text-foreground">Danger zone</h2>
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-destructive/10 p-2 shrink-0">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-destructive leading-none pt-1">
                Deactivate this project
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Deactivating a project will make it inactive and hide it from the dashboard.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="destructive"
              type="button"
              className="h-10 px-6"
            >
              Deactivate project
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
