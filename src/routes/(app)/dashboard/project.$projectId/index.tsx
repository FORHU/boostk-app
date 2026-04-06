import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  MessageCircle,
  MessageSquare,
  Settings,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/(app)/dashboard/project/$projectId/")({
  component: ProjectPage,
});

function ProjectPage() {
  const { project } = Route.useRouteContext();
  const [copied, setCopied] = useState(false);

  const snippet = `<script src="${window.location.origin}/support/${project.id}/widget.js" async></script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 rounded-xl">
            <AvatarImage src={project.logo || "/avatars/laugh-orange-cat.gif"} />
            <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-lg">
              {project.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{project.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs uppercase">{project.id}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                Live & Accepting Chats
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-9">
            <Settings className="mr-2 h-4 w-4" />
            Project Settings
          </Button>
          <a href={`/support/${project.id}/chat-widget`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
              <MessageCircle className="mr-2 h-4 w-4" />
              Test Chat Widget
              <ExternalLink className="ml-2 h-3 w-3 opacity-50" />
            </Button>
          </a>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Active Tickets", value: "12", trend: "+2 today", icon: MessageSquare, color: "text-blue-500" },
          { title: "Avg. Resolution", value: "1.4h", trend: "-15% weekly", icon: Clock, color: "text-orange-500" },
          {
            title: "CSAT Score",
            value: "4.9/5",
            trend: "+0.2 improvement",
            icon: ShieldCheck,
            color: "text-green-500",
          },
          { title: "Daily Messages", value: "142", trend: "+12% growth", icon: BarChart3, color: "text-purple-500" },
        ].map((stat, idx) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: <placeholder>
          <Card key={idx} className="border-foreground/10 bg-card/50 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color} opacity-70`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-7">
        {/* Installation Guide */}
        <Card className="lg:col-span-4 border-foreground/10 bg-card/50 shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Settings className="h-5 w-5 text-primary" />
              Quick Installation
            </CardTitle>
            <CardDescription>Add this snippet to your website's header to enable the chat widget.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative group">
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 bg-background/50 backdrop-blur-xs"
                  onClick={copyToClipboard}
                >
                  {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <pre className="p-5 rounded-xl bg-muted/80 border border-foreground/5 overflow-x-auto text-[13px] leading-relaxed font-mono text-foreground/80">
                {snippet}
              </pre>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className="text-sm font-semibold text-foreground">Manual Direct Link</h4>
              <div className="flex items-center justify-between p-3 rounded-lg border border-foreground/5 bg-muted/30">
                <code className="text-xs truncate max-w-[200px] md:max-w-md opacity-70">
                  {`${window.location.origin}/support/${project.id}/chat-widget`}
                </code>
                <a
                  href={`/support/${project.id}/chat-widget`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-xs flex items-center gap-1"
                >
                  Open <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 rounded-b-xl border-t border-foreground/5 py-3">
            <p className="text-xs text-muted-foreground italic">
              Need help? Check our{" "}
              <span className="text-primary cursor-pointer hover:underline">integration documentation</span>.
            </p>
          </CardFooter>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-3 border-foreground/10 bg-card/50 shadow-xs">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Tickets</CardTitle>
            <CardDescription>Latest support interactions</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-foreground/5 capitalize">
              {[
                { name: "Sarah Chen", msg: "Issue with checkout process", time: "2m ago", status: "Open" },
                { name: "John Doe", msg: "Feature request: Dark mode", time: "15m ago", status: "In Progress" },
                { name: "Mike Ross", msg: "Can't login to my account", time: "1h ago", status: "Closed" },
              ].map((activity, idx) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: <placeholder>
                  key={idx}
                  className="p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                      {activity.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none truncate text-foreground">{activity.name}</p>
                    <p className="text-[13px] text-muted-foreground mt-1 truncate">{activity.msg}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-muted-foreground">{activity.time}</p>
                    <span
                      className={`text-[10px] font-semibold mt-1 inline-block px-1.5 py-0.5 rounded-full ${
                        activity.status === "Open"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : activity.status === "Closed"
                            ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                            : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                      }`}
                    >
                      {activity.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="justify-center py-3">
            <Button variant="link" className="text-xs text-muted-foreground h-auto p-0">
              View all 248 tickets
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
