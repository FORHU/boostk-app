import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import type { Member, User } from "prisma/generated/client";
import { Suspense, useState } from "react";
import { z } from "zod";
import { REDIRECT_REASON } from "@/enums/enums";
import { prisma } from "@/lib/prisma";
import { hasOrgRole, ORG_ROLE } from "@/modules/auth/roles";
import { requireOrgRole } from "@/modules/organization/organization.middleware";

export const getOrgMembersFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ organizationId: z.string() }))
  .middleware([requireOrgRole(ORG_ROLE.ADMIN)])
  .handler(async ({ context }) => {
    return prisma.member.findMany({
      where: { organizationId: context.organization.id },
      include: { user: true },
      orderBy: { createdAt: "asc" as const },
    });
  });

export const memberQueries = {
  members: ["members"],
  allByOrgId: (organizationId: string) =>
    queryOptions({
      queryKey: [...memberQueries.members, organizationId],
      queryFn: () => getOrgMembersFn({ data: { organizationId } }),
    }),
};

export const Route = createFileRoute("/(app)/dashboard/org/$organizationId/teams")({
  beforeLoad: ({ context }) => {
    if (!hasOrgRole(context.role, ORG_ROLE.ADMIN)) {
      throw redirect({
        to: "/dashboard/organizations",
        search: { reason: REDIRECT_REASON.PERMISSION_DENIED },
      });
    }
  },
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(memberQueries.allByOrgId(params.organizationId));
  },
  component: OrganizationTeamsPage,
});

function OrganizationTeamsPage() {
  const { organizationId } = Route.useParams();
  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <Suspense fallback={<p className="text-muted-foreground">Loading members...</p>}>
        <TeamTable organizationId={organizationId} />
      </Suspense>
    </div>
  );
}

const formatDate = (dateInput?: Date | string | null) => {
  if (!dateInput) return "-";
  return new Date(dateInput).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
};

function getStatusBadgeClasses(status: string) {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-600 border-emerald-100";
    case "INACTIVE":
      return "bg-gray-50 text-gray-500 border-gray-200";
    default:
      return "bg-gray-50 text-gray-500 border-gray-200";
  }
}

function TeamTable({ organizationId }: { organizationId: string }) {
  const query = useSuspenseQuery(memberQueries.allByOrgId(organizationId));
  const members = (query.data ?? []) as Array<Member & { user: User }>;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ALL USERS");

  const filteredMembers = members.filter((m) => {
    const matchesTab = activeTab === "ALL USERS" || m.role?.toUpperCase() === activeTab;

    // Search query match (against name or email)
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      (m.user?.name ?? "").toLowerCase().includes(searchLower) ||
      (m.user?.email ?? "").toLowerCase().includes(searchLower);

    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Team Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Control access levels and manage system users across your platform.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-[2px] bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
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

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-1 bg-gray-100/80 p-1 rounded-[5px] self-start md:self-auto overflow-x-auto">
          {["ALL USERS", "ADMIN", "AGENT", "MEMBER"].map((tab) => (
            <button
              type="button"
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-xs font-bold rounded-[5px] transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <svg
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="bg-white rounded-[7px] border border-gray-200 shadow-sm overflow-hidden">
        {filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50">
            <svg
              aria-hidden="true"
              className="w-12 h-12 text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900">No users found</h3>
            <p className="text-sm text-gray-500 mt-1">
              {searchQuery
                ? "Try adjusting your search query."
                : `There are currently no users matching the ${activeTab} role.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider group cursor-pointer">
                    User / Role
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider group cursor-pointer">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredMembers.map((m) => {
                  const isRole = (role: string) => m.role?.toLowerCase() === role.toLowerCase();

                  const safeMember = m as unknown as { status?: string; createdAt?: string | Date };
                  const safeUser = m.user as unknown as { createdAt?: string | Date };

                  const status = safeMember.status || "ACTIVE";
                  const joinedDate = safeMember.createdAt ?? safeUser?.createdAt;

                  return (
                    <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* User & Role Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className={`h-10 w-10 rounded-[5px] flex items-center justify-center border ${
                              isRole("admin")
                                ? "bg-blue-50/50 border-blue-100 text-blue-500"
                                : isRole("agent")
                                  ? "bg-green-50/50 border-green-100 text-green-500"
                                  : "bg-gray-50 border-gray-200 text-gray-500"
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
                            <div className="text-sm font-semibold text-gray-900">{m.user?.name ?? "Unknown User"}</div>
                            <div className="text-[11px] text-gray-500 uppercase tracking-wide font-medium mt-0.5">
                              {m.role ?? "MEMBER"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-extrabold uppercase tracking-widest border ${getStatusBadgeClasses(
                            status,
                          )}`}
                        >
                          {status}
                        </span>
                      </td>

                      {/* Email Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{m.user?.email ?? "-"}</td>

                      {/* Joined Date Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(joinedDate)}</td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-[5px] hover:bg-gray-100"
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
