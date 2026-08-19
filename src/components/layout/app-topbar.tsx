"use client";

import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useMatch, useNavigate } from "@tanstack/react-router";
import { BadgeCheckIcon, CreditCardIcon, InboxIcon, LogOutIcon, SparklesIcon, ZapIcon } from "lucide-react";
import { useEffect } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NotificationItem } from "@/hooks/use-notifications";
import { authClient } from "@/lib/auth-client";
import { authQueries } from "@/modules/auth/auth.queries";
import { hasOrgRole, ORG_ROLE } from "@/modules/auth/roles";
import { intakeQueries } from "@/modules/intake/intake.queries";
import { organizationQueries } from "@/modules/organization/organization.queries";
import { NotificationBell } from "./notification-bell";
import { RouterBreadcrumb } from "./RouterBreadcrumb";

/**
 * Entry point to the BOOSTK-wide triage inbox, shown only to platform staff.
 *
 * Purely an affordance: every triage server function re-checks `platformRole` through
 * `requirePlatformStaffMiddleware`, so hiding the link is never what keeps a tenant out.
 */
function TriageNavLink() {
  const { data: isStaff } = useQuery(intakeQueries.isPlatformStaff());
  if (!isStaff) return null;

  return (
    <Link
      to="/dashboard/triage"
      className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      activeProps={{ className: "text-foreground" }}
    >
      <InboxIcon className="size-4" />
      Triage
    </Link>
  );
}

interface AppTopbarProps {
  connectionStatus?: "connecting" | "connected" | "reconnecting";
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (ticketId: string, isIntake?: boolean) => void;
}

export default function AppTopbar({ connectionStatus, notifications, unreadCount, markAsRead }: AppTopbarProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // `useSuspenseQuery` is behaving correctly here, despite the nullable type: it removes
  // the *loading* state (`data` is never `undefined`), but `null` is a resolved value, not
  // a pending one. The nullability comes from the server function's own contract —
  // `getAuthUserSessionFn` runs `authMiddleware`, which passes `authSession` through as-is
  // and yields `null` when signed out, rather than `requireAuthMiddleware`, which
  // redirects. So `Session | null` is the honest type and there is nothing to fix upstream.
  const { data: authSession } = useSuspenseQuery(authQueries.authUser());

  const orgMatch = useMatch({
    from: "/(app)/dashboard/org/$organizationSlug",
    shouldThrow: false,
  });
  const { data: organizations } = useSuspenseQuery(organizationQueries.getAuthOrganization());

  // Reached only when the session expires *while* the dashboard is open: `(app)/route.tsx`
  // already redirects on `beforeLoad`, so a signed-out visitor never gets this far on a
  // fresh navigation. The refetched query can still resolve to null under a route context
  // that still holds the old session, which is why the guard stays.
  //
  // The redirect runs in an effect rather than during render — navigating mid-render is a
  // side effect React is entitled to discard or run twice.
  useEffect(() => {
    if (!authSession) navigate({ to: "/signin" });
  }, [authSession, navigate]);

  if (!authSession) return null;

  const { user } = authSession;
  const organizationSlug = orgMatch?.params.organizationSlug ?? organizations[0]?.slug;

  // Billing is admin-and-above (same bar as Teams, Settings and Usage). Agents and
  // members do not manage the plan, so offering them a link that only redirects to
  // permission_denied is worse than not showing it. This mirrors the route guard in
  // billing.tsx — it does not replace it.
  const canManageBilling = hasOrgRole(organizations.find((org) => org.slug === organizationSlug)?.role, ORG_ROLE.ADMIN);

  const handleLogout = async () => {
    queryClient.clear();
    await queryClient.invalidateQueries();
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate({ to: "/signin" });
        },
      },
    });
  };
  return (
    <div className="w-full flex flex-row">
      <nav className="z-10 w-full h-11 border-b bg-background border-border flex flex-row items-center justify-between p-2">
        <div className="flex items-center gap-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <ZapIcon className="size-4" />
          </div>
          <RouterBreadcrumb />
        </div>

        <div className="flex items-center gap-4">
          <TriageNavLink />
          {connectionStatus && connectionStatus !== "connected" && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              {connectionStatus === "connecting" ? "Connecting…" : "Reconnecting…"}
            </div>
          )}
          <ThemeToggle />
          <NotificationBell notifications={notifications} unreadCount={unreadCount} markAsRead={markAsRead} />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="aria-expanded:bg-muted cursor-pointer border-none bg-transparent p-0 outline-none"
                />
              }
            >
              <Avatar>
                <AvatarImage className="size-8" src={"/avatars/laugh-orange-cat.gif"} alt={user.name} />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-56 rounded-lg" side="top" align="end" sideOffset={4}>
              <DropdownMenuGroup>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar>
                      <AvatarImage src={"/avatars/laugh-orange-cat.gif"} alt={user.name} />
                      <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{user.name}</span>
                      <span className="truncate text-xs">{user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              {/* Both of these go to the same billing page, so both are admin-gated.
                  The separator lives inside the condition — left outside, hiding the
                  group would leave two dividers stacked against each other. */}
              {canManageBilling && organizationSlug && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      render={<Link to="/dashboard/org/$organizationSlug/billing" params={{ organizationSlug }} />}
                    >
                      <SparklesIcon />
                      Upgrade to Pro
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem disabled>
                  <BadgeCheckIcon />
                  Account
                </DropdownMenuItem>
                {canManageBilling && organizationSlug && (
                  <DropdownMenuItem
                    render={<Link to="/dashboard/org/$organizationSlug/billing" params={{ organizationSlug }} />}
                  >
                    <CreditCardIcon />
                    Billing
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOutIcon />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </div>
  );
}
