import { Link, Route, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronDown, FlaskConical, LogOut, ScrollText, Search, Settings } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function TopBar({ children }: { children?: React.ReactNode }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  async function handleSignOut() {
    await authClient.signOut();
    navigate({ to: "/signin" });
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white px-6">
      <nav aria-label="Breadcrumb" className="flex items-center text-sm font-medium text-gray-500">
        <div className="w-57.5 h-16 flex items-center px-6 pr-12">
          <Link to="/" className="text-[22px] font-black text-blue-600 tracking-tight">
            BOOSTK
          </Link>
        </div>
        <div className="border-l flex items-center gap-2 px-4">{children}</div>
      </nav>

      <div className="ml-auto flex items-center gap-4">
        {/* Search & Notifications */}
        <button type="button" className="text-gray-500 hover:text-gray-900 transition-colors">
          <Search size={20} />
        </button>
        <button type="button" className="text-gray-500 hover:text-gray-900 transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        {/* Profile Dropdown Container */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 rounded-full hover:bg-gray-100 p-1 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 overflow-hidden border">
              {/* Fallback Initial or Avatar Image */}
              <span className="text-white text-xs flex items-center justify-center h-full font-bold">JD</span>
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Popover Menu */}
          {isOpen && (
            <>
              {/* Backdrop to close when clicking outside */}
              <button
                type="button"
                aria-label="Close menu"
                className="fixed inset-0 z-10 w-full h-full cursor-default bg-transparent"
                onClick={() => setIsOpen(false)}
              />

              <div className="absolute right-0 mt-2 w-64 rounded-lg border bg-white shadow-xl z-20 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b bg-gray-50/50">
                  <p className="font-bold text-gray-900">judaemon</p>
                  <p className="text-xs text-gray-500 truncate">judayajohnray@gmail.com</p>
                </div>

                {/* Main Actions */}
                <div className="py-1">
                  <MenuLink icon={<Settings size={16} />} label="Account preferences" />
                  <MenuLink icon={<FlaskConical size={16} />} label="Feature previews" />
                  <MenuLink icon={<ScrollText size={16} />} label="Changelog" />
                </div>

                {/* Theme Section */}
                <div className="border-t py-2 px-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Theme</p>
                  <ThemeOption label="Dark" />
                  <ThemeOption label="Light" active />
                  <ThemeOption label="Classic Dark" />
                  <ThemeOption label="System" />
                </div>

                {/* Footer */}
                <div className="border-t">
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    onClick={handleSignOut}
                  >
                    <LogOut size={16} />
                    Log out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// Helper components for cleaner code
function MenuLink({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
    >
      <span className="text-gray-400">{icon}</span>
      {label}
    </button>
  );
}

function ThemeOption({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <button type="button" className="w-full flex items-center gap-3 py-1.5 text-sm text-gray-600 hover:text-gray-900">
      <div className={`h-2 w-2 rounded-full ${active ? "bg-blue-600 ring-4 ring-blue-100" : "bg-transparent"}`} />
      {label}
    </button>
  );
}
