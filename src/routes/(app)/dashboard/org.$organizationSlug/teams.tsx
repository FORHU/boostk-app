import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import type { Member, User } from "prisma/generated/client";
import { Suspense, useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { InviteModal } from "@/components/ui/invite-modals";
import { DataTableSkeleton, ToolbarSkeleton } from "@/components/ui/skeleton";
import { REDIRECT_REASON } from "@/enums/enums";
import { useDebounce } from "@/hooks/use-debounce";
import { formatDate } from "@/lib/format-date";
import { hasOrgRole, ORG_ROLE } from "@/modules/auth/roles";
import { removeMemberFn, updateMemberRoleFn } from "@/modules/members/member.functions";
import { memberQueries } from "@/modules/members/member.queries";

export const Route = createFileRoute("/(app)/dashboard/org/$organizationSlug/teams")({
  beforeLoad: ({ context }) => {
    if (!hasOrgRole(context.role, ORG_ROLE.ADMIN)) {
      throw redirect({
        to: "/dashboard/organizations",
        search: { reason: REDIRECT_REASON.PERMISSION_DENIED },
      });
    }
  },
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(memberQueries.adminList({ organizationId: context.organization.id }));
  },
  component: OrganizationTeamsPage,
});

function OrganizationTeamsPage() {
  const { organization } = Route.useRouteContext();
  const organizationId = organization.id;
  const tableColumns = ["User", "Email", "Joined", "Actions"];
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full overflow-hidden">
      <Suspense
        fallback={
          <div className="space-y-6 w-full">
            <ToolbarSkeleton />
            <DataTableSkeleton columnCount={tableColumns.length} rowCount={5} hasActionColumn={true} />
          </div>
        }
      >
        <TeamTable organizationId={organizationId} />
      </Suspense>
    </div>
  );
}

// Row Actions & Modals
function MemberRowActions({ member, organizationId }: { member: Member & { user: User }; organizationId: string }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

  const [selectedRole, setSelectedRole] = useState<"member" | "agent" | "admin">(
    member.role === "agent" || member.role === "admin" ? member.role : "member",
  );
  const [serverError, setServerError] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const roleModalRef = useRef<HTMLDivElement>(null);

  const roleTriggerRef = useRef<HTMLButtonElement | null>(null);
  const removeTriggerRef = useRef<HTMLButtonElement | null>(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Focus return and Keyboard interactions for Role Modal
  useEffect(() => {
    if (!isRoleModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsRoleModalOpen(false);
        setServerError("");
        roleTriggerRef.current?.focus();
        return;
      }
      if (e.key === "Tab") {
        const modal = roleModalRef.current;
        if (!modal) return;
        const focusable = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0] as HTMLElement;
        const last = focusable[focusable.length - 1] as HTMLElement;
        if (e.shiftKey && document.activeElement === first) {
          last?.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first?.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRoleModalOpen]);

  const updateRoleMutation = useMutation({
    mutationFn: () =>
      updateMemberRoleFn({
        data: { organizationId, memberId: member.id, role: selectedRole },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberQueries.members });
      setIsRoleModalOpen(false);
      setServerError("");
      roleTriggerRef.current?.focus();
    },
    onError: (error) => setServerError(error.message || "Failed to update role."),
  });

  const removeMemberMutation = useMutation({
    mutationFn: () =>
      removeMemberFn({
        data: { organizationId, memberId: member.id },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberQueries.members });
      setIsRemoveModalOpen(false);
      setServerError("");
      removeTriggerRef.current?.focus();
    },
    onError: (error) => setServerError(error.message || "Failed to remove member."),
  });

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-[5px] hover:bg-muted"
        aria-label="Member actions"
      >
        <svg
          aria-hidden="true"
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-[5px] bg-background border border-border shadow-lg focus:outline-none overflow-hidden">
          <button
            type="button"
            onClick={(e) => {
              roleTriggerRef.current = e.currentTarget;
              setIsRoleModalOpen(true);
              setIsDropdownOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
          >
            Change Role
          </button>
          <button
            type="button"
            onClick={(e) => {
              removeTriggerRef.current = e.currentTarget;
              setIsRemoveModalOpen(true);
              setIsDropdownOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            Remove
          </button>
        </div>
      )}

      {/* Change Role Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            ref={roleModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="role-modal-title"
            tabIndex={-1}
            className="w-full max-w-sm rounded-[7px] bg-background p-6 shadow-lg border border-border focus:outline-none"
          >
            <h3 id="role-modal-title" className="text-lg font-bold text-foreground">
              Change Role
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Update the access level for {member.user?.name || "this user"}.
            </p>

            <div className="mt-4">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as "member" | "agent" | "admin")}
                className="w-full rounded-[5px] border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {Object.values(ORG_ROLE)
                  .filter((role) => role !== ORG_ROLE.ADMIN)
                  .map((role) => (
                    <option key={role} value={role}>
                      {role.toUpperCase()}
                    </option>
                  ))}
              </select>
            </div>

            {serverError && <p className="mt-2 text-sm text-red-500">{serverError}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsRoleModalOpen(false);
                  setServerError("");
                  roleTriggerRef.current?.focus();
                }}
                disabled={updateRoleMutation.isPending}
                className="rounded-[5px] px-4 py-2 text-sm font-medium text-foreground hover:bg-muted border border-border transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => updateRoleMutation.mutate()}
                disabled={updateRoleMutation.isPending}
                className="rounded-[5px] bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {updateRoleMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={isRemoveModalOpen}
        onClose={() => {
          setIsRemoveModalOpen(false);
          setServerError("");
          removeTriggerRef.current?.focus();
        }}
        title="Remove Member"
        message={
          <>
            Are you sure you want to remove <strong>{member.user?.name || "this user"}</strong> from the organization?
            They will lose all access.
          </>
        }
        confirmLabel="Remove"
        variant="destructive"
        isPending={removeMemberMutation.isPending}
        onConfirm={() => removeMemberMutation.mutate()}
        error={serverError}
      />
    </div>
  );
}

// MAIN COMPONENT
function TeamTable({ organizationId }: { organizationId: string }) {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery);
  const [activeTab, setActiveTab] = useState("ALL USERS");
  const [page, setPage] = useState(1);

  const roleFilter = activeTab === "ALL USERS" ? undefined : (activeTab.toLowerCase() as "admin" | "agent" | "member");

  const membersQuery = useQuery(
    memberQueries.adminList({ organizationId, page, role: roleFilter, search: debouncedSearchQuery || undefined }),
  );
  const data = membersQuery.data;
  const members = (data?.members ?? []) as Array<Member & { user: User }>;
  const totalPages = data?.totalPages ?? 1;

  const prevSearchRef = useRef(debouncedSearchQuery);
  const prevTabRef = useRef(activeTab);

  // Reset to page 1 when search or tab changes.
  useEffect(() => {
    if (prevSearchRef.current !== debouncedSearchQuery || prevTabRef.current !== activeTab) {
      prevSearchRef.current = debouncedSearchQuery;
      prevTabRef.current = activeTab;
      setPage(1);
    }
  }, [debouncedSearchQuery, activeTab]);

  // Clamp page when dataset shrinks (e.g. search narrows on last page).
  useEffect(() => {
    if (membersQuery.isSuccess && page > totalPages) {
      setPage(totalPages);
    }
  }, [membersQuery.isSuccess, page, totalPages]);

  if (membersQuery.isPending && members.length === 0) return null;

  return (
    <div className="space-y-6 min-w-0 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Team Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Control access levels and manage system users across your platform.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsInviteModalOpen(true)}
          className="inline-flex items-center justify-center rounded-[2px] bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <svg
            aria-hidden="true"
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add User
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div className="flex items-center space-x-1 bg-muted p-1 rounded-[5px] w-full md:w-auto overflow-x-auto">
          {["ALL USERS", "ADMIN", "AGENT", "MEMBER"].map((tab) => (
            <button
              type="button"
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-xs font-bold rounded-[5px] transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <svg
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-border rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="bg-background rounded-[7px] border border-border shadow-sm overflow-hidden w-full">
        {members.length === 0 ? (
          <EmptyState icon={<Users className="w-12 h-12" />} title="No users found" className="py-20 bg-muted/50" />
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-border">
              {/* Table Header */}
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    User / Role
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-right text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border bg-background">
                {members.map((m) => {
                  const isRole = (role: string) => m.role?.toLowerCase() === role.toLowerCase();
                  const joinedDate = m.createdAt ?? m.user?.createdAt;

                  return (
                    <tr key={m.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className={`h-10 w-10 rounded-[5px] flex items-center justify-center border ${
                              isRole("admin")
                                ? "bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30"
                                : isRole("agent")
                                  ? "bg-green-100 border-green-200 text-green-700 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30"
                                  : "bg-muted border-border text-muted-foreground"
                            }`}
                          >
                            {isRole("admin") && (
                              <svg
                                aria-hidden="true"
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                              </svg>
                            )}
                            {isRole("agent") && (
                              <svg
                                aria-hidden="true"
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                              </svg>
                            )}
                            {!isRole("admin") && !isRole("agent") && (
                              <svg
                                aria-hidden="true"
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                              </svg>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-foreground">
                              {m.user?.name ?? "Unknown User"}
                            </div>
                            <div className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium mt-0.5">
                              {m.role ?? "MEMBER"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {m.user?.email ?? "-"}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(joinedDate)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <MemberRowActions member={m} organizationId={organizationId} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <MemberPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        organizationId={organizationId}
      />
    </div>
  );
}

function MemberPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 py-2">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex size-8 items-center justify-center rounded-sm border border-muted bg-background text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        title="Previous page"
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="text-sm font-medium tabular-nums">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex size-8 items-center justify-center rounded-sm border border-muted bg-background text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        title="Next page"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
