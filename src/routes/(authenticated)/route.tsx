import { createFileRoute, Link, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Building2,
  ChevronDown,
  Folder,
  HelpCircle,
  LayoutDashboard,
  MessageSquare,
  MessageSquarePlus,
  Users,
  Video,
} from "lucide-react";
import { useEffect } from "react";
import { useAppStore } from "@/store/app.store";

export const Route = createFileRoute("/(authenticated)")({
  beforeLoad: ({ context }) => {
    if (!context.authSession) throw redirect({ to: "/signin" });

    return {
      authSession: context.authSession,
    };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { authSession } = Route.useRouteContext();
  const selectedOrganization = useAppStore((state) => state.selectedOrganization);
  const navigate = useNavigate();
  const location = useLocation();

  const initSSE = useAppStore((state) => state.initSSE);
  const agentId = authSession.user.id;

  useEffect(() => {
    initSSE(agentId);
  }, [initSSE, agentId]);

  useEffect(() => {
    // Redirect to /organization if no org is selected and they aren't on the org selection page
    if (!selectedOrganization && !location.pathname.startsWith("/organization")) {
      navigate({ to: "/organization" });
    }
  }, [selectedOrganization, location.pathname, navigate]);

  // Using some dummy user data for UI matching
  // Real implementation can replace this with authSession.user
  const userName = "James Kim";
  const userDomain = "boostk.com";
  const userInitials = "JK";

  return (
    <div className="flex h-screen w-full font-sans bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-[260px] shrink-0 bg-[#e6f4fe] h-full flex flex-col border-r border-[#d4eaf9]">
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6">
          <Link to="/" className="text-[22px] font-black text-blue-600 tracking-tight">
            BOOSTK
          </Link>
        </div>

        {/* Navigation */}
        <div className="px-4 py-6 flex-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-gray-500 mb-4 px-2 tracking-wider">PLATFORM</div>
          <nav className="space-y-1">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm text-gray-700 hover:bg-blue-500 hover:text-white transition-colors group [&.active]:bg-blue-500 [&.active]:text-white"
            >
              <LayoutDashboard size={18} />
              Dashboard
            </Link>

            <Link
              to="/organization"
              activeOptions={{ exact: true }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm text-gray-700 hover:bg-blue-500 hover:text-white transition-colors group [&.active]:bg-blue-500 [&.active]:text-white"
            >
              <Building2 size={18} />
              Organization
            </Link>

            {selectedOrganization ? (
              <Link
                to="/organization/$organizationId"
                params={{ organizationId: selectedOrganization }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm text-gray-700 hover:bg-blue-500 hover:text-white transition-colors group [&.active]:bg-blue-500 [&.active]:text-white"
              >
                <Folder size={18} />
                Projects
              </Link>
            ) : (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm text-gray-400 cursor-not-allowed">
                <Folder size={18} />
                Projects
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-sm text-gray-700 hover:bg-white/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare size={18} />
                  Tickets
                </div>
                <ChevronDown size={14} className="text-gray-400" />
              </button>
              <div className="pl-11 pr-3 py-2 space-y-2">
                <Link
                  to="/chat-support"
                  className="block text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Chat Support
                </Link>
              </div>
            </div>

            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm text-gray-700 hover:bg-white/50 transition-colors"
            >
              <Video size={18} />
              Consultation
            </Link>

            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm text-gray-700 hover:bg-white/50 transition-colors"
            >
              <Users size={18} />
              Users
            </Link>

            <div className="my-4 border-t border-[#d4eaf9]"></div>

            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm text-gray-700 hover:bg-white/50 transition-colors"
            >
              <HelpCircle size={18} />
              Support
            </Link>

            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm text-gray-700 hover:bg-white/50 transition-colors"
            >
              <MessageSquarePlus size={18} />
              Feedback
            </Link>
          </nav>
        </div>

        {/* User Profile */}
        <div className="p-4">
          <button
            type="button"
            className="w-full bg-white rounded-xl p-2 flex items-center gap-3 hover:bg-blue-50 transition-colors shadow-sm text-left border border-transparent hover:border-blue-100"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">{userName}</div>
              <div className="text-[11px] text-gray-500 truncate mt-0.5">{userDomain}</div>
            </div>
            <ChevronDown size={14} className="text-gray-400 shrink-0" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
