import { Link } from "@tanstack/react-router";
import { Bell, Search } from "lucide-react";

export function TopBar({ children }: { children?: React.ReactNode }) {
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
        <button type="button" className="text-gray-500 hover:text-gray-900 transition-colors">
          <Search size={20} />
        </button>
        <button type="button" className="text-gray-500 hover:text-gray-900 transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
}
