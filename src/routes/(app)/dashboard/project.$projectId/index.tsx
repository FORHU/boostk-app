import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  LaptopMinimalCheck,
  MessageCircle,
  MessageSquare,
  Settings,
  ShieldCheck,
  TrendingUp,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/(app)/dashboard/project/$projectId/")({
  component: ProjectPage,
});

function ProjectPage() {
  const { project } = Route.useRouteContext();
  const [copied, setCopied] = useState(false);
  const [showInstallPopup, setShowInstallPopup] = useState(false);
  const installButtonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const snippet = `<script src="${window.location.origin}/support/${project.id}/widget.js" async></script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        installButtonRef.current &&
        !installButtonRef.current.contains(event.target as Node)
      ) {
        setShowInstallPopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        <div className="flex items-center gap-3 relative">
          {/* Quick Installation Button with Popup */}
          <div className="relative">
            <Button
              ref={installButtonRef}
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => setShowInstallPopup(!showInstallPopup)}
            >
              <LaptopMinimalCheck className="mr-2 h-4 w-4" />
              Quick Installation
            </Button>
            {showInstallPopup && (
              <div
                ref={popupRef}
                style={{ borderRadius: "10px" }}
                className="absolute left-full right-0 mt-2 w-[500px] max-w-[90vw] bg-background rounded-xl shadow-2xl border border-foreground/10 z-50"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-foreground/10">
                  <div>
                    <h3 className="font-semibold text-foreground">Quick Installation</h3>
                    <p className="text-xs text-muted-foreground">Add this snippet to your website's header</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInstallPopup(false)}
                    className="p-1 rounded-full hover:bg-muted transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                  <div className="relative group">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={copyToClipboard}>
                        {copied ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        <span className="ml-1">{copied ? "Copied!" : "Copy"}</span>
                      </Button>
                    </div>
                    <pre className="p-3 rounded-lg bg-muted/80 border border-foreground/5 overflow-x-auto text-xs font-mono text-foreground/80">
                      {snippet}
                    </pre>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-foreground mb-2">Manual Direct Link</h4>
                    <div className="flex items-center justify-between p-2 rounded-lg border border-foreground/5 bg-muted/30">
                      <code className="text-[11px] truncate max-w-[200px] md:max-w-xs opacity-70">
                        {`${window.location.origin}/support/${project.id}/chat-widget`}
                      </code>
                      <a
                        href={`/support/${project.id}/chat-widget`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-xs flex items-center gap-1 shrink-0 ml-2"
                      >
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-3 pt-0 border-t border-foreground/10 mt-2">
                  <p className="text-xs text-muted-foreground italic">
                    Need help? <span className="text-primary cursor-pointer hover:underline">Integration docs</span>
                  </p>
                </div>
              </div>
            )}
          </div>

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
  );
}
