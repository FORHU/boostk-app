"use client";

import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { BadgeCheckIcon, BellIcon, CreditCardIcon, LogOutIcon, SparklesIcon, ZapIcon } from "lucide-react";
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
import { authClient } from "@/lib/auth-client";
import { authQueries } from "@/modules/auth/auth.queries";
import { RouterBreadcrumb } from "./RouterBreadcrumb";

export default function AppTopbar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // TODO: investigate why useSuspenseQuery is not working (return data can be nullable)
  const { data: authSession } = useSuspenseQuery(authQueries.authUser());

  if (!authSession) {
    console.error("No auth session. Redirecting to login.");
    navigate({ to: "/signin" });
    return null;
  }

  const { user } = authSession;

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
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <SparklesIcon />
                  Upgrade to Pro
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <BadgeCheckIcon />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCardIcon />
                  Billing
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
