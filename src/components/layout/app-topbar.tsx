"use client";

import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { BadgeCheckIcon, BellIcon, LogOutIcon, ZapIcon } from "lucide-react";
import { TopbarBreadcrumb } from "@/components/layout/top-bar/topbar-breadcrumb";
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
import { authClient } from "@/lib/auth/auth-client";
import { authQueries } from "@/modules/auth/auth.queries";
// import { authQueries } from "@/features/auth/auth.queries";
// import { authClient } from "@/lib/better-auth-client";

export default function AppTopbar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data } = useSuspenseQuery(authQueries.getAuthenticatedUser());
  const { user } = data;

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
    <div className="w-full flex flex-row sticky top-0 z-50">
      <nav className="z-10 w-full h-12 border-b bg-background border-border flex flex-row items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="-ml-1">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <ZapIcon className="size-4" />
            </div>
          </Link>

          <AppTopbarDivider />

          <TopbarBreadcrumb />
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar>
                <AvatarImage className="size-8" src={user.image || undefined} alt={user.name} />
                <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="min-w-56 rounded-lg bg-white" side="top" align="end" sideOffset={4}>
              <DropdownMenuGroup>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 p-1 text-sm">
                    <Avatar>
                      <AvatarImage className="size-8" src={user.image || undefined} alt={user.name} />
                      <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="grid">
                      <span className="truncate font-medium">{user.name}</span>
                      <span className="truncate text-xs">{user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup className="space-y-1">
                <DropdownMenuItem>
                  <BadgeCheckIcon />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <BellIcon />
                  Notifications
                </DropdownMenuItem>
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

const AppTopbarDivider = () => {
  return (
    <span className="text-border-stronger hidden md:block">
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        stroke="#94a3b8"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        shapeRendering="geometricPrecision"
        aria-hidden="true"
      >
        <path d="M16 3.549L7.12 20.600"></path>
      </svg>
    </span>
  );
};
