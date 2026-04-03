import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { authQueries } from "@/modules/auth/auth.queries";

interface AuthGuardProps {
  children: ReactNode;
  loadingFallback?: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
}

export function AuthGuard({ children, loadingFallback = null, fallback = null, requireAuth = true }: AuthGuardProps) {
  const { data: authSession, isLoading } = useQuery(authQueries.authUser());
  if (isLoading) return loadingFallback;

  const isAuthorized = requireAuth ? authSession?.user : !authSession?.user;
  if (!isAuthorized) return fallback;

  return children;
}
